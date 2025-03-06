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
        // Start observer only when the parser has run or the selection has been moved.
        let selectionMoved = !(transaction.selection && transaction.startState.selection.eq(transaction.selection)),
            isParsing = observer.parser.isReparsing || observer.parser.isInitializing;
        transaction.isUserEvent("select");
        if (isParsing || selectionMoved) {
            observer.startObserve(transaction.newSelection, isParsing);
        } else {
            observer.isObserving = false;
        }
        return observer;
    }
});