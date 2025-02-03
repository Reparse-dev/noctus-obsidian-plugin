import { MainFormat } from "src/types";
import { FormatRules } from "src/shared-configs";

export const SpaceAllowedFormats = (() => {
    let formats: MainFormat[] = [];
    for (let format in FormatRules) {
        let type = Number.parseInt(format) as MainFormat;
        if (FormatRules[type].allowSpace) { formats.push(type) }
    }
    return formats;
})();