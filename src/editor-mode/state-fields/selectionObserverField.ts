import { StateField } from "@codemirror/state";
import { SelectionObserver } from "src/editor-mode/observer";
import { parserField } from "src/editor-mode/state-fields";

export const selectionObserverField = StateField.define({
    create(state) {
        let observer = new SelectionObserver(state.field(parserField));
        observer.startObserve(state.selection, true);
        return observer;
    },
    update(observer, transaction) {
        // Start observer only when the parser was run or the selection was moved.
        let selectionMoved = !(transaction.selection && transaction.startState.selection.eq(transaction.selection));
        if (observer.parser.isReparsing || observer.parser.isInitializing || selectionMoved) {
            observer.startObserve(transaction.newSelection, transaction.docChanged);
        } else {
            observer.isObserving = false;
        }
        return observer;
    }
});