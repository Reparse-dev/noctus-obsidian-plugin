import { PlainRange, Token, TokenGroup } from "src/types";

type TokenPartsRanges = Record<"openRange" | "closeRange" | "tagRange" | "contentRange", PlainRange>;
interface IterTokenGroupSpec {
	tokens: TokenGroup,
	ranges: PlainRange[] | readonly PlainRange[]
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

export function iterTokenGroup(spec: IterTokenGroupSpec): void {
	let { tokens, ranges, callback } = spec,
		tokenI = findTokenIndexAt(tokens, ranges[0]?.from ?? 0),
		rangeI = 0;

	if (tokenI === null) return;

	while (
		tokenI < tokens.length &&
		rangeI < ranges.length
	) {
		if (ranges[rangeI].to <= tokens[tokenI].from) { rangeI++; continue }
		if (
			tokens[tokenI].from < ranges[rangeI].to &&
			tokens[tokenI].to > ranges[rangeI].from
		) {
			callback(tokens[tokenI]);
		}
		tokenI++;
	}
}

export function findTokenIndexAt(tokens: TokenGroup, offset: number): number | null {
	if (!tokens.length) return null;

	let base = 32768,
		factor = 2,
		index = 0;

	while (base !== 32) {
		if (tokens.length > base)
			while (tokens[index].from <= offset) {
				let end = Math.min(index + base, tokens.length);
				if (tokens[end - 1].to < offset) index = end;
				else break;
			}

		base /= factor;
		factor *= 2;
	}

	for (
		let end = Math.min(index + base, tokens.length);
		index < end && tokens[index].to < offset;
		index++
	);
	
	return index < tokens.length ? index : null;
}