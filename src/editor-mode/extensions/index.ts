import { Extension, RangeSet } from "@codemirror/state";
import { EditorView, ViewPlugin } from "@codemirror/view";
import { builderField, decoSetField, parserField, selectionObserverField } from "src/editor-mode/state-fields";
import { BuilderPlugin } from "src/editor-mode/view-plugin";

const builderPlugin = ViewPlugin.fromClass(BuilderPlugin);

export const editorExtendedSyntax: Extension = [
    parserField,
    selectionObserverField,
    builderField,
    decoSetField,
    builderPlugin,
    EditorView.outerDecorations.of(view => view.plugin(builderPlugin)?.builder.holder.inlineSet ?? RangeSet.empty),
    EditorView.decorations.of(view => view.plugin(builderPlugin)?.builder.holder.blockSet ?? RangeSet.empty),
    EditorView.decorations.of(view => view.plugin(builderPlugin)?.builder.holder.inlineOmittedSet ?? RangeSet.empty),
    EditorView.decorations.of(view => view.plugin(builderPlugin)?.builder.holder.colorBtnSet ?? RangeSet.empty),
    EditorView.decorations.of(view => view.plugin(builderPlugin)?.builder.holder.revealedSpoilerSet ?? RangeSet.empty)
];