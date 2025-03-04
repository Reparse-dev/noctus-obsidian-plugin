import { MarkdownPostProcessor } from "obsidian";
import { MarkdownViewMode } from "src/enums";
import { PreviewModeParser } from "src/preview-mode/parser";
import { FencedDiv, CustomHighlight, CustomSpan } from "src/preview-mode/post-processor/components";
import { PluginSettings } from "src/types";

export class PreviewExtendedSyntax {
    private readonly query = "p, h1, h2, h3, h4, h5, h6, td, th, li:not(:has(p)), .callout-title-inner";
    private customHighlight: CustomHighlight;
    private customSpan: CustomSpan;
    private fencedDiv: FencedDiv;
    settings: PluginSettings;
    constructor(settings: PluginSettings) {
        this.settings = settings;
        this.customHighlight = new CustomHighlight(settings);
        this.customSpan = new CustomSpan(settings);
        this.fencedDiv = new FencedDiv(settings);
    }
    private parseInline(targetEl: HTMLElement) {
        let targetedEls = targetEl.querySelectorAll(this.query),
            parsingQueue: PreviewModeParser[] = [];
        if (targetEl.classList.contains("table-cell-wrapper")) {
            new PreviewModeParser(targetEl, parsingQueue).streamParse();
            for (let i = 0; i < parsingQueue.length; i++) {
                parsingQueue[i].streamParse();
                if (i >= 100) { throw Error(`${parsingQueue}`) }
            }
            return;
        }
        for (let i = 0; i < targetedEls.length; i++) {
            new PreviewModeParser(targetedEls[i], parsingQueue).streamParse();
            for (let i = 0; i < parsingQueue.length; i++) {
                parsingQueue[i].streamParse();
                if (i >= 100) { throw Error(`${parsingQueue}`) }
            }
            parsingQueue.splice(0);
        }
    }
    private isTargeted(container: HTMLElement) {
        let firstChild = container.firstElementChild;
        if (
            container.classList.contains("table-cell-wrapper") ||
            firstChild && (
            firstChild instanceof HTMLParagraphElement ||
            firstChild instanceof HTMLTableElement ||
            firstChild instanceof HTMLUListElement ||
            firstChild instanceof HTMLOListElement ||
            firstChild.tagName == "BLOCKQUOTE" ||
            firstChild.classList.contains("callout")
        )) { return true }
        return false;
    }
    private decorate(container: HTMLElement) {
        if (this.settings.customHighlight & MarkdownViewMode.PREVIEW_MODE) {
            this.customHighlight.decorate(container);
        }
        if (
            this.settings.fencedDiv & MarkdownViewMode.PREVIEW_MODE &&
            container.firstElementChild instanceof HTMLParagraphElement
        ) {
            this.fencedDiv.decorate(container.firstElementChild);
        }
        if (this.isTargeted(container)) {
            this.parseInline(container);
        }
        if (this.settings.customSpan & MarkdownViewMode.PREVIEW_MODE) {
            this.customSpan.decorate(container);
        }
    }
    postProcess: MarkdownPostProcessor = (container) => {
        let isWholeDoc = container.classList.contains("markdown-preview-view");
        if (isWholeDoc) {
            if (!this.settings.decoratePDF) { return }
            let sectionEls = container.querySelectorAll<HTMLElement>("&>div");
            for (let i = 0; i < sectionEls.length; i++) {
                this.decorate(sectionEls[i]);
            }
        } else {
            this.decorate(container);
        }
    }
}