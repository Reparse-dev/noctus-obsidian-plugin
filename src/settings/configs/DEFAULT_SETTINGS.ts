import { getDefaultColorConfigs } from "src/color-management";
import { DisplayBehaviour, MarkdownViewMode } from "src/enums";
import { PluginSettings } from "src/types";

export const DEFAULT_SETTINGS: PluginSettings = {
    insertion: MarkdownViewMode.ALL,
    spoiler: MarkdownViewMode.ALL,
    superscript: MarkdownViewMode.ALL,
    subscript: MarkdownViewMode.ALL,
    customHighlight: MarkdownViewMode.ALL,
    customSpan: MarkdownViewMode.ALL,
    fencedDiv: MarkdownViewMode.ALL,
    editorEscape: false,
    colorButton: true,
    decoratePDF: true,
    colorConfigs: getDefaultColorConfigs(),
    lightModeHlOpacity: 0.4,
    darkModeHlOpacity: 0.5,
    hlTagDisplayBehaviour: DisplayBehaviour.SYNTAX_TOUCHED,
    spanTagDisplayBehaviour: DisplayBehaviour.SYNTAX_TOUCHED,
    showHlTagInPreviewMode: false,
    showSpanTagInPreviewMode: false,
    alwaysShowFencedDivTag: MarkdownViewMode.NONE
};