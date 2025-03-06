import { Extension, RangeSet } from "@codemirror/state";
import { EditorView, ViewPlugin } from "@codemirror/view";
import { builderField, decoSetField, parserField, selectionObserverField } from "src/editor-mode/state-fields";
import { EditorPlugin } from "src/editor-mode/view-plugin";

export const editorPlugin = ViewPlugin.fromClass(EditorPlugin);

export const editorExtendedSyntax: Extension = [
    parserField,
    selectionObserverField,
    builderField,
    decoSetField,
    editorPlugin,
    EditorView.decorations.of(view => view.plugin(editorPlugin)?.builder.holder.blockSet ?? RangeSet.empty),
    EditorView.decorations.of(view => view.plugin(editorPlugin)?.builder.holder.inlineOmittedSet ?? RangeSet.empty),
    EditorView.decorations.of(view => view.plugin(editorPlugin)?.builder.holder.colorBtnSet ?? RangeSet.empty),
    EditorView.decorations.of(view => view.plugin(editorPlugin)?.builder.holder.revealedSpoilerSet ?? RangeSet.empty),
    EditorView.outerDecorations.of(view => view.plugin(editorPlugin)?.builder.holder.inlineSet ?? RangeSet.empty)
];