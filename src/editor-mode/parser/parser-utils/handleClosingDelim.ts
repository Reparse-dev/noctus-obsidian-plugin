import { Token } from "src/types";
import { ParserState } from "src/editor-mode/parser";

export function handleClosingDelim(state: ParserState, token: Token, closeLen: number) {
    token.closeLen = closeLen;
    token.to = state.globalOffset + closeLen;
    state.advance(closeLen);
    state.queue.resolve([token.type], true, false);
}