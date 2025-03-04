import { isAlphanumeric } from "src/editor-mode/parser/utils";
import { Token } from "src/types";
import { ParserState } from "src/editor-mode/parser";

export function colorTag(state: ParserState, token: Token) {
    let offset = state.offset,
        initTagLen = token.tagLen,
        str = state.lineStr;
    if (token.validTag) {
        if (str[offset - 1] == "}") { return }
        token.validTag = false;
    }
    if (token.tagLen == 0) {
        if (str[offset] != "{") { return }
        token.tagLen++;
        offset++;
    }
    for (let char = str[offset]; offset < str.length; char = str[++offset]) {
        if (!isAlphanumeric(char) && char != "-") { break }
        token.tagLen++;
    }
    if (token.tagLen > 1 && str[offset] == "}") {
        token.validTag = true;
        token.tagLen++;
    }
    state.advance(token.tagLen - initTagLen);
}