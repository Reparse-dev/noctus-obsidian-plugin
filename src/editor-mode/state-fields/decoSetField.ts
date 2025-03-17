import { StateField } from "@codemirror/state";
import { builderField } from "src/editor-mode/state-fields";
import { EditorView } from "@codemirror/view";

/** Stores only height-altering decorations. */
export const decoSetField = StateField.define({
    create(state) {
        let holder = state.field(builderField).holder;
        return {
            lineBreaksSet: holder.lineBreaksSet,
            blockOmittedSet: holder.blockOmittedSet
        };
    },
    update(decoSet, transaction) {
        let holder = transaction.state.field(builderField).holder;
        // Avoid `EditorView.decorations` recomputation while the sets haven't
        // changed/updated yet. It's done by returning same object rather than
        // creating the new one, though the same holder.
        if (
            holder.lineBreaksSet === decoSet.lineBreaksSet &&
            holder.blockOmittedSet === decoSet.blockOmittedSet
        ) { return decoSet }
        return {
            lineBreaksSet: holder.lineBreaksSet,
            blockOmittedSet: holder.blockOmittedSet
        };
    },
    provide(field) {
        // The both sets replace line breaks with "<br>" or hide it. Hence, we
        // need providing it directly, i.e. not in the view update.
        return [
            EditorView.decorations.from(field, set => set.blockOmittedSet),
            EditorView.decorations.from(field, set => set.lineBreaksSet)
        ]
    }
});