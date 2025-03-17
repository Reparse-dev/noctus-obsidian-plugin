import { Region } from "src/types";

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