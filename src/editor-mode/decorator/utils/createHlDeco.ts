import { Decoration } from "@codemirror/view";
import { Format } from "src/enums";

export function createHlDeco(color: string, data?: { [P in string]: unknown }) {
    let spec: Parameters<typeof Decoration.mark>[0] = {
        class: "cm-custom-highlight cm-custom-highlight-" + (color || "default"),
        type: Format.HIGHLIGHT,
        color,
        inclusive: true
    };
    if (data) {
        for (let prop in data) { spec[prop] = data[prop] }
    }
    return Decoration.mark(spec);
}