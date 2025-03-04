import { ChangedRange, PlainRange, PluginSettings, StateConfig, TokenGroup } from "src/types";
import { ParserState, TokenQueue } from "src/editor-mode/parser";
import { ChangeSet, Line, Text } from "@codemirror/state";
import { Format, MarkdownViewMode, TokenLevel } from "src/enums";
import { Tokenizer } from "src/editor-mode/parser";
import { Formats } from "src/shared-configs";
import { Tree } from "@lezer/common";
import { composeChanges, disableEscape, findShifterAt, getBlockEndAt, getShifterStart, hasInterferer, provideTokenRanges, reenableEscape } from "src/editor-mode/parser/utils";
import { EditorDelimLookup } from "src/editor-mode/parser/configs";
import { colorTag, customSpanTag, fencedDivTag } from "src/editor-mode/parser/tokenizer-components";

export class Parser {
    private state: ParserState;
    private queue: TokenQueue = new TokenQueue();
    isInitializing: boolean;
    isReparsing: boolean;
    inlineTokens: TokenGroup = [];
    blockTokens: TokenGroup = [];
    reparsedRanges: Record<TokenLevel, { from: number, initTo: number, changedTo: number }>;
    lastStreamPoint: PlainRange = { from: 0, to: 0 };
    settings: PluginSettings;
    constructor(settings: PluginSettings) {
        this.settings = settings;
        if (!settings.editorEscape) {
            disableEscape();
        }
    }
    getTokens(level: TokenLevel) {
        return level == TokenLevel.INLINE
            ? this.inlineTokens 
            : this.blockTokens;
    }
    initParse(doc: Text, tree: Tree) {
        if (this.settings.editorEscape) {
            reenableEscape();
        } else {
            disableEscape();
        }
        this.lastStreamPoint.from = 0;
        this.inlineTokens = [];
        this.blockTokens = [];
        this.defineState({ doc, tree, offset: 0, settings: this.settings });
        this.streamParse();
        this.isInitializing = true;  
        this.isReparsing = false;
        this.reparsedRanges = {
            [TokenLevel.INLINE]: { from: 0, initTo: 0, changedTo: this.inlineTokens.length },
            [TokenLevel.BLOCK]: { from: 0, initTo: 0, changedTo: this.blockTokens.length }
        }
    }
    applyChange(doc: Text, tree: Tree, oldTree: Tree, changes: ChangeSet) {
        this.isReparsing = true;
        this.isInitializing = false;
        let changedRange = composeChanges(changes),
            offset = Math.min(oldTree.length, tree.length) + 1;
        if (changedRange) {
            offset = Math.min(offset, changedRange.from);
        }
        let config: StateConfig = { doc, tree, offset, settings: this.settings };
        this.defineState(config, oldTree);
        let blockEndLine = changedRange && !this.checkInterferer(oldTree, changedRange)
            ? getBlockEndAt(doc, changedRange.changedTo)
            : getBlockEndAt(doc, tree.length);
        let reusedTokens: Record<"inline" | "block", TokenGroup> = {
            inline: this.getReusedTokens(this.filterTokens(this.inlineTokens, this.reparsedRanges[TokenLevel.INLINE]), changedRange, blockEndLine),
            block: this.getReusedTokens(this.filterTokens(this.blockTokens, this.reparsedRanges[TokenLevel.BLOCK]), changedRange, blockEndLine)
        };
        this.shiftOffset();
        this.mapReusedTokens(reusedTokens.inline, changedRange);
        this.mapReusedTokens(reusedTokens.block, changedRange);
        this.state.endOfStream = blockEndLine.number;
        this.streamParse();
        this.reparsedRanges[TokenLevel.INLINE].changedTo = this.inlineTokens.length;
        this.reparsedRanges[TokenLevel.BLOCK].changedTo = this.blockTokens.length;
        this.inlineTokens = this.inlineTokens.concat(reusedTokens.inline);
        this.blockTokens = this.blockTokens.concat(reusedTokens.block);
    }
    private defineState(config: StateConfig, oldTree?: Tree) {
        this.state = new ParserState(config, this.inlineTokens, this.blockTokens);
        this.queue.attachState(this.state);
        if (oldTree) { this.shiftOffsetByNode(oldTree) }
    }
    private shiftOffsetByNode(oldTree: Tree) {
        let oldOffset = this.state.globalOffset,
            newNode = findShifterAt(this.state.tree, oldOffset),
            oldNode = findShifterAt(oldTree, oldOffset),
            newOffset: number | null = null;
        if (newNode) {
            newOffset = getShifterStart(newNode);
        }
        if (oldNode) {
            let oldStart = getShifterStart(oldNode);
            if (oldStart !== null && (newOffset === null || oldStart < newOffset)) {
                newOffset = oldStart;
            }
        }
        if (newOffset !== null) {
            this.state.setGlobalOffset(newOffset);
            return true;
        }
        return false;
    }
    private shiftOffset() {
        if (this.state.offset == 0) { return false }
        let prevOffset = this.state.offset - 1,
            str = this.state.lineStr,
            char = str[prevOffset];
        if (char == "+" || char == "|" || char == "^" || char == "~" || char == "=" || char == "!" || char == ":") {
            while (str[prevOffset - 1] == char) { prevOffset-- }
            this.state.offset = prevOffset;
            return true;
        }
        return false;
    }
    private removeState() {
        this.queue.detachState();
        (this.state as ParserState | undefined) = undefined;
    }
    private streamParse() {
        let prevLine: Line | null,
            state = this.state;
        this.lastStreamPoint.from = state.globalOffset;
        // get previous line context
        if (prevLine = this.state.prevLine) {
            state.setContext(state.getContext(prevLine));
        }
        // try to skip current line if it is a blank line
        if (!state.trySkipBlankLine()) {
            // if not, resolve the current line context
            state.resolveContext();
        }
        do { this.parseLine() } while (state.advanceLine())
        this.lastStreamPoint.to = state.globalOffset;
        this.queue.clear();
        this.removeState();
    }
    private parseLine() {
        let state = this.state;
        if (this.settings.fencedDiv & MarkdownViewMode.EDITOR_MODE &&
            this.state.offset == 0 && state.blkStart
        ) {
            Tokenizer.block(state, Format.FENCED_DIV);
        }
        while (true) {
            if (state.isSpace()) {
                state.queue.resolve(Formats.SPACE_RESTRICTED_INLINE, false, false);
            }
            let nodeType = state.processCursor(),
                type = EditorDelimLookup[state.char];
            if (nodeType == "skipped") {
                state.skipCursorRange();
            } else if (nodeType == "table_sep") {
                state.queue.resolve(Formats.ALL_INLINE, false, false);
                state.advance();
            } else if (type && (type != Format.HIGHLIGHT || nodeType == "hl_delim")) {
                Tokenizer.inline(state, type);
            } else if (!state.advance()) {
                break;
            }
        }
    }
    private checkInterferer(oldTree: Tree, changedRange: ChangedRange) {
        return (
            hasInterferer(this.state.tree, changedRange.from, changedRange.changedTo) ||
            hasInterferer(oldTree, changedRange.from, changedRange.initTo)
        );
    }
    private filterTokens(tokens: TokenGroup, reparsedRange: typeof this.reparsedRanges[TokenLevel]) {
        let index = 0,
            reparsedFrom: number | undefined,
            reparsedTo: number | undefined,
            offset = this.state.globalOffset;
        for (let curToken = tokens[index]; index < tokens.length; curToken = tokens[++index]) {
            // Keep find token touched by the current offset
            if (curToken.to < offset) { continue }
            let { openRange, tagRange } = provideTokenRanges(curToken);
            if (openRange.to < offset) {
                curToken.to = curToken.from;
                curToken.closeLen = 0;
                reparsedFrom ??= index;
                this.queue.push(curToken);
                if (curToken.tagLen && tagRange.to >= offset) {
                    curToken.tagLen = offset - tagRange.from;
                    if (curToken.type == Format.HIGHLIGHT) { colorTag(this.state, curToken) }
                    else if (curToken.type == Format.CUSTOM_SPAN) { customSpanTag(this.state, curToken) }
                    else if (curToken.type == Format.FENCED_DIV) { fencedDivTag(this.state, curToken) }
                }
            } else {
                reparsedTo = index + 1;
                break;
            }
        }
        reparsedFrom ??= index;
        reparsedRange.from = reparsedFrom;
        reparsedRange.initTo = reparsedTo ?? index;
        return tokens.splice(index);
    }
    private getReusedTokens(filteredOut: TokenGroup, changedRange: ChangedRange | null, blockEndLine: Line) {
        let curIndex = 0,
            changedLen = changedRange?.length;
        if (changedLen === undefined) { return [] }
        while (
            curIndex < filteredOut.length &&
            filteredOut[curIndex].to <= blockEndLine.to - changedLen
        ) { curIndex++ }
        return filteredOut.slice(curIndex);
    }
    private mapReusedTokens(reusedTokens: TokenGroup, changedRange: ChangedRange | null) {
        if (!reusedTokens || !changedRange) { return }
        let offsetDiffer = changedRange.changedTo - changedRange.initTo;
        for (
            let i = 0, token = reusedTokens[i];
            i < reusedTokens.length;
            token = reusedTokens[++i]
        ) {
            token.from += offsetDiffer;
            token.to += offsetDiffer;
        }
    }
}