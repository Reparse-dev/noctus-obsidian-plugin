import { ColorConfig } from "src/types";

export function createColorConfig(tag: string, color: string, name: string, showInMenu = true): ColorConfig {
    return { tag, color, name, showInMenu }
}