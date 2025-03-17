import { Format } from "src/enums";

export function supportTag(type: Format): type is Format.HIGHLIGHT | Format.CUSTOM_SPAN | Format.FENCED_DIV {
    return type >= Format.HIGHLIGHT || type == Format.FENCED_DIV;
}