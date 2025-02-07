import { MarkdownPostProcessor } from "obsidian";
import { SettingOpt1 } from "src/enums";
import { PreviewModeParser } from "src/preview-mode/parser";
import { CustomAlign, CustomHighlight } from "src/preview-mode/post-processor";
import { PluginSettings } from "src/types";

export class PreviewExtendedSyntax {
    private readonly query = "p, h1, h2, h3, h4, h5, h6, td, th, li:not(:has(p)), .callout-title-inner";
    private customAlign = new CustomAlign();
    private customHighlight = new CustomHighlight();
    settings: PluginSettings;
    constructor(settings: PluginSettings) {
        this.settings = Object.assign({}, settings);
    }
    private decorate(container: HTMLElement) {
        let targetedEls = container.querySelectorAll(this.query),
            parsingQueue: PreviewModeParser[] = [];
        if (container.classList.contains("table-cell-wrapper")) {
            new PreviewModeParser(container, parsingQueue).streamParse();
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
    private toBeDecorated(container: HTMLElement) {
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
    postProcess: MarkdownPostProcessor = container => {
        if (this.settings.customHighlight & SettingOpt1.PREVIEW_MODE) {
            this.customHighlight.decorate(container);
        }
        if (
            this.settings.customAlign & SettingOpt1.PREVIEW_MODE &&
            container.firstElementChild instanceof HTMLParagraphElement
        ) {
            this.customAlign.decorate(container.firstElementChild);
        }
        if (this.toBeDecorated(container)) {
            this.decorate(container);
        }
    }
}