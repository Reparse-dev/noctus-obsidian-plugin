import { ViewPlugin } from "@codemirror/view";
import { ExtendedSyntax } from "src/editor-mode/decorator/builder";

export const editorExtendedSyntax = ViewPlugin.fromClass(ExtendedSyntax, {
    decorations: value => value.combinedSet,
});