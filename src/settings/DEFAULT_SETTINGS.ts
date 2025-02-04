import { SettingOpt1 } from "src/enums";
import { PluginSettings } from "src/types";

export const DEFAULT_SETTINGS: PluginSettings = {
    insertion: SettingOpt1.ALL,
    spoiler: SettingOpt1.ALL,
    superscript: SettingOpt1.ALL,
    subscript: SettingOpt1.ALL,
    customHighlight: SettingOpt1.ALL,
    customAlign: SettingOpt1.ALL,
    editorEscape: false,
    colorButton: true
};