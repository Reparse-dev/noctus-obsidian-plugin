import { Line, Text } from "@codemirror/state";
import { getPrevLine } from "./getPrevLine";
import { isBlankLine } from "./isBlankLine";

export function isBlockStart(doc: Text, line: Line) {
    let prevLine = getPrevLine(doc, line);
    return !prevLine || isBlankLine(prevLine);
}