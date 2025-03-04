import { trimTag } from "src/utils";
import { FENCED_DIV } from "src/preview-mode/regexp";
import { BlockRules } from "src/shared-configs";
import { Format, MarkdownViewMode } from "src/enums";
import { PluginSettings } from "src/types";

export class FencedDiv {
    settings: PluginSettings;
    constructor(settings: PluginSettings) {
        this.settings = settings;
    }
    decorate(el: HTMLElement) {
        if (!(el.firstChild instanceof Text && el.firstChild.textContent)) { return }
        FENCED_DIV.lastIndex = 0;
        let baseCls = BlockRules[Format.FENCED_DIV].class,
            textNode = el.firstChild,
            lineBreakEl = el.querySelector("br"),
            match = FENCED_DIV.exec(textNode.textContent ?? "");
        if (match) {
            let tag = match[1]!,
                clsList = trimTag(tag).split(" ");
            el.addClass(baseCls, ...clsList);
            if (this.settings.alwaysShowFencedDivTag & MarkdownViewMode.PREVIEW_MODE) { return }
            el.removeChild(textNode);
            if (lineBreakEl) { el.removeChild(lineBreakEl) }
        }
    }
}