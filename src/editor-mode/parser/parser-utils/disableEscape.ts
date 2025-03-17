import { SKIPPED_NODE_RE } from "../regexps";

export function disableEscape() {
    SKIPPED_NODE_RE.compile("table|code|formatting|html|math|tag|url|barelink|atom|comment|string|meta|frontmatter|hr(?!\\w)");
}