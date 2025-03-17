import { InlineRules } from "src/format-configs";
import { COLOR_TAG_RE } from "src/preview-mode/regexp";
import { Format } from "src/enums";
import { PluginSettings } from "src/types";

export class CustomHighlight {
    settings: PluginSettings;
    constructor(settings: PluginSettings) {
        this.settings = settings;
    }
    decorate(el: HTMLElement) {
        let markElements = el.querySelectorAll<HTMLElement>("mark"),
            baseCls = InlineRules[Format.HIGHLIGHT].class;
        markElements.forEach((el) => {
            if (!(el.firstChild instanceof Text && el.firstChild.textContent)) { return }
            let color = COLOR_TAG_RE.exec(el.firstChild.textContent)?.[1];
            if (color) {
                el.classList.add(baseCls, `${baseCls}-${color}`);
                if (this.settings.showHlTagInPreviewMode) { return }
                let from = 0, to = from + color.length + 2;
                el.firstChild.replaceData(from, to - from, "");
            }
        });
    }
}