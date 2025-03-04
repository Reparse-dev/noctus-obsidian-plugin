import { RangeSet } from "@codemirror/state";
import { DecorationSet } from "@codemirror/view";

export class DecorationHolder {
    inlineSet: DecorationSet = RangeSet.empty;
    blockSet: DecorationSet = RangeSet.empty;
    inlineOmittedSet: DecorationSet = RangeSet.empty;
    blockOmittedSet: DecorationSet = RangeSet.empty;
    colorBtnSet: DecorationSet = RangeSet.empty;
    revealedSpoilerSet: DecorationSet = RangeSet.empty;
    lineBreaksSet: DecorationSet = RangeSet.empty;
    constructor() {}
}