import { Decoration } from "@codemirror/view";
import { Token, TokenDecoration } from "src/types";

export function createInlineDecoRange(token: Token, cls: string) {
    return (Decoration
        .mark({ class: cls, token }) as TokenDecoration)
        .range(token.from, token.to);
}