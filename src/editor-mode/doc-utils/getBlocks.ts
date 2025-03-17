import { PlainRange } from "src/types";
import { Text } from "@codemirror/state";
import { getBlockStartAt } from "./getBlockStartAt";
import { isBlankLine } from "./isBlankLine";
import { getBlockEndAt } from "./getBlockEndAt";

export function getBlocks(doc: Text, range: PlainRange, lookBehind = false, lookAhead = false) {
    let blocks: { start: number, end: number }[] = [],
        line = doc.lineAt(range.from),
        initLine = line,
        curBlock: { start: number, end: number } | undefined;
    if (!isBlankLine(line) && lookBehind) {
        let blockStart = getBlockStartAt(doc, line);
        curBlock = { start: blockStart.number, end: line.number + 1 };
        blocks.push(curBlock);
    }
    for (; range.to >= line.from; line = doc.line(line.number + 1)) {
        if (isBlankLine(line)) { curBlock = undefined }
        else if (curBlock) { curBlock.end++ }
        else {
            curBlock = { start: line.number, end: line.number + 1 };
            blocks.push(curBlock);
        }
        if (line.number >= doc.lines) { break }
    }
    if (curBlock && lookAhead) {
        curBlock.end = getBlockEndAt(doc, line, false).number + 1;
    }
    if (!blocks.length) {
        blocks.push({ start: initLine.number, end: initLine.number + 1 });
    }
    return blocks;
}