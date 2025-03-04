import { Format } from "src/enums";
import { BlockRules, InlineRules } from "src/shared-configs";
import { BlockFormat, InlineFormat } from "src/types";

export const Formats = {
    ALL: (() => {
        let formats: Format[] = [];
        for (let format in InlineRules) { formats.push(parseInt(format)) }
        for (let format in BlockRules) { formats.push(parseInt(format)) }
        return formats;
    })(),
    ALL_BLOCK: (() => {
        let formats: BlockFormat[] = [];
        for (let format in BlockRules) { formats.push(parseInt(format)) }
        return formats;
    })(),
    ALL_INLINE: (() => {
        let formats: InlineFormat[] = [];
        for (let format in InlineRules) { formats.push(parseInt(format)) }
        return formats;
    })(),
    SPACE_RESTRICTED_INLINE: (() => {
        let formats: InlineFormat[] = [];
        for (let format in InlineRules) {
            let type = Number.parseInt(format) as InlineFormat;
            if (!InlineRules[type].allowSpace) { formats.push(type) }
        }
        return formats;
    })(),
    SPACE_ALLOWED_INLINE: (() => {
        let formats: InlineFormat[] = [];
        for (let format in InlineRules) {
            let type = Number.parseInt(format) as InlineFormat;
            if (InlineRules[type].allowSpace) { formats.push(type) }
        }
        return formats;
    })(),
    NON_BUILTIN_INLINE: (() => {
        let formats: InlineFormat[] = [];
        for (let format in InlineRules) {
            let type = Number.parseInt(format) as InlineFormat;
            if (!InlineRules[type].builtin) { formats.push(type) }
        }
        return formats;
    })()
}