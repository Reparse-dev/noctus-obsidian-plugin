import { ShifterNodeConfigs } from "src/editor-mode/parser/configs"

export const SEMANTIC_INTERFERER_RE = /(?:codeblock|html|math)-(?:begin|end)|comment-(?:start|end)|cdata|tag$/;
export const SKIPPED_NODE_RE = /table|code|formatting|escape|html|math|tag|url|barelink|atom|comment|string|meta|frontmatter|hr/;
export const COLOR_TAG_RE = /\{[a-z0-9-]+\}/iy;
export const SHIFTER_RE = (() => {
    let queries = "";
    for (let el in ShifterNodeConfigs) {
        queries += (queries ? "|" : "") + ShifterNodeConfigs[el as keyof typeof ShifterNodeConfigs].query;
    }
    return new RegExp(queries);
})();