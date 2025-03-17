import { Delimiter, Format } from "src/enums";
import { DelimSpec } from "src/types";
import { BlockRules, InlineRules } from "src/format-configs";
import { isInlineFormat } from "src/format-configs/utils";

export function retrieveDelimSpec(type: Format, role: Delimiter): DelimSpec {
    let char: string, length: number, exactLen: boolean, allowSpaceOnDelim: boolean;
    if (isInlineFormat(type)) {
        ({ char, length, exactLen } = InlineRules[type]);
        allowSpaceOnDelim = false;
    } else {
        ({ char, length, exactLen } = BlockRules[type]);
        allowSpaceOnDelim = true;
    }
    return { char, length, exactLen, role, allowSpaceOnDelim }
}