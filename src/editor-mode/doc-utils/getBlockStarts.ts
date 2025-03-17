import { Line, Text } from "@codemirror/state";
import { PlainRange } from "src/types";
import { getBlockStartAt, isBlankLine } from "src/editor-mode/doc-utils";

export function getBlockStarts(doc: Text, range: PlainRange, lookBehind = true) {
    let curLine = doc.lineAt(range.from),
        nextLine = curLine.number <= doc.lines ? doc.line(curLine.number + 1) : null,
        curLineIsBlank = isBlankLine(curLine),
        blockStarts: Line[] = [];
    if (lookBehind) {
        blockStarts.push(getBlockStartAt(doc, curLine));
    } else {
        blockStarts.push(curLine);
    }
    while (nextLine) {
        if (isBlankLine(nextLine)) {
            curLineIsBlank = true;
        } else {
            if (curLineIsBlank) {
                blockStarts.push(nextLine);
            }
            curLineIsBlank = false;
        }
        curLine = nextLine;
        nextLine = curLine.number <= doc.lines ? doc.line(curLine.number + 1) : null;
    }
    if (blockStarts.length > 1 && isBlankLine(blockStarts[0])) {
        blockStarts.shift();
    }
    return blockStarts;
}