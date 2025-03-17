import { Line } from "@codemirror/state";

export function isBlankLine(line: Line): boolean {
    return !line.text.trimEnd();
}