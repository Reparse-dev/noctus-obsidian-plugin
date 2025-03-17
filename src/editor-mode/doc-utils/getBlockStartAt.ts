import { Line, Text } from "@codemirror/state";
import { isBlankLine } from "src/editor-mode/doc-utils";

export function getBlockStartAt(doc: Text, offsetOrLine: number | Line) {
    let curLine = offsetOrLine instanceof Line ? offsetOrLine : doc.lineAt(offsetOrLine),
        prevLine = curLine.number > 1 ? doc.line(curLine.number - 1) : null;
    if (isBlankLine(curLine)) { return curLine }
    while (prevLine) {
        if (isBlankLine(prevLine)) { break }
        curLine = prevLine;
        prevLine = curLine.number > 1 ? doc.line(curLine.number - 1) : null;
    }
    return curLine;
}