import { MarkdownPostProcessor } from "obsidian";
import { PreviewModeParser } from "src/preview-mode/parser";
import { CustomAlign, CustomHighlight } from "src/preview-mode/post-processor";

export class PreviewExtendedSyntax {
    constructor() {
    }
    private readonly query = "p, h1, h2, h3, h4, h5, h6, td, th, li:not(:has(p)), .callout-title-inner";
    private customAlign = new CustomAlign();
    private customHighlight = new CustomHighlight();
    private decorate(container: HTMLElement) {
        let targetedEls = container.querySelectorAll(this.query),
            parsingQueue: PreviewModeParser[] = [];
        for (let i = 0; i < targetedEls.length; i++) {
            new PreviewModeParser(targetedEls[i], parsingQueue).streamParse();
            for (let i = 0; i < parsingQueue.length; i++) {
                parsingQueue[i].streamParse();
                if (i >= 100) { throw Error(`${parsingQueue}`) }
            }
            parsingQueue.splice(0);
        }
    }
    private toBeDecorated(container: HTMLElement) {
        let firstChild = container.firstElementChild;
        if (firstChild && (
            firstChild instanceof HTMLParagraphElement ||
            firstChild instanceof HTMLTableElement ||
            firstChild instanceof HTMLUListElement ||
            firstChild instanceof HTMLOListElement ||
            firstChild.tagName == "BLOCKQUOTE" ||
            firstChild.classList.contains("callout")
        )) { return true }
        return false;
    }
    postProcess: MarkdownPostProcessor = container => {
        this.customHighlight.decorate(container);
        if (container.firstElementChild instanceof HTMLParagraphElement) {
            this.customAlign.decorate(container.firstElementChild);
        }
        if (this.toBeDecorated(container)) {
            this.decorate(container);
        }
    }
}