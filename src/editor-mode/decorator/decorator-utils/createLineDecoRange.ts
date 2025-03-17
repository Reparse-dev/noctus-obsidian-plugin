import { Line } from "@codemirror/state";
import { Decoration } from "@codemirror/view";
import { Token, TokenDecoration } from "src/types";

export function createLineDecoRange(token: Token, cls: string, line: Line) {
    return (Decoration
        .line({ class: cls, token }) as TokenDecoration)
        .range(line.from);
}