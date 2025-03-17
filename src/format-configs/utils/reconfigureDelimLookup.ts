import { EditorDelimLookup } from "src/editor-mode/parser/configs";
import { PreviewDelimLookup } from "src/preview-mode/configs";
import { configureDelimLookup } from "src/format-configs/utils";
import { PluginSettings } from "src/types";

export function reconfigureDelimLookup(settings: PluginSettings) {
    for (let key in EditorDelimLookup) {
        delete EditorDelimLookup[key];
    }
    for (let key in PreviewDelimLookup) {
        delete PreviewDelimLookup[key];
    }
    configureDelimLookup(settings);
}