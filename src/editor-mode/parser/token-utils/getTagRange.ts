import { Token } from "src/types";

export function getTagRange(token: Token) {
    let from = token.from + token.openLen,
        to = from + token.tagLen;
    return { from, to };
}