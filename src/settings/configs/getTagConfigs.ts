import { Format } from "src/enums";
import { PluginSettings } from "src/types";

export function getTagConfigs(settings: PluginSettings, type: Format.HIGHLIGHT | Format.CUSTOM_SPAN | Format.FENCED_DIV) {
    switch (type) {
        case Format.HIGHLIGHT:
            return settings.colorConfigs;
        case Format.CUSTOM_SPAN:
            return settings.predefinedSpanTag;
        case Format.FENCED_DIV:
            return settings.predefinedDivTag;
    }
}