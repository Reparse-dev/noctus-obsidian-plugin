import { IterTokenGroupSpec } from "src/types";
import { moveTokenIndexCache } from "src/editor-mode/decorator/utils";

export function iterTokenGroup(spec: IterTokenGroupSpec) {
    let { tokens, ranges, callback, indexCache } = spec;
    moveTokenIndexCache(tokens, ranges[0]?.from ?? 0, indexCache);
    for (
        let i = indexCache.number, j = 0;
        i < tokens.length && j < ranges.length;
    ) {
        if (ranges[j].to <= tokens[i].from) { j++; continue }
        if (tokens[i].from < ranges[j].to && tokens[i].to > ranges[j].from) {
            callback(tokens[i]);
        }
        i++;
    }
}