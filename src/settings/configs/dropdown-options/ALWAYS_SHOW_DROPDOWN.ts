import { MarkdownViewMode } from "src/enums";

export const ALWAYS_SHOW_DROPDOWN: Record<MarkdownViewMode, string> = {
    [MarkdownViewMode.NONE]: "Default",
    [MarkdownViewMode.EDITOR_MODE]: "Editor only",
    [MarkdownViewMode.PREVIEW_MODE]: "Preview only",
    [MarkdownViewMode.ALL]: "Both editor and preview"
};