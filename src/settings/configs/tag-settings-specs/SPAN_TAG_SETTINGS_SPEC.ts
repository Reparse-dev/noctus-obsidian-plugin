import { Format } from "src/enums";
import { TagSettingsSpec } from "src/types";

export const SPAN_TAG_SETTINGS_SPEC: TagSettingsSpec = {
    type: Format.CUSTOM_SPAN,
    addBtnPlaceholder: "Add tag",
    nameFieldPlaceholder: "Tag name",
    tagFieldPlaceholder: "Tag string",
    tagFilter: /[^ a-z0-9-]/gi
}