import { Field, Theme } from "src/enums";
import { PluginSettings, SettingRoot } from "src/types";
import { ALWAYS_SHOW_DROPDOWN, DISPLAY_BEHAVIOUR_DROPDOWN, MARKDOWN_VIEW_MODE_DROPDOWN } from "src/settings/configs";

/**
 * Main configuration of the setting interface.
 */
export function retrieveSettingUIConfigs(settings: PluginSettings): SettingRoot<PluginSettings> {
    return [{
        items: [{
            name: "Insertion (underline)",
            desc: "Use double plus (\"++\") as a delimiter.",
            fields: [{
                type: Field.DROPDOWN,
                record: settings,
                key: "insertion",
                spec: {
                    options: MARKDOWN_VIEW_MODE_DROPDOWN
                },
                update: { internal: true }
            }]
        }, {
            name: "Discord-flavored spoiler",
            desc: "Use double bars (\"||\") as a delimiter.",
            fields: [{
                type: Field.DROPDOWN,
                record: settings,
                key: "spoiler",
                spec: {
                    options: MARKDOWN_VIEW_MODE_DROPDOWN
                },
                update: { internal: true }
            }]
        }, {
            name: "Pandoc-style superscript",
            desc: "Use a single caret (\"^\") as a delimiter.",
            fields: [{
                type: Field.DROPDOWN,
                record: settings,
                key: "superscript",
                spec: {
                    options: MARKDOWN_VIEW_MODE_DROPDOWN
                },
                update: { internal: true }
            }]
        }, {
            name: "Pandoc-style subscript",
            desc: "Use a single tilde (\"~\") as a delimiter.",
            fields: [{
                type: Field.DROPDOWN,
                record: settings,
                key: "subscript",
                spec: {
                    options: MARKDOWN_VIEW_MODE_DROPDOWN
                },
                update: { internal: true }
            }]
        }, {
            name: "Highlight color tag",
            desc: "Use alphanumeric and hyphen characters (\"A-Za-z0-9-\") after the opening delimiter covered by curly brackets (\"{}\").",
            fields: [{
                type: Field.DROPDOWN,
                record: settings,
                key: "customHighlight",
                spec: {
                    options: MARKDOWN_VIEW_MODE_DROPDOWN
                },
                update: { internal: true }
            }]
        }, {
            name: "Custom span",
            desc: "Use double exclamation marks (\"!!\") as a delimiter. Can be inserted after the " +
                "opening delimiter by a tag with the same way as highlight tag. " +
                "Additionally, you can use multiple classes inside it, separated by space(s).",
            fields: [{
                type: Field.DROPDOWN,
                record: settings,
                key: "customSpan",
                spec: {
                    options: MARKDOWN_VIEW_MODE_DROPDOWN
                },
                update: { internal: true }
            }]
        }, {
            name: "Pandoc-style fenced div (custom block)",
            desc: "Use three colons (\":::\") or more at the beginning of a paragraph, " +
                "followed by alphanumeric and hyphen character (\"A-Za-z0-9\") after them. Use space to separate each class.",
            fields: [{
                type: Field.DROPDOWN,
                record: settings,
                key: "fencedDiv",
                spec: {
                    options: MARKDOWN_VIEW_MODE_DROPDOWN
                },
                update: { internal: true }
            }]
        }]
    }, {
        heading: "Tag display behavior",
        collapsible: true,
        items: [{
            name: "Highlight tag in live-preview mode",
            desc: "Tags can either always be visible, or when they meet particular condition.",
            fields: [{
                type: Field.DROPDOWN,
                record: settings,
                key: "hlTagDisplayBehaviour",
                spec: {
                    options: DISPLAY_BEHAVIOUR_DROPDOWN
                },
                update: { internal: true }
            }]
        }, {
            name: "Custom span tag in live-preview mode",
            desc: "Tags can either always be visible, or when they meet particular condition.",
            fields: [{
                type: Field.DROPDOWN,
                record: settings,
                key: "spanTagDisplayBehaviour",
                spec: {
                    options: DISPLAY_BEHAVIOUR_DROPDOWN
                },
                update: { internal: true }
            }]
        }, {
            name: "Highlight tag in preview mode",
            desc: "Show or hide highlight color tag in the preview mode.",
            fields: [{
                type: Field.TOGGLE,
                record: settings,
                key: "showHlTagInPreviewMode",
                spec: null,
                update: { internal: true }
            }]
        }, {
            name: "Custom span tag in preview mode",
            desc: "Show or hide custom span tag in the preview mode.",
            fields: [{
                type: Field.TOGGLE,
                record: settings,
                key: "showSpanTagInPreviewMode",
                spec: null,
                update: { internal: true }
            }]
        }, {
            name: "Always show fenced div tag",
            desc: "By default, the tag is always hidden in the preview mode, " +
                "and only displayed when touching the cursor or selection in the live preview mode.",
            fields: [{
                type: Field.DROPDOWN,
                record: settings,
                key: "alwaysShowFencedDivTag",
                spec: {
                    options: ALWAYS_SHOW_DROPDOWN
                },
                update: { internal: true }
            }]
        }]
    }, {
        heading: "Customize highlight",
        collapsible: true,
        items: [{
            name: "Color button",
            desc: "Display a button after highlight opening delimiter, used to open the color menu.",
            fields: [{
                type: Field.TOGGLE,
                record: settings,
                key: "colorButton",
                spec: null,
                update: { internal: true }
            }]
        }, {
            name: "Color opacity in light mode",
            desc: "Adjust highlight opacity in light mode. Zero means that will be fully transparent.",
            fields: [{
                type: Field.SLIDER,
                record: settings,
                key: "lightModeHlOpacity",
                spec: {
                    min: 0,
                    max: 1,
                    step: 0.01
                },
                callback: (slider, plugin) => {
                    plugin.setHlOpacity(slider.getValue(), Theme.LIGHT);
                },
                update: { colors: true }
            }]
        }, {
            name: "Color opacity in dark mode",
            desc: "Adjust highlight opacity in dark mode. Zero means that will be fully transparent.",
            fields: [{
                type: Field.SLIDER,
                record: settings,
                key: "darkModeHlOpacity",
                spec: {
                    min: 0,
                    max: 1,
                    step: 0.01
                },
                callback: (slider, plugin) => {
                    plugin.setHlOpacity(slider.getValue(), Theme.DARK);
                },
                update: { colors: true }
            }]
        }, {
            name: "Color palettes",
            desc: "The first text field gives the name of the item in the color menu, " +
                "and the second one sets the tag string to be used in highlight syntax.",
            preservedForColorSettings: true
        }]
    }, {
        heading: "Others",
        collapsible: true,
        items: [{
            name: "Delimiter escaping",
            desc: "Use backslash as a delimiter escaper. Works only in the editor mode.",
            fields: [{
                type: Field.TOGGLE,
                record: settings,
                key: "editorEscape",
                spec: null,
                update: { internal: true }
            }]
        }, {
            name: "Parse exported PDF",
            desc: "Parse syntax on an exported PDF.",
            fields: [{
                type: Field.TOGGLE,
                record: settings,
                key: "decoratePDF",
                spec: null
            }]
        }]
    }];
};