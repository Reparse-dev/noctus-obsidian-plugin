import { StateField } from "@codemirror/state";
import { builderField } from "src/editor-mode/state-fields";
import { EditorView } from "@codemirror/view";

/** Stores only height-altering decorations. */
export const decoSetField = StateField.define({
    create(state) {
        let builder = state.field(builderField);
        return {
            lineBreaksSet: builder.holder.lineBreaksSet,
            blockOmittedSet: builder.holder.blockOmittedSet
        };
    },
    update(decoSet, transaction) {
        let builder = transaction.state.field(builderField);
        return {
            lineBreaksSet: builder.holder.lineBreaksSet,
            blockOmittedSet: builder.holder.blockOmittedSet
        };
    },
    provide(field) {
        return [
            EditorView.decorations.from(field, set => set.blockOmittedSet),
            EditorView.decorations.from(field, set => set.lineBreaksSet)
        ]
    },
});