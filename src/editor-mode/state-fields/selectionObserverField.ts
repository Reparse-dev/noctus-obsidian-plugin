import { StateField } from "@codemirror/state";
import { SelectionObserver } from "src/editor-mode/observer";
import { parserField } from "src/editor-mode/state-fields";
import { activityFacet } from "src/editor-mode/facets";

export const selectionObserverField = StateField.define({
    create(state) {
        let observer = new SelectionObserver(state.field(parserField)),
            activityRecorder = state.facet(activityFacet);
        observer.observe(state.selection, true);
        activityRecorder.enter({ isObserving: true });
        return observer;
    },
    update(observer, transaction) {
        // Start observer only when the parser has run or the selection has been
        // moved.
        let selectionMoved = !(transaction.selection && transaction.startState.selection.eq(transaction.selection)),
            activityRecorder = transaction.state.facet(activityFacet),
            isParsing = activityRecorder.verify(observer, "parse");
        transaction.isUserEvent("select");
        if (isParsing || selectionMoved) {
            observer.observe(transaction.newSelection, isParsing ?? false);
            activityRecorder.enter({ isObserving: true });
        }
        return observer;
    }
});