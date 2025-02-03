import { Format } from "src/enums";
import { MainFormat } from "src/types";

export const FormatRules: { [P in MainFormat]: {char: string, length: number, exactLen: boolean, allowSpace: boolean, getEl: () => Element} } = {
    [Format.INSERTION]: {
        char: "+",
        length: 2,
        exactLen: true,
        allowSpace: true,
        getEl: () => document.createElement("ins")
    },
    [Format.SPOILER]: {
        char: "|",
        length: 2,
        exactLen: true,
        allowSpace: true,
        getEl: () => document.createElement("spoiler-span")
    },
    [Format.SUPERSCRIPT]: {
        char: "^",
        length: 1,
        exactLen: true,
        allowSpace: false,
        getEl: () => document.createElement("sup")
    },
    [Format.SUBSCRIPT]: {
        char: "~",
        length: 1,
        exactLen: true,
        allowSpace: false,
        getEl: () => document.createElement("sub")
    },
    // unused
    [Format.HIGHLIGHT]: {
        char: "=",
        length: 2,
        exactLen: false,
        allowSpace: true,
        getEl: () => document.createElement("mark")
    }
}