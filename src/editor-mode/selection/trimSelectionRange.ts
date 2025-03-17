import { EditorSelection, SelectionRange, Text } from "@codemirror/state";

export function trimSelectionRange(range: SelectionRange, doc: Text): SelectionRange {
    let str = doc.sliceString(range.from, range.to),
        preSpaceLen = str.length - str.trimStart().length,
        postSpaceLen = str.length - str.trimEnd().length;
    if (str.length == preSpaceLen) {
        return EditorSelection.cursor(range.from);
    }
    return EditorSelection.range(range.from + preSpaceLen, range.to - postSpaceLen);
}