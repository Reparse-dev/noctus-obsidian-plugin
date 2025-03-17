import { Line, Text } from "@codemirror/state";

export function getPrevLine(doc: Text, offsetOrLineNum: number | Line) {
    let lineNum: number;
    if (offsetOrLineNum instanceof Line) {
        lineNum = offsetOrLineNum.number;
    } else {
        lineNum = doc.lineAt(offsetOrLineNum).number;
    }
    if (lineNum <= 1) { return null }
    return doc.line(lineNum - 1);
}