import { Line, Text } from "@codemirror/state";
import { getNextLine } from "./getNextLine";
import { isBlankLine } from "./isBlankLine";

export function isBlockEnd(doc: Text, line: Line) {
    let nextLine = getNextLine(doc, line);
    return !nextLine || isBlankLine(nextLine);
}