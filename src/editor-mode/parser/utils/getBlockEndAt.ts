import { Text } from "@codemirror/state"
import { isBlankLine } from "src/editor-mode/parser/utils";

export function getBlockEndAt(doc: Text, offset: number) {
    let line = doc.lineAt(offset);
    while (line.number < doc.lines) {
        line = doc.line(line.number + 1);
        if (isBlankLine(line)) { break }
    }
    return line;
}