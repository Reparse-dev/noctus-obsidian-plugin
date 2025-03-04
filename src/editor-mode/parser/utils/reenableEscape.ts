import { SKIPPED_NODE_RE } from "../regexps";

export function reenableEscape() {
    SKIPPED_NODE_RE.compile("table|code|formatting|escape|html|math|tag|url|barelink|atom|comment|string|meta|frontmatter|hr(?!\\w)");
}