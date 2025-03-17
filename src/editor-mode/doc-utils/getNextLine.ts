import { Line, Text } from "@codemirror/state";

export function getNextLine(doc: Text, offsetOrLine: number | Line) {
    let line = offsetOrLine instanceof Line ? offsetOrLine : doc.lineAt(offsetOrLine);
    if (line.number >= doc.lines) { return null }
    return doc.line(line.number + 1);
}