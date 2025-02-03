import { Format } from "src/enums";
import { MainFormat } from "src/types";

export const DelimLookup: { [Prop in string]: MainFormat } = {
    ["+"]: Format.INSERTION,
    ["|"]: Format.SPOILER,
    ["^"]: Format.SUPERSCRIPT,
    ["~"]: Format.SUBSCRIPT
}