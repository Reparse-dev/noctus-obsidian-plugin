import { Line, Range } from "@codemirror/state";
import { Decoration } from "@codemirror/view";
import { Token, TokenDecoration } from "src/types";
import { Format } from "src/enums";

export const REVEALED_SPOILER_DECO: Decoration = Decoration.mark({
	class: "cm-spoiler-revealed",
})

export function createHlDeco(color: string, data?: Record<string, unknown>): Decoration {
	let spec: Parameters<typeof Decoration.mark>[0] = {
		class: "cm-custom-highlight cm-custom-highlight-" + (color || "default"),
		type: Format.HIGHLIGHT,
		color,
		inclusive: false
	};
	if (data)
		for (let prop in data) spec[prop] = data[prop];
	return Decoration.mark(spec);
}

export function createInlineDecoRange(token: Token, cls: string): Range<TokenDecoration> {
	return (Decoration
		.mark({ class: cls, token }) as TokenDecoration)
		.range(token.from, token.to);
}

export function createLineDecoRange(token: Token, cls: string, line: Line): Range<TokenDecoration> {
	return (Decoration
		.line({ class: cls, token }) as TokenDecoration)
		.range(line.from);
}