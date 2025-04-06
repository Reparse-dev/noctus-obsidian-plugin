import { PlainRange } from "src/types";

/**
 * Region defined here as a `PlainRange` collection arranged in an array.
 * Each range inside should be sorted in order according to its `from`.
 */
export type Region = PlainRange[];

/** Join two regions into a single region. */
export function joinRegions(regionA: Region, regionB: Region): Region {
	let unionRegion: Region = [];
	for (let i = 0, j = 0; i < regionA.length || j < regionB.length;) {
		// Joinned range only occurs between two touched/intersected ranges.
		if (!regionB[j] || regionA[i] && regionA[i].to < regionB[j].from) {
			unionRegion.push(Object.assign({}, regionA[i]));
			i++; continue;
		}
		if (!regionA[i] || regionB[j] && regionB[j].to < regionA[i].from) {
			unionRegion.push(Object.assign({}, regionB[j]));
			j++; continue;
		}
		unionRegion.push({
			from: Math.min(regionA[i].from, regionB[j].from),
			to: Math.max(regionA[i].to, regionB[j].to)
		});
		i++; j++;
	}
	return unionRegion;
}

/** Check whether the offset touches the range. */
export function isTouched(offset: number, range: PlainRange): boolean {
	return offset >= range.from && offset <= range.to;
}