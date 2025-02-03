import { MainFormat } from "src/types";
import { FormatRules } from "src/shared-configs";
import { Format } from "src/enums";

export const NonHighlightFormats = (() => {
    let formats: MainFormat[] = [];
    for (let format in FormatRules) {
        let type = Number.parseInt(format) as MainFormat;
        if (type != Format.HIGHLIGHT) { formats.push(type) }
    }
    return formats;
})();