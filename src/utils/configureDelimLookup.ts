import { Format, SettingOpt1 } from "src/enums";
import { FormatRules } from "src/shared-configs";
import { PluginSettings } from "src/types";
import { EditorDelimLookup } from "src/editor-mode/parser/configs";
import { PreviewDelimLookup } from "src/preview-mode/configs";

export function configureDelimLookup(settings: PluginSettings) {
    // editor
    if (settings.insertion & SettingOpt1.EDITOR_MODE) {
        EditorDelimLookup[FormatRules[Format.INSERTION].char] = Format.INSERTION;
    }
    if (settings.spoiler & SettingOpt1.EDITOR_MODE) {
        EditorDelimLookup[FormatRules[Format.SPOILER].char] = Format.SPOILER;
    }
    if (settings.superscript & SettingOpt1.EDITOR_MODE) {
        EditorDelimLookup[FormatRules[Format.SUPERSCRIPT].char] = Format.SUPERSCRIPT;
    }
    if (settings.subscript & SettingOpt1.EDITOR_MODE) {
        EditorDelimLookup[FormatRules[Format.SUBSCRIPT].char] = Format.SUBSCRIPT;
    }
    // preview
    if (settings.insertion & SettingOpt1.PREVIEW_MODE) {
        PreviewDelimLookup[FormatRules[Format.INSERTION].char] = Format.INSERTION;
    }
    if (settings.spoiler & SettingOpt1.PREVIEW_MODE) {
        PreviewDelimLookup[FormatRules[Format.SPOILER].char] = Format.SPOILER;
    }
    if (settings.superscript & SettingOpt1.PREVIEW_MODE) {
        PreviewDelimLookup[FormatRules[Format.SUPERSCRIPT].char] = Format.SUPERSCRIPT;
    }
    if (settings.subscript & SettingOpt1.PREVIEW_MODE) {
        PreviewDelimLookup[FormatRules[Format.SUBSCRIPT].char] = Format.SUBSCRIPT;
    }
}