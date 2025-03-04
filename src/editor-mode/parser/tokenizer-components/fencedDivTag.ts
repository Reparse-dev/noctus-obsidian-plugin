import { isAlphanumeric } from "src/editor-mode/parser/utils";
import { Token } from "src/types";
import { ParserState } from "src/editor-mode/parser";

export function fencedDivTag(state: ParserState, token: Token) {
    token.validTag = false;
    let offset = token.openLen + token.tagLen,
        initTagLen = token.tagLen,
        str = state.lineStr;
    while (offset < str.length) {
        let char = str[offset];
        if (char == " " || char == "-" || isAlphanumeric(char)) { token.tagLen++; offset++ }
        else { break }
    }
    state.advance(token.tagLen - initTagLen);
    if (offset >= str.length) { token.validTag = true }
    else { state.queue.resolve([token.type], false, false) }
}