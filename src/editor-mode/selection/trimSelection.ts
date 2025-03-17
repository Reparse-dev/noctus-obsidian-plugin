import { EditorSelection, Text } from "@codemirror/state";
import { trimSelectionRange } from "src/editor-mode/selection";

export function trimSelection(selection: EditorSelection, doc: Text) {
    for (let i = 0; i < selection.ranges.length; i++) {
        let trimmed = trimSelectionRange(selection.ranges[i], doc);
        selection = selection.replaceRange(trimmed, i);
    }
    return selection;
}