import { Line } from "@codemirror/state";
import { Delimiter } from "src/enums";
import { Token, TokenGroup } from "src/types";

export function createHookToken(tokens: TokenGroup, refToken: Token, line: Line): Token {
    return {
        type: refToken.type,
        level: refToken.level,
        status: refToken.status,
        role: Delimiter.HOOK,
        from: line.from,
        to: line.to,
        pointer: refToken.pointer,
        size: tokens.length - refToken.pointer,
        open: refToken.open,
        close: refToken.close
    };
}