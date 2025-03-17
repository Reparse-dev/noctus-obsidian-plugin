import { Line } from "@codemirror/state";

export function sliceStrFromLine(line: Line, from: number, to: number) {
    from -= line.from;
    to -= line.from;
    return line.text.slice(from, to);
}