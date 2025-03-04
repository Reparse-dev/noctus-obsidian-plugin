import { Format } from "src/enums";
import { InlineFormat } from "src/types";

export function isInlineFormat(type: Format): type is InlineFormat {
    return type >= Format.INSERTION && type <= Format.CUSTOM_SPAN
}