import { EditorSelection } from "@codemirror/state";
import { Format, TokenLevel } from "src/enums";
import { IndexCache, PlainRange, Token, TokenGroup } from "src/types";
import { EditorParser } from "src/editor-mode/preprocessor/parser";
import { Region, joinRegions } from "src/editor-mode/utils/range-utils";
import { isInlineFormat } from "src/format-configs/format-utils";

/**
 * Appliance for managing selection-based decorations that are tied to
 * the tokens effectively, avoiding, in some cases, over-iteration and
 * redrawing decorations which indeed aren't selected and can be reused
 * again. Only applied to the line breaks and fenced div opening
 * decorations, which we can't bound decorating them with the viewport,
 * not even visibleRanges. Although, it's still useful for formatting
 * commands for both block and inline tokens.
 */
export class SelectionObserver {
	/** Tokens that are touched or intersected by selection. */
	public selectedRegions: Record<TokenLevel, Region> = {
		[TokenLevel.INLINE]: [],
		[TokenLevel.BLOCK]: []
	}

	/**
	 * All selection-based decorations, e.g. omitted delimiters, that are
	 * associated with these tokens should be redrawn.
	 */
	public changedRegions: Record<TokenLevel, Region> = {
		[TokenLevel.INLINE]: [],
		[TokenLevel.BLOCK]: []
	}
	
	/**
	 * Collection of offset ranges, to be used as filter ranges for the
	 * previously drawn selection-based decorations.
	 */
	public filterRegions: Record<TokenLevel, Region> = {
		[TokenLevel.INLINE]: [],
		[TokenLevel.BLOCK]: []
	}

	private _indexCaches: Record<TokenLevel | "selection", IndexCache> = {
		[TokenLevel.INLINE]: { number: 0 },
		[TokenLevel.BLOCK]: { number: 0 },
		selection: { number: 0 }
	}

	/**
	 * Mapped indexes of tokens to each index of corresponding selection that
	 * is touched by them. For example, `maps[0]` contains all indexes of
	 * tokens that touched the first selection. May be empty if corresponding
	 * selection wasn't touched by any token.
	 */
	private _maps: Partial<Record<TokenLevel, number[]>>[] = [];

	public selection: EditorSelection;
	public readonly parser: EditorParser;

	constructor(parser: EditorParser) {
		this.parser = parser;
	}

	/**
	 * Observe given selection to catch tokens that touched it, then map the
	 * old selected region with the new one, producing latest changed region
	 * that can be used to produce RangeSet filter.
	 * 
	 * @param isParsing When assigned to true, observer will reach into
	 * reparsed ranges produced by the parser, and join it with the
	 * selectedRegion, resulting fresh changedRegion.
	 * 
	 * @param restart Restart the observer to its initial state. You
	 * shouldn't pass any value into it. Use restartObserver() instead.
	 */
	public observe(selection: EditorSelection, isParsing: boolean, restart: boolean = false): void {
		this.selection = selection;
		this._checkIndexCache();

		for (let level = TokenLevel.BLOCK as TokenLevel; level <= TokenLevel.INLINE; level++) {
			let oldSelectedRegion = this.selectedRegions[level];
			this._locateSelectedTokens(level);

			// At the moment, changed and filter region are only applied to block-
			// level tokens.
			if (level == TokenLevel.INLINE) continue;
			this._mapChangedRegion(level, oldSelectedRegion, isParsing, restart);
			this.createFilter(level);
		}
	}

	/**
	 * Restart the observer to its initial state, i.e. clear old selected
	 * region and reobserve given selection.
	 */
	public restartObserver(selection: EditorSelection, isParsing: boolean): void {
		this.selectedRegions = {
			[TokenLevel.BLOCK]: [],
			[TokenLevel.INLINE]: []
		};
		this.observe(selection, isParsing, true);
	}

	/**
	 * Generate region of the tokens that touch or intersect the cursor or
	 * selection.
	 */
	private _locateSelectedTokens(level: TokenLevel): Region {
		let newSelectedRegion: Region = [],
			curRange: PlainRange | undefined;
		this._clearMaps();

		// Moving the cached index to the fore edge of the selection and then
		// starting to look ahead involved tokens is not as efficient as way that
		// look involved tokens behind without altering the cached index. Note
		// that the efficiency of this process isn't so noticable in case of few
		// tokens exist.
		this._lookBehind(level, (_, index, selectionIndex) => {
			if (!this._maps[selectionIndex]?.[level]) {
				this._maps[selectionIndex] = {
					[level]: [index]
				};
			} else {
				this._maps[selectionIndex][level].unshift(index);
			}
			if (!curRange || curRange.from != index + 1) {
				curRange = { from: index, to: index + 1 };
				newSelectedRegion.unshift(curRange);
			} else {
				curRange.from--;
			}
		});
		
		curRange = newSelectedRegion.at(-1);

		this._lookAhead(level, (_, index, selectionIndex) => {
			if (!this._maps[selectionIndex]?.[level]) {
				this._maps[selectionIndex] = {
					[level]: [index]
				};
			} else {
				this._maps[selectionIndex][level].push(index);
			}
			if (!curRange || curRange.to != index) {
				curRange = { from: index, to: index + 1 };
				newSelectedRegion.push(curRange);
			} else {
				curRange.to++;
			}
		});

		this._indexCaches[level].number = newSelectedRegion[0]?.from ?? this._indexCaches[level].number;
		return this.selectedRegions[level] = newSelectedRegion;
	}

	/**
	 * Will move the cached index to the last token if it's went out of the
	 * range.
	 */
	private _checkIndexCache(): void {
		if (this._indexCaches[TokenLevel.INLINE].number >= this.parser.inlineTokens.length)
			this._indexCaches[TokenLevel.INLINE].number = Math.max(this.parser.inlineTokens.length - 1, 0);
		
		if (this._indexCaches[TokenLevel.BLOCK].number >= this.parser.blockTokens.length)
			this._indexCaches[TokenLevel.BLOCK].number = Math.max(this.parser.blockTokens.length - 1, 0);
	}

	/**
	 * Look the tokens behind untill the start offset of the first selection.
	 * Runs the callback when the current token touches the selection.
	 */
	private _lookBehind(level: TokenLevel, callback: (token: Token, index: number, selectionIndex: number) => unknown): void {
		let selectionRanges = this.selection.ranges,
			selectionIndex = selectionRanges.length - 1,
			tokens = this.parser.getTokens(level),
			goalOffset = selectionRanges[0].from;
		
		// Using index taken from the cache as an anchor.
		for (let i = this._indexCaches[level].number - 1; i >= 0 && goalOffset <= tokens[i].to; i--) {
			while (selectionRanges[selectionIndex].from > tokens[i].to) { selectionIndex-- }
			if (!selectionRanges[selectionIndex]) { break }
			if (selectionRanges[selectionIndex].to < tokens[i].from) { continue }
			callback(tokens[i], i, selectionIndex);
		}
	}
	/**
	 * Look the tokens ahead untill the end offset of the last selection.
	 * Runs the callback when the current token touches the selection.
	 */
	private _lookAhead(level: TokenLevel, callback: (token: Token, index: number, selectionIndex: number) => boolean | void): void {
		let selectionRanges = this.selection.ranges,
			selectionIndex = 0,
			tokens = this.parser.getTokens(level),
			goalOffset = selectionRanges.at(-1)!.to;
		
		// Using index taken from the cache as an anchor.
		for (let i = this._indexCaches[level].number; i < tokens.length && goalOffset >= tokens[i].from; i++) {
			while (selectionRanges[selectionIndex].to < tokens[i].from) { selectionIndex++ }
			if (!selectionRanges[selectionIndex]) { break }
			if (selectionRanges[selectionIndex].from > tokens[i].to) { continue }
			callback(tokens[i], i, selectionIndex);
		}
	}

	/**
	 * When the cursor or selection was moved or changed, `DelimOmitter` must
	 * redraw the `HiddenWidget` in order to decide which delimiter should be
	 * hidden due to its syntax is touching the cursor/selection. To make
	 * redrawing process more efficient, obviously because of possibility
	 * that there is delimiter(s) that's still be hidden, we should only
	 * redraw what have been changed by the move of the cursor/selection, or
	 * by a document change. Hence, `mapChangedRegion` comes to map the
	 * token indexes region that should be redrawn.
	 */
	private _mapChangedRegion(level: TokenLevel, oldSelectedRegion: Region, isParsing: boolean, restart?: boolean): Region {
		let reparsedRange = this.parser.reparsedRanges[level],
			reparsedLength = reparsedRange.changedTo - reparsedRange.initTo,
			mappedRegion: Region = [],
			tokensAdded = reparsedRange.from != reparsedRange.changedTo,
			tokensLen = this.parser.getTokens(level).length;
		if (restart)
			return this.changedRegions[level] = tokensLen
				? [{ from: 0, to: tokensLen }]
				: [];
		
		// Don't map the previous selected region when there is actually no
		// parsing activity.
		if (!isParsing || reparsedRange.from == reparsedRange.initTo && !reparsedLength)
			return this.changedRegions[level] = joinRegions(oldSelectedRegion, this.selectedRegions[level]);
		
		// Use either reparsed range or selected region directly when there is no
		// token selected before.
		if (!oldSelectedRegion.length) {
			if (tokensAdded)
				return this.changedRegions[level] = joinRegions([{ from: reparsedRange.from, to: reparsedRange.changedTo }], this.selectedRegions[level]);

			return this.changedRegions[level] = this.selectedRegions[level];
		}

		// We should map the old selected region with the reparsed range before
		// joinning it with the new one.
		for (let i = 0, isTouched = false; i < oldSelectedRegion.length;) {
			if (oldSelectedRegion[i].to < reparsedRange.from) {
				mappedRegion.push(Object.assign({}, oldSelectedRegion[i]));
				if (++i >= oldSelectedRegion.length) {
					if (tokensAdded)
						mappedRegion.push({ from: reparsedRange.from, to: reparsedRange.changedTo });
					break;
				}
			} else if (oldSelectedRegion[i].from < reparsedRange.initTo) {
				isTouched = true;
				let from = Math.min(reparsedRange.from, oldSelectedRegion[i].from),
					to = Math.max(reparsedRange.changedTo, oldSelectedRegion[i].to + reparsedLength);
				if (from != to)
					mappedRegion.push({ from, to });
				do { i++ } while (i < oldSelectedRegion.length && oldSelectedRegion[i].from < reparsedRange.initTo)
			} else {
				if (!isTouched && tokensAdded)
					mappedRegion.push({ from: reparsedRange.from, to: reparsedRange.changedTo });
				do {
					mappedRegion.push({
						from: oldSelectedRegion[i].from + reparsedLength,
						to: oldSelectedRegion[i].to + reparsedLength
					});
					i++;
				} while (i < oldSelectedRegion.length)
			}
		}

		// Finalize the mapping of the changed region.
		return this.changedRegions[level] = joinRegions(mappedRegion, this.selectedRegions[level]);
	}

	/** Empty any of index maps. */
	private _clearMaps(): void {
		this._maps = new Array(this.selection.ranges.length).map(() => ({}));
	}

	/**
	 * Will move the cached index of the selections to the last index if it
	 * exceeds the amount of the selection ranges.
	 */
	private _checkSelectionIndexCache(): void {
		if (this._indexCaches.selection.number >= this.selection.ranges.length)
			this._indexCaches.selection.number = this.selection.ranges.length - 1;
	}

	/**
	 * Create filter region that will be used as filtering boundary in
	 * `RangeSet<Decoration>.filter()`.
	 */
	public createFilter(level: TokenLevel): Region {
		let tokens = level == TokenLevel.INLINE
			? this.parser.inlineTokens
			: this.parser.blockTokens;
		if (!tokens.length)
			return this.filterRegions[level] = [Object.assign({}, this.parser.lastStreamPoint)];
		
		let filterRegion: Region = [],
			changedRegion = this.changedRegions[level],
			// Inline tokens can be touched each other. To avoid filtering uninvolved
			// decoration, filtering offset should be more inwardly indented. Doing
			// so in block-level decorations makes filtering miss them due to
			// frontmost position and using line decoration which the actually length
			// is 0.
			side = level == TokenLevel.INLINE ? 1 : 0;
		
		for (let i = 0; i < changedRegion.length; i++) {
			let range = changedRegion[i],
				filterFrom: number,
				filterTo: number;
			// Sometimes, the range can exceed the length of the tokens.
			if (range.to > tokens.length) {
				if (range.from >= tokens.length)
					filterFrom = this.parser.lastStreamPoint.from;
				else
					filterFrom = tokens[range.from].from + side;
				filterTo = this.parser.lastStreamPoint.to;
			} else {
				filterFrom = tokens[range.from].from + side;
				filterTo = tokens[range.to - 1].to - side;
			}
			filterRegion.push({ from: filterFrom, to: filterTo });
		}

		return this.filterRegions[level] = filterRegion;
	}

	/**
	 * Iterate over tokens involved in the changed region. `to` in each range
	 * isn't included in the iteration.
	 */
	public iterateChangedRegion(level: TokenLevel, callback?: (token: Token, index: number, tokens: TokenGroup, inSelection: boolean) => unknown): void {
		let tokens = this.parser.getTokens(level),
			changedRegion = this.changedRegions[level],
			selectedRegion = this.selectedRegions[level];
		for (let i = 0, j = 0; i < changedRegion.length; i++) {
			let changedRange = changedRegion[i];
			for (let index = changedRange.from; index < changedRange.to; index++) {
				// Checking whether the current token was in selection or not. We don't
				// use looping directly to check inSelection state, due to the fact that
				// changed region was a union of the selected region and the others.
				let inSelection = false;
				if (selectedRegion[j] && selectedRegion[j].to <= index) { j++ }
				if (selectedRegion[j] && selectedRegion[j].from <= index) {
					inSelection = true;
				}
				// Possibly to be undefined, espically when the last token was removed.
				if (!tokens[index]) { continue }
				callback?.(tokens[index], index, tokens, inSelection);
			}
		}
	}

	/**
	 * Iterate over tokens that are inside, intersected by, or touched by
	 * selection. `to` in each range isn't included in the iteration. Return
	 * it `false` to cut off the iteration.
	 * 
	 * @param watchPos - If true, the last argument of the callback will be
	 * passed, either `"covered"` (selection covers all across the range
	 * of the token), `"intersect"` (selection covers a part of the token),
	 * `"adjacent"` (selection just touches one of its edges), or
	 * `"covering"` (range of the selection being covered by the token).
	 * Otherwise, will be passed as `undefined`.
	 */
	public iterateSelectedRegion(
        level: TokenLevel,
        watchPos: boolean,
        callback?: (token: Token, index: number, tokens: TokenGroup, pos: undefined | "covered" | "intersect" | "covering" | "adjacent") => void | boolean
    ) {
		let tokens = this.parser.getTokens(level),
			selectionRanges = this.selection.ranges,
			selectedRegion = this.selectedRegions[level];

		// i => selected range index
		// j => selection range index
		// k => token index
		for (let i = 0, j = 0; i < selectedRegion.length; i++) {
			let selectedRange = selectedRegion[i];
			for (let k = selectedRange.from; k < selectedRange.to; k++) {
				let token = tokens[k],
					pos: "covered" | "intersect" | "adjacent" | "covering" | undefined;

				// Withdraw selection range index and reassign it by the first selection
				// index that touched current token, if the current token shared the same
				// selection with the previous one.
				for (let prevIndex = j - 1; prevIndex >= 0; prevIndex--) {
					if (selectionRanges[prevIndex].to < token.from) break;
					if (selectionRanges[prevIndex].from <= token.to) j = prevIndex;
				}

				// There is no token that isn't touched by any selection at least.
				while (token.to < selectionRanges[j].from) j++;
				
				// A single token could be touched by more than one selection.
				while (selectionRanges[j] && token.to >= selectionRanges[j].from) {
					if (watchPos) {
						// Relative position precedence order:
						// covered -> covering -> intersect -> adjacent
						if (pos != "covered" && token.from >= selectionRanges[j].from && token.to <= selectionRanges[j].to) {
							pos = "covered";
						} else if (pos != "covering" && token.from < selectionRanges[j].from && token.to > selectionRanges[j].to) {
							pos = "covering";
						} else if (pos === undefined && (token.from == selectionRanges[j].to || token.to == selectionRanges[j].from)) {
							pos = "adjacent";
						} else if (pos === undefined || pos === "adjacent") {
							pos = "intersect";
						}
					}
					j++;
				}

				// If callback returned false, cut the iteration off.
				if (callback?.(token, k, tokens, pos) === false) return;
			}
		}
	}

	/** Check that the given range touches the current selection or not. */
	public touchSelection(from: number, to: number): boolean {
		this._checkSelectionIndexCache();
		let selectionRanges = this.selection.ranges,
			// The index cache seems to have a significant effect in the case of many
			// of the selections were applied at the same time.
			indexCache = this._indexCaches.selection,
			curRange = selectionRanges[indexCache.number] ?? selectionRanges.at(-1)!;
		
		if (to < curRange.from) {
			while (indexCache.number >= 0) {
				if (from <= curRange.to && to >= curRange.from) { return true }
				curRange = selectionRanges[--indexCache.number];
			}
			indexCache.number = 0;
		}
		
		else if (from > curRange.to) {
			while (indexCache.number < selectionRanges.length) {
				if (from <= curRange.to && to >= curRange.from) { return true }
				curRange = selectionRanges[++indexCache.number];
			}
			indexCache.number = selectionRanges.length - 1;
		}
		
		else
			return true;

		return false;
	}

	/** Pick index map of selected tokens based on their type. */
	public pickMaps(type: Format): (number[] | undefined)[] {
		let level = isInlineFormat(type) ? TokenLevel.INLINE : TokenLevel.BLOCK,
			tokens = this.parser.getTokens(level);
		return this._maps.map(maps => maps[level]?.filter(tokenIndex => tokens[tokenIndex].type == type));
	}
}