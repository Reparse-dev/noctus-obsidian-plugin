import { DelimLookup, FormatRules } from "src/shared-configs";
import { Format } from "src/enums";
import { MainFormat2 } from "src/types";
import { SkippedClasses } from "src/preview-mode/configs";
import { hasClasses, isWhitespace } from "src/preview-mode/utils";

export class PreviewModeParser {
    root: Element;
    walker: TreeWalker;
    offset = 0;
    curNode: Node;
    nodeChanged = false;
    stack: MainFormat2[] = [];
    queue: { [F in MainFormat2]: Range | null } = {
        [Format.INSERTION]: null,
        [Format.SPOILER]: null,
        [Format.SUPERSCRIPT]: null,
        [Format.SUBSCRIPT]: null
    }
    parsingQueue: PreviewModeParser[];
    constructor(root: Element, parsingQueue: PreviewModeParser[]) {
        this.root = root;
        this.walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
        this.walker.nextNode();
        this.curNode = this.walker.currentNode;
        this.parsingQueue = parsingQueue;
    }
    streamParse() {
        do {
            if (this.curNode instanceof Text) {
                this.offset = 0;
                this.parseTextNode();
            } else if (this.curNode instanceof Element) {
                if (this.isSkipped(this.curNode)) {
                    this.resolve(Format.SUPERSCRIPT);
                    this.resolve(Format.SUBSCRIPT);
                } else {
                    this.parsingQueue.push(new PreviewModeParser(this.curNode, this.parsingQueue));
                    if (/\s/.test(this.curNode.textContent ?? "")) {
                        this.resolve(Format.SUPERSCRIPT);
                        this.resolve(Format.SUBSCRIPT);
                    }
                }
            }
        } while (this.nextNode())
        this.forceResolveAll();
    }
    parseTextNode() {
        let str = this.curNode.textContent ?? "";
        while (!this.nodeChanged && this.offset < str.length) {
            let char = str[this.offset],
                type = DelimLookup[char];
            if (char == " " || char == "\n" || char == "\t") {
                this.resolve(Format.SUPERSCRIPT);
                this.resolve(Format.SUBSCRIPT);
                this.offset++;
                continue;
            }
            if (!type || type == Format.HIGHLIGHT) {
                this.offset++;
                continue;
            }
            this.tokenize(type);
        }
        this.nodeChanged = false;
    }
    finalize(type: MainFormat2, open: Range, content: Range, close: Range) {
        let wrapper = FormatRules[type].getEl();
        close.deleteContents();
        content.surroundContents(wrapper);
        open.deleteContents();
        if (wrapper == this.curNode.nextSibling) {
            this.nextNode();
        } else {
            this.prevNode();
        }
        this.nodeChanged = true;
    }
    resolve(type: MainFormat2, close?: Range) {
        if (close && this.queue[type]) {
            let content = new Range(),
                open = this.queue[type];
            content.setStart(open.endContainer, open.endOffset);
            content.setEnd(close.startContainer, close.startOffset);
            this.stack.findLast((t, i) => {
                this.queue[t] = null;
                if (t == type) {
                    this.stack.splice(i);
                    return true;
                }
            });
            this.finalize(type, open, content, close);
        } else {
            this.queue[type] = null;
            this.stack = this.stack.filter(t => t != type);
        }
    }
    forceResolveAll() {
        for (let i = Format.INSERTION as MainFormat2; i <= Format.SUPERSCRIPT; i++) {
            this.resolve(i);
        }
    }
    tokenize(type: MainFormat2) {
        let { length: reqLength, char } = FormatRules[type],
            str = this.curNode.textContent!,
            length = 0,
            hasOpen = !!this.queue[type],
            hasSpaceBefore = isWhitespace(str[this.offset - 1]),
            hasSpaceAfter: boolean;
        while (str[this.offset] == char) { this.offset++, length++ }
        hasSpaceAfter = isWhitespace(str[this.offset]);
        if (hasOpen && hasSpaceBefore || !hasOpen && hasSpaceAfter || length != reqLength) { return false }
        let range = new Range();
        range.setStart(this.curNode, this.offset - length);
        range.setEnd(this.curNode, this.offset);
        this.pushDelim(type, range);
        return true;
    }
    pushDelim(type: MainFormat2, delim: Range) {
        if (this.queue[type]) {
            this.resolve(type, delim);
        } else {
            this.queue[type] = delim;
            this.stack.push(type);
        }
    }
    nextNode() {
        if (this.walker.nextSibling()) {
            this.curNode = this.walker.currentNode;
            return true;
        } else {
            return false;
        }
    }
    prevNode() {
        if (this.walker.previousSibling()) {
            this.curNode = this.walker.currentNode;
            return true;
        }
        return false;
    }
    isSkipped(el: Element) {
        return (
            hasClasses(el, SkippedClasses) ||
            el.tagName == "CODE" || el.tagName == "IMG"
        );
    }
}