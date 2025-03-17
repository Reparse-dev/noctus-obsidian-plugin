import { Format } from "src/enums";
import { TagSettingsSpec } from "src/types";

export const DIV_TAG_SETTINGS_SPEC: TagSettingsSpec = {
    type: Format.FENCED_DIV,
    addBtnPlaceholder: "Add tag",
    nameFieldPlaceholder: "Tag name",
    tagFieldPlaceholder: "Tag string",
    tagFilter: /[^ a-z0-9-]/gi
}