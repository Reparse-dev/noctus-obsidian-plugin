import { IndexCache } from "src/types";
import { Text } from "@codemirror/state"

export function getLineAt(doc: Text, offset: number, linePosCache: IndexCache) {
    if (linePosCache.number > doc.lines) { linePosCache.number = doc.lines }
    let curLine = doc.line(linePosCache.number);
    if (offset < curLine.from) {
        do {
            curLine = doc.line(curLine.number - 1);
        } while (offset < curLine.from)
    } else if (offset > curLine.to) {
        do {
            curLine = doc.line(curLine.number + 1);
        } while (offset > curLine.to)
    }
    linePosCache.number = curLine.number;
    return curLine;
}