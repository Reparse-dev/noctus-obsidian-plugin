import { getDefaultColorConfigs } from "src/color-management";
import { DisplayBehaviour, MarkdownViewMode } from "src/enums";
import { PluginSettings } from "src/types";

export const DEFAULT_SETTINGS: PluginSettings = {
    // General
    insertion: MarkdownViewMode.ALL,
    spoiler: MarkdownViewMode.ALL,
    superscript: MarkdownViewMode.ALL,
    subscript: MarkdownViewMode.ALL,
    customHighlight: MarkdownViewMode.ALL,
    customSpan: MarkdownViewMode.ALL,
    fencedDiv: MarkdownViewMode.ALL,

    // Formatting
    tidyFormatting: true,
    openTagMenuAfterFormat: true,
    
    // Tag behavior
    hlTagDisplayBehaviour: DisplayBehaviour.SYNTAX_TOUCHED,
    spanTagDisplayBehaviour: DisplayBehaviour.SYNTAX_TOUCHED,
    showHlTagInPreviewMode: false,
    showSpanTagInPreviewMode: false,
    alwaysShowFencedDivTag: MarkdownViewMode.NONE,

    // Custom Highlight
    colorButton: true,
    showAccentColor: true,
    showDefaultColor: true,
    showRemoveColor: true,
    lightModeHlOpacity: 0.4,
    darkModeHlOpacity: 0.5,
    colorConfigs: getDefaultColorConfigs(),

    // Custom span
    showDefaultSpanTag: true,
    showRemoveSpanTag: true,
    predefinedSpanTag: [{ name: "", tag: "", showInMenu: true }],

    // Fenced div
    showDefaultDivTag: true,
    showRemoveDivTag: true,
    predefinedDivTag: [{ name: "", tag: "", showInMenu: true }],  
    
    // Others
    editorEscape: false,
    decoratePDF: true,
};