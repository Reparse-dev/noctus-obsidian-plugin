import { Facet } from "@codemirror/state";
import { PluginSettings } from "src/types";

export const settingsFacet = Facet.define<PluginSettings, PluginSettings>({
    combine(value) {
        return value[0];
    },
    static: true
});