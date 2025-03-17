import { Line, Text } from "@codemirror/state"
import { isBlankLine } from "src/editor-mode/doc-utils";

export function getBlockEndAt(doc: Text, offsetOrLine: number | Line, blankLineAsEnd = true) {
    let line = offsetOrLine instanceof Line ? offsetOrLine : doc.lineAt(offsetOrLine);
    while (line.number < doc.lines) {
        line = doc.line(line.number + 1);
        if (isBlankLine(line)) {
            if (!blankLineAsEnd) { line = doc.line(line.number - 1) }
            break;
        }
    }
    return line;
}