import { ColorConfig } from "src/types";
import { takeBuiltinColor, PREDEFINED_COLOR_TAGS } from "src/color-management";

export function getDefaultColorConfigs() {
    let configs: ColorConfig[] = [];
    for (let i = 0; i < PREDEFINED_COLOR_TAGS.length; i++) {
        let tag = PREDEFINED_COLOR_TAGS[i],
            name = tag[0].toUpperCase() + tag.slice(1),
            color = takeBuiltinColor(tag) ?? "#ffffff";
        configs.push({ tag, name, color, showInMenu: true });
    }
    return configs;
}