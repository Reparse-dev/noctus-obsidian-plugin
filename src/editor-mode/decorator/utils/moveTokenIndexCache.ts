import { IndexCache, TokenGroup } from "src/types";

export function moveTokenIndexCache(tokens: TokenGroup, offset: number, indexCache: IndexCache) {
    if (tokens.length == 0) {
        indexCache.number = 0;
        return;
    }
    if (indexCache.number >= tokens.length) {
        indexCache.number = tokens.length - 1;
    }
    let curIndex = indexCache.number,
        curToken = tokens[curIndex];
    if (offset < curToken.from && curIndex != 0) {
        do {
            curToken = tokens[--curIndex];
        } while (offset < curToken.from && curIndex != 0)
    } else if (offset > curToken.to && curIndex != tokens.length - 1) {
        do {
            curToken = tokens[++curIndex];
        } while (offset > curToken.to && curIndex != tokens.length - 1)
    }
    indexCache.number = curIndex;
}