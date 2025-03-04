import { Token } from "src/types";

export function provideTokenRanges(token: Token) {
    let openRange = { from: token.from, to: token.from + token.openLen },
        closeRange = { from: token.to - token.closeLen, to: token.to },
        tagRange = { from: openRange.to, to: openRange.to + token.tagLen },
        contentRange = { from: (token.tagAsContent ? tagRange.from : tagRange.to), to: closeRange.from };
    return { openRange, closeRange, tagRange, contentRange }
}