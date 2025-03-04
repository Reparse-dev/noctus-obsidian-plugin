import { ColorConfig } from "src/types";

export function createCSSRuleFromColorConfig(config: ColorConfig) {
    let selector = `.cm-custom-highlight-${config.tag}, .markdown-rendered mark.custom-highlight-${config.tag}, .menu-item-${config.tag}>.menu-item-title`,
        prop = "background-color",
        color = config.color;
    return `${selector}{${prop}:color(from ${color} srgb r g b/var(--hl-opacity));}`
}