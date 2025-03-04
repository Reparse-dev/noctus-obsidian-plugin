import { Format } from "src/enums";
import { CUSTOM_SPAN_TAG_RE } from "src/preview-mode/regexp";
import { InlineRules } from "src/shared-configs";
import { PluginSettings } from "src/types";
import { trimTag } from "src/utils";

export class CustomSpan {
    settings: PluginSettings;
    constructor(settings: PluginSettings) {
        this.settings = settings;
    }
    decorate(el: HTMLElement) {
        let baseCls = InlineRules[Format.CUSTOM_SPAN].class,
            customSpanElements = el.querySelectorAll<HTMLElement>("." + baseCls);
        customSpanElements.forEach((el) => {
            if (!(el.firstChild instanceof Text && el.firstChild.textContent)) { return }
            let tag = CUSTOM_SPAN_TAG_RE.exec(el.firstChild.textContent)?.[1];
            if (tag) {
                let clsList = trimTag(tag).split(" ");
                el.classList.add(...clsList);
                if (this.settings.showSpanTagInPreviewMode) { return }
                let from = 0, to = from + tag.length + 2;
                el.firstChild.replaceData(from, to - from, "");
            }
        });
    }
}