import { ChangeSet, EditorSelection } from "@codemirror/state";
import { SelectionObserver } from "src/editor-mode/observer";
import { selectionObserverField } from "src/editor-mode/state-fields";
import { EditorView } from "codemirror";
import { Parser } from "src/editor-mode/parser";
import { Format, TokenLevel, TokenStatus } from "src/enums";
import { PlainRange, PluginSettings, Token } from "src/types";
import { getTagRange, provideTokenRanges } from "src/editor-mode/parser/token-utils";
import { getBlocks, isBlockStart, isBlockEnd } from "src/editor-mode/doc-utils";
import { FormatterState } from "src/editor-mode/formatting";
import { supportTag } from "src/format-configs/utils";
import { isTouched } from "src/editor-mode/range-utils";
import { TagMenu } from "src/editor-mode/ui-components";
import { isSurroundedByDelimiter } from "./formatting-utils";

export class Formatter {
    view: EditorView;
    state: FormatterState;
    parser: Parser;
    selectionObserver: SelectionObserver;
    settings: PluginSettings;
    constructor(view: EditorView) {
        this.view = view;
        this.selectionObserver = view.state.field(selectionObserverField);
        this.parser = this.selectionObserver.parser;
        this.settings = this.parser.settings;
    }
    get doc() {
        return this.view.state.doc;
    }
    defineState(type: Format, tagStr?: string) {
        this.state = new FormatterState(type, this.doc, this.selectionObserver, this.settings, tagStr);
    }
    clearState() {
        (this.state as unknown as undefined) = undefined;
    }
    startFormat(type: Format, tagStr?: string, forceRemove?: boolean, showMenu?: boolean) {
        if (forceRemove) {
            tagStr = undefined;
        }
        if (!this.settings.openTagMenuAfterFormat) {
            showMenu = false;
        }
        let tokenMaps = this.selectionObserver.pickMaps(type);
        if (tokenMaps.length == 1 && !tokenMaps[0]?.length && showMenu) {
            TagMenu.create(this.view, type).showMenu();
            return;
        }
        this.defineState(type, tagStr);
        if (forceRemove) {
            this.removeAll()
        } else if (this.state.level == TokenLevel.INLINE) {
            this.formatInline();
        } else {
            this.formatBlock();
        }
        this.composeChanges();
        this.remapSelection();
        this.dispatchToView();
    }
    formatInline() {
        let state = this.state,
            tokens = this.state.tokens;
        do {
            let { curTokenMap, curRange, tagStr, precise } = state,
                firstToken = curTokenMap ? tokens[curTokenMap[0]] : null;
            if (!precise) {
                this.toggleDelim();
            } else if (!firstToken) {
                this.wrap();
            } else if (firstToken.from > curRange.from || firstToken.to < curRange.to) {
                this.extend();
            } else if (firstToken.status != TokenStatus.ACTIVE) {
                this.close(firstToken);
            } else if (tagStr !== undefined) {
                this.changeInlineTag(firstToken);
            } else if (curRange.empty) {
                this.remove(firstToken);
            } else {
                this.breakApart(firstToken);
            }
        } while (state.advance())
    }
    formatBlock() {
        do {
            this.toggleBlockTag();
        } while (this.state.advance())
    }
    /**
     * Use wrap only when the current range didn't meet any token.
     * 
     * **Exclusive to inline formatting use.**
     */
    wrap() {
        let { curRange, delimStr, tagStr } = this.state;
        // If the current selection is actually an empty cursor, attempt to use
        // word range if any.
        if (curRange.empty) {
            let cursorOffset = curRange.from;
            curRange = this.view.state.wordAt(curRange.from) ?? curRange;
            if (cursorOffset == curRange.to) {
                let shiftAmount = delimStr.length;
                if (cursorOffset == curRange.from) {
                    shiftAmount += tagStr?.length ?? 0;
                }
                this.state.pushSelectionShift(this.state.curSelectionIndex, shiftAmount);
            }
        }
        this.state.pushChange([
            { from: curRange.from, insert: delimStr + (tagStr ?? "") },
            { from: curRange.to, insert: delimStr }
        ]);
    }
    /**
     * Add corresponding closing delimiter to the token that's currently
     * inactive. Should be run when the cursor is within or the same range as
     * the token.
     * 
     * **Exclusive to inline formatting use.**
     * 
     * @param token should be in `INACTIVE` status.
     */
    close(token: Token) {
        let { delimStr, tagStr } = this.state;
        if (supportTag(token.type) && tagStr) {
            this.state.pushChange({ from: token.from + token.openLen, insert: tagStr });
        }
        this.state.pushChange({ from: token.to, insert: delimStr });
    }
    /**
     * Break the current token into two new tokens if the current range
     * was within the content range of the token and didn't touch both
     * delimiters, or narrow it if one of both delimiters was touched, or
     * behave like `remove()`. Should be run when the current selection
     * range within the token.
     * 
     * **Exclusive to inline formatting use.**
     */
    breakApart(token: Token) {
        let { openRange, tagRange, closeRange } = provideTokenRanges(token),
            { curRange, delimStr } = this.state,
            tagStr = this.doc.sliceString(tagRange.from, tagRange.to);
        // Remove opening delimiter when the current range touched it. Otherwise,
        // insert corresponding delimiter at the start offset.
        if (isTouched(curRange.from, openRange)) {
            this.state.pushChange(openRange);
        } else {
            this.state.pushChange({ from: curRange.from, insert: delimStr });
        }
        // Remove closing delimiter when the current range touched it. Otherwise,
        // insert corresponding delimiter at the end offset.
        if (isTouched(curRange.to, closeRange)) {
            this.state.pushChange(closeRange);
        } else {
            // This delimiter should be opening. To have the same tag as the original
            // we need to copy the original tag to the newly created one.
            this.state.pushChange({ from: curRange.to, insert: delimStr + tagStr });
        }
    }
    /**
     * Replace the tag of targetted token, or insert as a new if the current
     * tag was invalid or didn't exist.
     * 
     * **Exclusive to inline formatting use.**
     */
    changeInlineTag(token: Token) {
        let { tagRange } = provideTokenRanges(token),
            { tagStr, curRange, curSelectionIndex } = this.state;
        if (tagStr === undefined) { return }
        if (!token.validTag) { tagRange.to = tagRange.from }
        this.state.pushChange({ from: tagRange.from, to: tagRange.to, insert: tagStr });
        if (curRange.empty && curRange.from == tagRange.from) {
            this.state.pushSelectionShift(curSelectionIndex, tagStr.length);
        }
    }
    /**
     * Extend formatting range to cover across the tokens that are in the
     * current token map, and across the current selection. Should be run
     * with condition the selection touched at least two tokens, or a token
     * with the selection range exceeds the token range, at least one of its
     * side.
     * 
     * **Exclusive to inline formatting use.**
     */
    extend() {
        let { curRange, delimStr, tagStr, curTokenMap, mappedTokens } = this.state,
            tokens = this.parser.getTokens(this.state.level),
            firstTokenIndex = curTokenMap?.[0],
            lastTokenIndex = curTokenMap?.at(-1),
            firstToken = mappedTokens[0],
            lastToken = mappedTokens[mappedTokens.length - 1],
            isLastTokenAtEdge = false,
            fusedRange: PlainRange = { from: firstTokenIndex ?? 0, to: (lastTokenIndex ?? 0) + 1 };
        // If the start offset of the current range touches a token, then
        // eliminate only its closing delimiter.
        if (firstToken && firstToken.from <= curRange.from) {
            let { tagRange, closeRange } = provideTokenRanges(firstToken);
            fusedRange.from++;
            if (tagStr !== undefined) {
                this.state.pushChange(
                    firstToken.validTag
                        ? { from: tagRange.from, to: tagRange.to, insert: tagStr }
                        : { from: tagRange.from, insert: tagStr }
                );
            }
            this.state.pushChange(closeRange);
        } else {
            this.state.pushChange({ from: curRange.from, insert: delimStr });
        }
        if (lastToken && lastToken.to >= curRange.to) {
            isLastTokenAtEdge = true;
            fusedRange.to--;
        }
        // Tokens that don't touch one of the current range side have to be fused
        // (i.e. eliminate all of their delimiter).
        for (let i = fusedRange.from; i < fusedRange.to; i++) {
            let tokenIndex = curTokenMap?.[i];
            if (tokenIndex !== undefined) {
                this.remove(tokens[tokenIndex]);
            }
        }
        // If the end offset of the current range touches a token, then eliminate
        // only its opening delimiter.
        if (isLastTokenAtEdge) {
            let { openRange, tagRange } = provideTokenRanges(lastToken!);
            this.state.pushChange(openRange);
            if (lastToken!.validTag) {
                this.state.pushChange(tagRange);
            }
            if (lastToken!.status != TokenStatus.ACTIVE) {
                this.state.pushChange({ from: curRange.to, insert: delimStr });
            }
        } else {
            this.state.pushChange({ from: curRange.to, insert: delimStr });
        }
    }
    /** Run only when tidier formatting is switched off. */
    toggleDelim() {
        let { curRange, delimStr, tagStr } = this.state,
            delimLen = delimStr.length,
            selectedStrWithOverlappedEdge = this.doc.sliceString(curRange.from - delimLen, curRange.to + delimLen),
            selectedStr = selectedStrWithOverlappedEdge.slice(delimLen, -delimLen);
        if (isSurroundedByDelimiter(selectedStr, delimStr)) {
            this.state.pushChange([
                { from: curRange.from, to: curRange.from + delimLen },
                { from: curRange.to - delimLen, to: curRange.to }
            ]);
        } else if (isSurroundedByDelimiter(selectedStrWithOverlappedEdge, delimStr)) {
            this.state.pushChange([
                { from: curRange.from - delimLen, to: curRange.from },
                { from: curRange.to, to: curRange.to + delimLen }
            ]);
        } else {
            this.state.pushChange([
                { from: curRange.from, insert: delimStr + (tagStr ?? "") },
                { from: curRange.to, insert: delimStr }
            ]);
        }
    }
    addBlockTag(block: { start: number, end: number }) {
        let { doc } = this,
            { delimStr } = this.state,
            blockStart = doc.line(block.start),
            blockEnd = doc.line(block.end - 1),
            tagStr = this.state.tagStr ?? "";
        if (!isBlockStart(doc, blockStart)) { delimStr = "\n" + delimStr }
        this.state.pushChange({ from: blockStart.from, insert: delimStr + tagStr });
        if (!isBlockEnd(doc, blockEnd)) {
            this.state.pushChange({ from: blockEnd.to, insert: "\n" });
        }
    }
    changeBlockTag(token: Token) {
        let { tagRange } = provideTokenRanges(token),
            { tagStr } = this.state;
        this.state.pushChange({ from: tagRange.from, to: tagRange.to, insert: tagStr });
    }
    toggleBlockTag() {
        let doc = this.doc,
            blocks = getBlocks(doc, this.state.curRange),
            { mappedTokens, tagStr } = this.state;
        for (let i = 0, j = 0; i < blocks.length; i++) {
            let block = blocks[i],
                token: Token | undefined = mappedTokens[j],
                blockStart = doc.line(block.start),
                tagRange = token ? getTagRange(token) : undefined;
            if (!token || blockStart.from < token.from) {
                this.addBlockTag(block);
            } else if (token.status != TokenStatus.ACTIVE || blockStart.from > tagRange!.to + 1) {
                this.addBlockTag(block); j++;
            } else if (tagStr === undefined) {
                this.remove(token); j++;
            } else {
                this.changeBlockTag(token); j++;
            }
        }
    }
    /**
     * Remove formatting based on the token by erasing its delimiter. Should
     * be run on fused token in `extend()`, or when the cursor is empty and
     * within the token.
     */
    remove(token: Token) {
        let { openRange, tagRange, closeRange } = provideTokenRanges(token),
            removedRanges = [openRange, tagRange, closeRange];
        if (!token.validTag) { removedRanges.remove(tagRange) }
        if (token.level == TokenLevel.BLOCK && token.to > tagRange.to) { tagRange.to++ }
        this.state.pushChange(removedRanges);
    }
    removeAll() {
        do {
            let { mappedTokens } = this.state;
            mappedTokens.forEach(token => {
                this.remove(token);
            });
        } while (this.state.advance())
    }
    composeChanges() {
        return this.state.changeSet = ChangeSet.of(this.state.changes, this.state.docLen);
    }
    remapSelection() {
        let { selectionRanges, changeSet, selectionShift: selectionChanges } = this.state;
        for (let i = 0; i < selectionRanges.length; i++) {
            let range = selectionRanges[i].map(changeSet),
                shift = selectionChanges[i]?.shift;
            if (shift) {
                range = EditorSelection.range(range.to + shift, range.from + shift);
            }
            selectionRanges[i] = range;
        }
        return this.state.remappedSelection = EditorSelection.create(selectionRanges);
    }
    dispatchToView() {
        let { changeSet, remappedSelection } = this.state;
        this.view.dispatch(
            { changes: changeSet },
            { selection: remappedSelection, sequential: true }
        );
        this.clearState();
    }
}