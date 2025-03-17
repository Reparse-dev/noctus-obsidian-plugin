import { Format } from "src/enums";
import { BlockFormat, BlockFormatRule } from "src/types";

export const BlockRules: Record<BlockFormat, BlockFormatRule> = {
    [Format.FENCED_DIV]: {
        char: ":",
        length: 3,
        exactLen: false,
        class: "fenced-div"
    }
}