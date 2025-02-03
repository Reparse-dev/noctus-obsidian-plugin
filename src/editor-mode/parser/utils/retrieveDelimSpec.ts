import { Format, TokenRole } from "src/enums";
import { DelimSpec, MainFormat } from "src/types";
import { FormatRules } from "src/shared-configs";

export function retrieveDelimSpec(type: MainFormat, role: TokenRole): DelimSpec {
    if (type == Format.HIGHLIGHT) {
        throw TypeError("Type must be either insertion, spoiler, sup, or sub");
    }
    let { char, length, exactLen } = FormatRules[type];
    return { char, length, exactLen, role }
}