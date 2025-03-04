import { ColorConfig } from "src/types";
import { takeBuiltinColor } from "src/color-management";

export function getDefaultColorConfigs() {
    let configs: ColorConfig[] = [],
        predefinedTags = ["red", "orange", "yellow", "green", "cyan", "blue", "purple", "pink"],
        predefinedNames = ["Red", "Orange", "Yellow", "Green", "Cyan", "Blue", "Purple", "Pink"];
    for (let i = 0; i < predefinedTags.length; i++) {
        let tag = predefinedTags[i],
            name = predefinedNames[i],
            color = takeBuiltinColor(tag) ?? "#ffffff";
        configs.push({ tag, name, color, showInMenu: true });
    }
    return configs;
}