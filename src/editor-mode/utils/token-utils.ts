import { IndexCache, PlainRange, Token, TokenGroup } from "src/types";

type TokenPartsRanges = Record<"openRange" | "closeRange" | "tagRange" | "contentRange", PlainRange>;
interface IterTokenGroupSpec {
	tokens: TokenGroup,
	ranges: PlainRange[] | readonly PlainRange[],
	indexCache: IndexCache
	callback: (token: Token) => unknown,
}

export function getTagRange(token: Token): PlainRange {
	let from = token.from + token.openLen,
		to = from + token.tagLen;
	return { from, to };
}

export function provideTokenPartsRanges(token: Token): TokenPartsRanges {
	let openRange = { from: token.from, to: token.from + token.openLen },
		closeRange = { from: token.to - token.closeLen, to: token.to },
		tagRange = { from: openRange.to, to: openRange.to + token.tagLen },
		contentRange = { from: (token.tagAsContent ? tagRange.from : tagRange.to), to: closeRange.from };
	return { openRange, closeRange, tagRange, contentRange }
}

export function isToken(range: PlainRange): range is Token {
	let { type, openLen, tagLen, closeLen } = range as Token;
	return type !== undefined && openLen !== undefined && tagLen !== undefined && closeLen !== undefined;
}

export function moveTokenIndexCache(tokens: TokenGroup, offset: number, indexCache: IndexCache): void {
	if (tokens.length == 0) {
		indexCache.number = 0;
		return;
	}

	if (indexCache.number >= tokens.length)
		indexCache.number = tokens.length - 1;

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

export function iterTokenGroup(spec: IterTokenGroupSpec): void {
	let { tokens, ranges, callback, indexCache } = spec;
	moveTokenIndexCache(tokens, ranges[0]?.from ?? 0, indexCache);
	for (
		let i = indexCache.number, j = 0;
		i < tokens.length && j < ranges.length;
	) {
		if (ranges[j].to <= tokens[i].from) { j++; continue }
		if (tokens[i].from < ranges[j].to && tokens[i].to > ranges[j].from) {
			callback(tokens[i]);
		}
		i++;
	}
}