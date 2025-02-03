import { TokenRole } from "src/enums";
import { DelimSpec } from "src/types";

export function validateDelim(str: string, offset: number, spec: DelimSpec) {
    let length = 0, valid = false;
    while (str[offset + length] == spec.char) { length++ }
    if (spec.exactLen && length == spec.length || !spec.exactLen && length >= spec.length) {
        let char: string;
        if (spec.role == TokenRole.OPEN) {
            char = str[offset + length];
        } else if (spec.role == TokenRole.CLOSE) {
            char = str[offset - 1];
        } else {
            throw TypeError("");
        }
        if (char && char != " " && char != "\t") { valid = true }
    }
    return { valid, length };
}