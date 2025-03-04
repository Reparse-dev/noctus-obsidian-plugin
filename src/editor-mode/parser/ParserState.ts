import { Line, Text } from "@codemirror/state";
import { Tree, TreeCursor } from "@lezer/common";
import { PluginSettings, StateConfig, TokenGroup } from "src/types";
import { TokenQueue } from "src/editor-mode/parser";
import { Format, LineCtx } from "src/enums";
import { Formats } from "src/shared-configs";
import { SKIPPED_NODE_RE } from "src/editor-mode/parser/regexps";
import { findNode, getContextFromNode, isBlankLine } from "src/editor-mode/parser/utils";

export class ParserState {
    doc: Text;
    tree: Tree;
    cursor: TreeCursor | null;
    line: Line;
    /** block start */
    blkStart: boolean;
    endOfStream: number;
    offset: number;
    inlineTokens: TokenGroup;
    blockTokens: TokenGroup;
    queue: TokenQueue;
    curCtx: LineCtx = LineCtx.NONE;
    prevCtx: LineCtx = LineCtx.NONE;
    settings: PluginSettings;
    constructor(config: StateConfig, inlineTokens: TokenGroup, blockTokens: TokenGroup) {
        this.doc = config.doc;
        this.tree = config.tree;
        this.line = this.doc.lineAt(config.offset);
        this.endOfStream = this.doc.lineAt(this.tree.length).number;
        this.offset = config.offset - this.line.from;
        this.inlineTokens = inlineTokens;
        this.blockTokens = blockTokens;
        this.cursor = this.tree.cursor();
        this.settings = config.settings;
        this.nextCursor();
        // if previous line is a blank line or the
        // current line is the first line, then the current one
        // should be a block start
        let prevLine = this.prevLine;
        if (prevLine) {
            this.blkStart = isBlankLine(prevLine);
        } else {
            this.blkStart = true;
        }
    }
    /** global offset */
    get globalOffset() {
        return this.offset + this.line.from;
    }
    get linePos() {
        return this.line.number;
    }
    get lineStr() {
        return this.line.text;
    }
    get char() {
        let char = this.line.text[this.offset];
        if (!char && !this.isLastLine()) {
            return "\n";
        }
        return char ?? "";
    }
    get prevLine() {
        let linePos = this.linePos;
        if (linePos == 1) { return null }
        return this.doc.line(linePos - 1);
    }
    advance(n = 1) {
        let restLen = this.lineStr.length - this.offset;
        if (!restLen) {
            this.queue.resolve(Formats.SPACE_RESTRICTED_INLINE, false, false);
            /* this.inlineQueue.resolve(SpaceRestrictedFormats); */
            return false;
        }
        if (n > restLen) {
            this.offset += restLen;
        } else {
            this.offset += n;
        }
        return true;
    }
    setGlobalOffset(globalOffset: number) {
        if (globalOffset > this.doc.length) {
            this.line = this.doc.line(this.doc.lines);
            this.offset = this.line.to;
        } else {
            this.line = this.doc.lineAt(globalOffset);
            this.offset = globalOffset - this.line.from;
        }
    }
    isSpace(side: -1 | 0 | 1 = 0) {
        let char = this.lineStr[this.offset + side];
        return char == " " || char == "\t" || !char;
    }
    seekWhitespace(maxOffset = this.line.length) {
        let offset = this.offset;
        for (let char = this.line.text[offset]; offset < maxOffset; char = this.line.text[++offset]) {
            if (char == " " || char == "\t") {
                return offset;
            }
        }
        return null;
    }
    advanceLine(skipBlankLine = true) {
        if (this.linePos >= this.endOfStream) {
            this.queue.resolveAll(false);
            return null;
        }
        this.line = this.doc.line(this.linePos + 1);
        this.offset = 0;
        this.resolveContext();
        this.blkStart = false;
        if (skipBlankLine) {
            this.trySkipBlankLine();
        }
        return this.line;
    }
    trySkipBlankLine() {
        if (this.isBlankLine()) {
            // block start can be the line after the blank one.
            this.blkStart = true;
            // resolve all tokens that remain in the queue.
            this.queue.resolveAll(true, this.line.to);
            /* this.blockQueue.resolve(this.line.to);
            this.inlineQueue.resolveAll(this.line.to); */
            // if there is trailing blank lines, then skip them all
            while (this.linePos < this.endOfStream) {
                this.line = this.doc.line(this.linePos + 1);
                if (!this.isBlankLine()) { break }
            }
            // Is sufficient to resolve the current context once,
            // because a sequence of blank lines should have the
            // same context.
            this.resolveContext();
            return true;
        }
        // returning false indicates that the current line isn't a blank line
        return false;
    }
    isLastLine() {
        return this.line.number >= this.doc.lines;
    }
    isBlankLine() {
        return isBlankLine(this.line);
    }
    nextCursor(enter = true) {
        if (this.cursor) {
            if (this.cursor.next(enter) && this.cursor.name != "Document") { return true }
            this.cursor = null;
        }
        return false;
    }
    cursorPos(endSide: 0 | -1 = 0): "after" | "before" | "touch" | null {
        let globalOffset = this.globalOffset;
        if (!this.cursor) { return null }
        if (globalOffset < this.cursor.from) { return "after" }
        if (globalOffset > this.cursor.to + endSide) { return "before" }
        return "touch";
    }
    processCursor() {
        let cursorPos = this.cursorPos(-1);
        while (cursorPos == "before") {
            this.nextCursor();
            cursorPos = this.cursorPos(-1);
        }
        if (cursorPos != "touch") { return null }
        let nodeName = this.cursor!.name;
        if (nodeName.includes("formatting-highlight")) { return "hl_delim" }
        if (nodeName.includes("table-sep")) { return "table_sep" }
        if (SKIPPED_NODE_RE.test(nodeName)) { return "skipped" }
        return null;
    }
    skipCursorRange() {
        if (!this.cursor) { return false }
        let cursorTo = this.cursor.to - this.line.from,
        whitespaceOffset = this.seekWhitespace(cursorTo);
        if (whitespaceOffset !== null) {
            this.offset = whitespaceOffset;
            this.queue.resolve(Formats.SPACE_RESTRICTED_INLINE, false, false);
            /* this.inlineQueue.resolve(SpaceRestrictedFormats); */
        }
        this.offset = cursorTo;
        return true;
    }
    getContext(line = this.line) {
        if (line.number != this.linePos) {
            let node = findNode(
                this.tree, line.from, line.from,
                (node) => node.parent?.name == "Document"
            );
            if (node) { return getContextFromNode(node) }
        } else if (this.cursorPos() == "touch") {
            let node = this.cursor!.node;
            return getContextFromNode(node);
        }
        return LineCtx.NONE;
    }
    setContext(ctx: LineCtx) {
        this.prevCtx = this.curCtx;
        this.curCtx = ctx;
    }
    resolveContext() {
        while (this.cursorPos() == "before") { this.nextCursor() }
        this.setContext(this.getContext());
        let isSkip = false,
            toBeResolved = false,
            includesHl = false,
            offset = this.line.from;
        switch (this.curCtx) {
            case LineCtx.HR_LINE:
            case LineCtx.CODEBLOCK:
            case LineCtx.TABLE_DELIM:
                isSkip = true;
                toBeResolved = true;
                break;
            case LineCtx.BLOCKQUOTE:
                if (this.prevCtx != LineCtx.BLOCKQUOTE) {
                    toBeResolved = true;
                }
                break;
            case LineCtx.LIST_HEAD:
                includesHl = true;
            // eslint-disable-next-line no-fallthrough
            case LineCtx.HEADING:
            case LineCtx.FOOTNOTE_HEAD:
                toBeResolved = true;
                break;
        }
        switch (this.prevCtx) {
            case LineCtx.HEADING:
            case LineCtx.TABLE:
                toBeResolved = true;
                offset -= 1;
        }
        if (!this.offset) {
            if (toBeResolved) {
                this.queue.resolve(Formats.ALL_BLOCK, false, false, offset);
                this.queue.resolve(Formats.NON_BUILTIN_INLINE, false, false, offset);
                this.blkStart = true;
            }
            if (includesHl) { this.queue.resolve([Format.HIGHLIGHT], false, false, offset) }
        }
        if (isSkip) { this.skipCursorRange() }
        if (this.curCtx) { this.nextCursor() }
    }
}