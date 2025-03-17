import { PlainRange, Token } from "src/types";

export function isToken(range: PlainRange): range is Token {
    let { type, openLen, tagLen, closeLen } = range as Token;
    return type !== undefined && openLen !== undefined && tagLen !== undefined && closeLen !== undefined;
}