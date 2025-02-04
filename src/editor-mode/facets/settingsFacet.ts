import { Facet } from "@codemirror/state";
import { DEFAULT_SETTINGS } from "src/settings";
import { PluginSettings } from "src/types";

export const settingsFacet = Facet.define<PluginSettings, PluginSettings>({
    combine(value) {
        return Object.assign({}, value.at(-1) || DEFAULT_SETTINGS);
    }
});