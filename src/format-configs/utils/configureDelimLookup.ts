import { Format, MarkdownViewMode } from "src/enums";
import { InlineRules } from "src/format-configs";
import { PluginSettings } from "src/types";
import { EditorDelimLookup } from "src/editor-mode/parser/configs";
import { PreviewDelimLookup } from "src/preview-mode/configs";

export function configureDelimLookup(settings: PluginSettings) {
    // editor
    if (settings.insertion & MarkdownViewMode.EDITOR_MODE) {
        EditorDelimLookup[InlineRules[Format.INSERTION].char] = Format.INSERTION;
    }
    if (settings.spoiler & MarkdownViewMode.EDITOR_MODE) {
        EditorDelimLookup[InlineRules[Format.SPOILER].char] = Format.SPOILER;
    }
    if (settings.superscript & MarkdownViewMode.EDITOR_MODE) {
        EditorDelimLookup[InlineRules[Format.SUPERSCRIPT].char] = Format.SUPERSCRIPT;
    }
    if (settings.subscript & MarkdownViewMode.EDITOR_MODE) {
        EditorDelimLookup[InlineRules[Format.SUBSCRIPT].char] = Format.SUBSCRIPT;
    }
    if (settings.customHighlight & MarkdownViewMode.EDITOR_MODE) {
        EditorDelimLookup[InlineRules[Format.HIGHLIGHT].char] = Format.HIGHLIGHT;
    }
    if (settings.customSpan & MarkdownViewMode.EDITOR_MODE) {
        EditorDelimLookup[InlineRules[Format.CUSTOM_SPAN].char] = Format.CUSTOM_SPAN;
    }
    // preview
    if (settings.insertion & MarkdownViewMode.PREVIEW_MODE) {
        PreviewDelimLookup[InlineRules[Format.INSERTION].char] = Format.INSERTION;
    }
    if (settings.spoiler & MarkdownViewMode.PREVIEW_MODE) {
        PreviewDelimLookup[InlineRules[Format.SPOILER].char] = Format.SPOILER;
    }
    if (settings.superscript & MarkdownViewMode.PREVIEW_MODE) {
        PreviewDelimLookup[InlineRules[Format.SUPERSCRIPT].char] = Format.SUPERSCRIPT;
    }
    if (settings.subscript & MarkdownViewMode.PREVIEW_MODE) {
        PreviewDelimLookup[InlineRules[Format.SUBSCRIPT].char] = Format.SUBSCRIPT;
    }
    if (settings.customSpan & MarkdownViewMode.PREVIEW_MODE) {
        PreviewDelimLookup[InlineRules[Format.CUSTOM_SPAN].char] = Format.CUSTOM_SPAN;
    }
}