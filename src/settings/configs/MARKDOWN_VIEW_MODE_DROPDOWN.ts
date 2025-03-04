import { MarkdownViewMode } from "src/enums";

export const MARKDOWN_VIEW_MODE_DROPDOWN: Record<MarkdownViewMode, string> = {
    [MarkdownViewMode.NONE]: "Disable all",
    [MarkdownViewMode.EDITOR_MODE]: "Editor only",
    [MarkdownViewMode.PREVIEW_MODE]: "Preview only",
    [MarkdownViewMode.ALL]: "Enable all"
};