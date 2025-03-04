import { Formats, InlineRules } from "src/shared-configs";
import { Format } from "src/enums";
import { InlineFormat } from "src/types";
import { SKIPPED_CLASSES, PreviewDelimLookup } from "src/preview-mode/configs";
import { hasClasses, isWhitespace } from "src/preview-mode/utils";

export class PreviewModeParser {
    root: Element;
    walker: TreeWalker;
    offset = 0;
    curNode: Node;
    nodeChanged = false;
    stack: InlineFormat[] = [];
    queue: Partial<Record<InlineFormat, Range>> = {}
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
                } else if (this.curNode.textContent) {
                    this.parsingQueue.push(new PreviewModeParser(this.curNode, this.parsingQueue));
                    if (/\s/.test(this.curNode.textContent)) {
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
                type = PreviewDelimLookup[char];
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
    finalize(type: InlineFormat, open: Range, content: Range, close: Range) {
        let wrapper = InlineRules[type].getEl();
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
    resolve(type: InlineFormat, close?: Range) {
        if (close && this.queue[type]) {
            let content = new Range(),
                open = this.queue[type];
            content.setStart(open.endContainer, open.endOffset);
            content.setEnd(close.startContainer, close.startOffset);
            this.stack.findLast((t, i) => {
                delete this.queue[t];
                if (t == type) {
                    this.stack.splice(i);
                    return true;
                }
            });
            this.finalize(type, open, content, close);
        } else {
            delete this.queue[type];
            this.stack = this.stack.filter(t => t != type);
        }
    }
    forceResolveAll() {
        for (let i = 0; i < Formats.ALL_INLINE.length; i++) {
            this.resolve(Formats.ALL_INLINE[i]);
        }
    }
    tokenize(type: InlineFormat) {
        let { length: reqLength, char } = InlineRules[type],
            str = this.curNode.textContent!,
            length = 0,
            hasOpen = !!this.queue[type],
            hasSpaceBefore = isWhitespace(str[this.offset - 1]),
            hasSpaceAfter: boolean;
        while (str[this.offset] == char) { this.offset++; length++ }
        hasSpaceAfter = isWhitespace(str[this.offset]);
        if (hasOpen && hasSpaceBefore || !hasOpen && hasSpaceAfter || length != reqLength) { return false }
        let range = new Range();
        range.setStart(this.curNode, this.offset - length);
        range.setEnd(this.curNode, this.offset);
        this.pushDelim(type, range);
        return true;
    }
    pushDelim(type: InlineFormat, delim: Range) {
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
            hasClasses(el, SKIPPED_CLASSES) ||
            el.tagName == "CODE" || el.tagName == "IMG"
        );
    }
}