import { StateField } from "@codemirror/state";
import { DecorationBuilder } from "src/editor-mode/decorator/builder";
import { parserField, selectionObserverField } from "src/editor-mode/state-fields";

export const builderField = StateField.define({
    create(state) {
        let parser = state.field(parserField),
            selectionObserver = state.field(selectionObserverField),
            builder = new DecorationBuilder(parser, selectionObserver);
        builder.onStateInit(state);
        return builder;
    },
    update(builder, transaction) {
        builder.onStateUpdate(transaction);
        return builder;
    }
});