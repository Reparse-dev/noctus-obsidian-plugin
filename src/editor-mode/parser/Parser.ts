import { ChangedRange, MainFormat, PluginSettings, StateConfig, TokenGroup } from "src/types";
import { ParserState } from "src/editor-mode/parser";
import { TokenQueue } from "src/editor-mode/parser";
import { ChangeSet, Line, Text } from "@codemirror/state";
import { Format, SettingOpt1, TokenRole, TokenStatus } from "src/enums";
import { Tokenizer } from "src/editor-mode/parser";
import { SpaceRestrictedFormats } from "src/shared-configs";
import { Tree } from "@lezer/common";
import { composeChanges, disableEscape, findShifterAt, getShifterStart, hasInterferer } from "src/editor-mode/parser/utils";
import { EditorDelimLookup } from "./configs";

export class Parser {
    private state: ParserState;
    private queue: TokenQueue = new TokenQueue();
    private reusedTokens: TokenGroup | undefined;
    isReparsing: boolean;
    tokens: TokenGroup = [];
    lastParsed = { startToken: 0, endToken: 0 };
    settings: PluginSettings;
    constructor(settings: PluginSettings) {
        this.settings = settings;
        if (!settings.editorEscape) {
            disableEscape();
        }
    }
    private defineState(config: StateConfig) {
        this.state = new ParserState(config, this.tokens);
        this.queue.attachState(this.state);
        this.shiftOffset();
    }
    private removeState() {
        this.queue.deattachState();
        (this.state as ParserState | undefined) = undefined;
    }
    private streamParse() {
        let prevLine: Line | null,
            state = this.state,
            hlOpen = this.queue.getOpen(Format.HIGHLIGHT);
        if (prevLine = this.state.prevLine) {
            state.setContext(state.getContext(prevLine));
        }
        if (hlOpen && state.globalOffset == hlOpen.to) {
            Tokenizer.colorTag(state);
        }
        state.resolveContext();
        do { this.parseLine() } while (state.nextLine())
        this.queue.clear();
        this.removeState();
    }
    private parseLine() {
        let type: MainFormat | undefined,
            state = this.state;
        if (this.settings.customAlign & SettingOpt1.EDITOR_MODE) {
            Tokenizer.align(state);
        }
        while (true) {
            if (state.isSpace()) {
                state.queue.resolve(SpaceRestrictedFormats);
            }
            let nodeType = state.processCursor();
            if (nodeType == "skipped") {
                state.skipCursorRange();
            } else if (nodeType == "hl_delim") {
                Tokenizer.highlightDelim(state);
            } else if (nodeType == "table_sep") {
                state.queue.resolveAll();
                state.advance();
            } else if (type = EditorDelimLookup[state.char]) {
                Tokenizer.delim(state, type);
            } else if (!state.advance()) {
                break;
            }
        }
    }
    initParse(doc: Text, tree: Tree) {
        this.defineState({ doc, tree, offset: 0, settings: this.settings });
        this.streamParse();
        this.lastParsed.endToken = this.tokens.length;
    }
    applyChange(doc: Text, tree: Tree, oldTree: Tree, changes: ChangeSet) {
        this.isReparsing = true;
        let changedRange = composeChanges(changes),
            offset = Math.min(oldTree.length, tree.length) + 1;
        if (changedRange) {
            offset = Math.min(offset, changedRange.from);
        }
        let config: StateConfig = { doc, tree, offset, settings: this.settings };
        this.shiftOffsetByNode(config, oldTree);
        this.filterTokens(config, oldTree, changedRange);
        this.defineState(config);
        this.streamParse();
        this.recalculateReusedTokens(changedRange);
    }
    private filterTokens(config: StateConfig, oldTree: Tree, changedRange: ChangedRange | null) {
        let start = 0,
            lastChange: number | undefined,
            filteredOut: TokenGroup;
        for (let curToken = this.tokens[start]; start < this.tokens.length; curToken = this.tokens[++start]) {
            if (curToken.to < config.offset) { continue }
            if (curToken.from >= config.offset) { break }
            if (curToken.role == TokenRole.CONTENT || curToken.role == TokenRole.CLOSE) {
                let openDelim = this.tokens[curToken.pointer],
                    content = this.tokens[curToken.pointer + 1],
                    size = 2;
                if (curToken.type != Format.HIGHLIGHT) {
                    openDelim.status = curToken.status = TokenStatus.PENDING;
                }
                openDelim.size = content.size = size;
                content.to = curToken.from;
                this.queue.push(openDelim);
                this.queue.push(content);
                lastChange ??= curToken.pointer;
            }
            if (curToken.role != TokenRole.CONTENT) { break }
        }
        this.lastParsed.startToken = lastChange ?? start;
        filteredOut = this.tokens.splice(start);
        if (changedRange && filteredOut.length) {
            if (
                hasInterferer(config.tree, changedRange.from, changedRange.changedTo) ||
                hasInterferer(oldTree, changedRange.from, changedRange.initTo)
            ) { return }
            let i = 0,
                line = config.doc.lineAt(changedRange.changedTo),
                changeLen = changedRange.length;
            while (line.number < config.doc.lines) {
                line = config.doc.line(line.number + 1);
                if (!line.text.trimEnd()) { break }
            }
            while (i < filteredOut.length && filteredOut[i].to <= line.to - changeLen) { i++ }
            if (i < filteredOut.length) { this.reusedTokens = filteredOut.slice(i) }
            config.maxLine = line.number;
        }
    }
    private shiftOffsetByNode(config: StateConfig, oldTree: Tree) {
        let newNode = findShifterAt(config.tree, config.offset),
            oldNode = findShifterAt(oldTree, config.offset),
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
            config.offset = newOffset;
            return true;
        }
        return false;
    }
    private shiftOffset() {
        if (this.state.offset == 0) { return false }
        let prevOffset = this.state.offset - 1,
            str = this.state.lineStr,
            char = str[prevOffset],
            lastToken = this.state.lastToken;
        if (char == "+" || char == "|" || char == "^" || char == "~" || char == "=") {
            while (str[prevOffset - 1] == char) { prevOffset-- }
            this.state.offset = prevOffset;
        }
        else if (
            lastToken?.type == Format.HIGHLIGHT &&
            lastToken.role == TokenRole.CONTENT &&
            lastToken.from >= this.state.line.from &&
            this.queue.isQueued(Format.HIGHLIGHT)
        ) {
            this.state.setGlobalOffset(lastToken.from);
        } else {
            return false;
        }
        return true;
    }
    private recalculateReusedTokens(changedRange: ChangedRange | null) {
        this.lastParsed.endToken = this.tokens.length;
        if (!this.reusedTokens || !changedRange) { return }
        let indexDiffer = this.tokens.length - this.reusedTokens[0].pointer,
            offsetDiffer = changedRange.changedTo - changedRange.initTo;
        for (
            let i = 0, token = this.reusedTokens[i];
            i < this.reusedTokens.length;
            token = this.reusedTokens[++i]
        ) {
            token.from += offsetDiffer;
            token.to += offsetDiffer;
            token.pointer += indexDiffer;
        }
        this.tokens = this.tokens.concat(this.reusedTokens);
        this.reusedTokens = undefined;
    }
}