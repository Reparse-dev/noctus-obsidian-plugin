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

export function trimSelection(selection: EditorSelection, doc: Text):EditorSelection {
    for (let i = 0; i < selection.ranges.length; i++) {
        let trimmed = trimSelectionRange(selection.ranges[i], doc);
        selection = selection.replaceRange(trimmed, i);
    }
    return selection;
}

