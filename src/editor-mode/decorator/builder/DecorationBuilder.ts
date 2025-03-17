import { ChangeDesc, ChangeSet, EditorState, Range, RangeSet, Text, Transaction } from "@codemirror/state";
import { Decoration, EditorView, ViewUpdate } from "@codemirror/view";
import { Parser } from "src/editor-mode/parser";
import { Format, MarkdownViewMode, TokenStatus } from "src/enums";
import { REVEALED_SPOILER_DECO } from "src/editor-mode/decorator/decorations";
import { BlockFormat, PlainRange, InlineFormat, Token, TokenGroup, TokenDecoration, PluginSettings } from "src/types";
import { ColorButton } from "src/editor-mode/decorator/widgets";
import { BlockRules, InlineRules } from "src/format-configs";
import { DecorationHolder, DelimOmitter, LineBreakReplacer, TokensCatcher } from "src/editor-mode/decorator/builder";
import { createInlineDecoRange, createLineDecoRange } from "src/editor-mode/decorator/decorator-utils";
import { isEditorModeChanged } from "src/editor-mode/editor-utils";
import { getLineAt, iterLine, sliceStrFromLine } from "src/editor-mode/doc-utils";
import { getTagRange, iterTokenGroup } from "src/editor-mode/parser/token-utils"
import { trimTag } from "src/utils";
import { SelectionObserver } from "src/editor-mode/observer";
import { editorLivePreviewField } from "obsidian";
import { refresherAnnot } from "src/editor-mode/annotations";
import { activityFacet } from "src/editor-mode/facets";

export class DecorationBuilder {
    readonly parser: Parser;
    readonly omitter: DelimOmitter;
    readonly catcher: TokensCatcher;
    readonly lineBreakReplacer: LineBreakReplacer;
    readonly selectionObserver: SelectionObserver;
    readonly holder: DecorationHolder;
    readonly settings: PluginSettings;
    readonly indexCaches = {
        linePos: { number: 1 }, // 1-based
        inlineToken: { number: 0 }, // 0-based
        blockToken: { number: 0 } // 0-based
    }
    constructor(parser: Parser, selectionObserver: SelectionObserver) {
        this.parser = parser;
        this.selectionObserver = selectionObserver;
        this.settings = parser.settings;
        this.omitter = new DelimOmitter(this.settings, selectionObserver);
        this.catcher = new TokensCatcher();
        this.lineBreakReplacer = new LineBreakReplacer(parser);
        this.holder = new DecorationHolder();
    }
    /**
     * Main decorations hold basic formatting style of the tokens.
     * 
     * Intended to build non-height-altering decorations. So, it doesn't
     * include line breaks and fenced div opening omitter. (It runs only in
     * the view update)
     */
    buildMain(view: EditorView, state: EditorState) {
        this.buildInline(state, view.visibleRanges);
        this.buildBlock(state, view.visibleRanges);
    }
    /**
     * Supplementary decorations consist omitted delimiter of inline tokens,
     * color buttons for the highlight, and revealed spoiler when touched the
     * cursor or selection.
     * 
     * Intended to build non-height-altering decorations. So, it doesn't
     * include line breaks and fenced div opening omitter. (It runs only in
     * the view update)
     */
    buildSupplementary(isLivePreview: boolean) {
        if (isLivePreview) {
            this.omitInlineDelim(this.catcher.activeTokens);
            this.createColorBtnWidgets(this.catcher.hlTokens);
            this.revealSpoiler(this.catcher.spoilerTokens);
        } else {
            this.holder.colorBtnSet = this.holder.revealedSpoilerSet = RangeSet.empty;
        }
    }
    /**
     * Runs once on editor intialization, should be inside the view update
     * (i.e. the ViewPlugin update).
     */
    onViewInit(view: EditorView) {
        let state = view.state,
            isLivePreview = state.field(editorLivePreviewField);
        this.buildMain(view, state);
        this.buildSupplementary(isLivePreview);
    }
    onViewUpdate(update: ViewUpdate) {
        let state = update.state,
            view = update.view,
            isLivePreview = state.field(editorLivePreviewField),
            activityRecorder = state.facet(activityFacet);
        if (activityRecorder.verify("builder-view-update", "parse", true) || update.viewportMoved) {
            this.buildMain(view, state);
        }
        if (activityRecorder.verify("builder-view-update", "observe", true) || update.viewportMoved) {
            this.buildSupplementary(isLivePreview);
        }
    }
    /**
     * Runs once on editor intialization, should be inside the state update
     * (i.e. the StateField update).
     */
    onStateInit(state: EditorState) {
        let isLivePreview = state.field(editorLivePreviewField);
        if (isLivePreview) {
            this.omitFencedDivOpening();
        }
        this.replaceLineBreaks(state.doc);
    }
    onStateUpdate(transaction: Transaction) {
        let state = transaction.state,
            isLivePreview = state.field(editorLivePreviewField),
            isRefreshed = transaction.annotation(refresherAnnot),
            isModeChanged = isEditorModeChanged(state, transaction.startState),
            activityRecorder = state.facet(activityFacet);
        if (activityRecorder.verify("builder-state-update", "parse")) {
            this.replaceLineBreaks(transaction.newDoc, transaction.changes);
        }
        if (isModeChanged || isRefreshed) {
            this.selectionObserver.restartObserver(transaction.newSelection, transaction.docChanged);
            this.holder.blockOmittedSet = RangeSet.empty;
        }
        if (!isLivePreview) {
            this.removeOmitter();
        } else if (activityRecorder.verify("builder-state-update", "observe") || isModeChanged) {
            this.omitFencedDivOpening(transaction.changes);
        }
    }
    buildInline(state: EditorState, visibleRanges: readonly PlainRange[]) {
        let inlineDecoRanges: Range<TokenDecoration>[] = [],
            activeTokens: TokenGroup = [],
            hlTokens: TokenGroup = [],
            spoilerTokens: TokenGroup = [];
        iterTokenGroup({
            tokens: this.parser.inlineTokens,
            ranges: visibleRanges,
            indexCache: this.indexCaches.inlineToken,
            callback: (token) => {
                if (token.status != TokenStatus.ACTIVE) { return }
                if (token.type == Format.HIGHLIGHT) { hlTokens.push(token) }
                if (token.type == Format.SPOILER) { spoilerTokens.push(token) }
                inlineDecoRanges.push(this.transformInlineToken(token, state.doc));
                activeTokens.push(token);
            },
        });
        this.catcher.catch(activeTokens, hlTokens, spoilerTokens);
        return this.holder.inlineSet = Decoration.set(inlineDecoRanges);
    }
    buildBlock(state: EditorState, visibleRanges: readonly PlainRange[]) {
        let lineDecoRanges: Range<TokenDecoration>[] = [];
        iterTokenGroup({
            tokens: this.parser.blockTokens,
            ranges: visibleRanges,
            indexCache: this.indexCaches.blockToken,
            callback: (token) => {
                if (token.status != TokenStatus.ACTIVE) { return }
                lineDecoRanges.push(...this.transformBlockToken(token, state.doc));
            },
        });
        return this.holder.blockSet = Decoration.set(lineDecoRanges);
    }
    transformInlineToken(token: Token, doc: Text) {
        let cls = "cm-" + InlineRules[token.type as InlineFormat].class;
        if (token.tagLen) {
            let line = getLineAt(doc, token.from, this.indexCaches.linePos),
                tagRange = getTagRange(token),
                tagStr = sliceStrFromLine(line, tagRange.from + 1, tagRange.to - 1);
            if (token.type == Format.CUSTOM_SPAN) {
                tagStr = trimTag(tagStr);
                cls += " " + tagStr;
            } else {
                cls += " " + cls + "-" + tagStr;
            }
        }
        return createInlineDecoRange(token, cls);
    }
    transformBlockToken(token: Token, doc: Text) {
        let baseCls = "cm-" + BlockRules[token.type as BlockFormat].class,
            openLine = getLineAt(doc, token.from, this.indexCaches.linePos),
            tagRange = getTagRange(token),
            tagStr = trimTag(sliceStrFromLine(openLine, tagRange.from, tagRange.to)),
            openDelimCls = baseCls + " cm-fenced-div-start",
            contentCls = baseCls + " " + tagStr,
            ranges: Range<TokenDecoration>[] = [createLineDecoRange(token, openDelimCls, openLine)];
        iterLine({
            doc, fromLn: openLine.number + 1,
            callback(line) {
                if (line.to > token.to) { return false }
                if (line.to == token.to && !line.text.trimEnd()) { return false }
                let decoRange = createLineDecoRange(token, contentCls, line);
                ranges.push(decoRange);
            },
        });
        return ranges;
    }
    createColorBtnWidgets(hlTokens: TokenGroup) {
        if (!this.settings.colorButton) {
            return this.holder.colorBtnSet = RangeSet.empty;
        }
        let btnWidgets: Range<Decoration>[] = [];
        for (let i = 0; i < hlTokens.length; i++) {
            let token = hlTokens[i];
            if (this.selectionObserver.touchSelection(token.from, token.to)) {
                btnWidgets.push(ColorButton.of(token));
            }
        }
        return this.holder.colorBtnSet = Decoration.set(btnWidgets);
    }
    revealSpoiler(spoilerTokens: TokenGroup) {
        let revealedRanges: Range<Decoration>[] = [];
        for (let i = 0; i < spoilerTokens.length; i++) {
            let token = spoilerTokens[i];
            if (this.selectionObserver.touchSelection(token.from, token.to)) {
                revealedRanges.push(REVEALED_SPOILER_DECO.range(token.from, token.to));
            }
        }
        return this.holder.revealedSpoilerSet = Decoration.set(revealedRanges);
    }
    omitInlineDelim(activeTokens: TokenGroup) {
        return this.holder.inlineOmittedSet = this.omitter.omitInline(activeTokens);
    }
    /** Executed only in the state update. */
    replaceLineBreaks(doc: Text, changes?: ChangeSet) {
        return this.holder.lineBreaksSet = this.lineBreakReplacer.replace(doc, changes);
    }
    /** Executed only in the state update. */
    omitFencedDivOpening(changes?: ChangeDesc) {
        let isOmitted = !(this.settings.alwaysShowFencedDivTag & MarkdownViewMode.EDITOR_MODE);
        if (!isOmitted) {
            return this.holder.blockOmittedSet = RangeSet.empty;
        }
        return this.holder.blockOmittedSet = this.omitter.omitBlock(this.holder.blockOmittedSet, changes);
    }
    removeOmitter() {
        this.holder.inlineOmittedSet = this.holder.blockOmittedSet = RangeSet.empty;
    }
}