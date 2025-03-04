import { Region } from "src/types";

/**
 * Create disjunction between two regions.
 * 
 * @suspended _not in use at the time_.
 */
export function separateRegions(regionA: Region, regionB: Region) {
    let disjunctRegion: Region = [],
        differRegionA: Region = [],
        differRegionB: Region = [],
        intersectPoint: undefined | number;
    for (let i = 0, j = 0; i < regionA.length || j < regionB.length;) {
        if (!regionB[j] || regionA[i] && regionA[i].to <= regionB[j].from) {
            let range = { from: intersectPoint ?? regionA[i].from, to: regionA[i].to };
            disjunctRegion.push(range);
            differRegionA.push(range);
            intersectPoint = undefined;
            i++; continue;
        }
        if (!regionA[i] || regionB[j].to <= regionA[i].from) {
            let range = { from: intersectPoint ?? regionB[j].from, to: regionB[j].to };
            disjunctRegion.push(range);
            differRegionB.push(range);
            intersectPoint = undefined;
            j++; continue;
        }
        if (regionA[i].from < regionB[j].from) {
            let range = { from: regionA[i].from, to: regionB[j].from };
            disjunctRegion.push(range);
            differRegionA.push(range);
        } else if (regionB[j].from < regionA[i].from) {
            let range = { from: regionB[j].from, to: regionA[i].from };
            disjunctRegion.push(range);
            differRegionB.push(range);
        }
        if (regionA[i].to < regionB[j].to) { intersectPoint = regionA[i].to; i++ }
        else if (regionA[i].to > regionB[j].to) { intersectPoint = regionB[j].to; j++ }
        else { i++; j++; intersectPoint = undefined }
    }
    return { disjunctRegion, differRegionA, differRegionB };
}