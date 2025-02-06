import { EditorState, Range } from "@codemirror/state";
import { Decoration, DecorationSet } from "@codemirror/view";
import { HiddenWidget } from "src/editor-mode/decorator/widgets";
import { Format } from "src/enums";
import { MainFormat } from "src/types";

/**
 * Omits delimiters that touch the cursor or selection,
 * so those don't appear in the editor.
 */
export class RangeOmitter {
    constructor() {};
    /** Should be run in preview mode only */
    omit(state: EditorState, delimiterSet: DecorationSet) {
        let omittedRanges: Range<Decoration>[] = [],
            selectRanges = state.selection.ranges, i = 0,
            openOffset: { [T in MainFormat]: null | number } = {
                [Format.INSERTION]: null,
                [Format.SPOILER]: null,
                [Format.SUPERSCRIPT]: null,
                [Format.SUBSCRIPT]: null,
                [Format.HIGHLIGHT]: null
            };
        delimiterSet.between(0, state.doc.length, (from, to, val) => {
            let type = val.spec.type as Format;
            if (type == Format.COLOR_TAG || type <= Format.ALIGN_JUSTIFY) {
                while (i + 1 < selectRanges.length && selectRanges[i].to < from) { i++ }
                if (selectRanges[i].from > to || selectRanges[i].to < from) {
                    omittedRanges.push(HiddenWidget.of(from, to, val));
                    return;
                }
            }
            else {
                if (openOffset[type as MainFormat] === null) {
                    openOffset[type as MainFormat] = from;
                } else {
                    let length = to - from,
                        openFrom = openOffset[type as MainFormat]!;
                    while (i + 1 < selectRanges.length && selectRanges[i].to < openFrom) { i++ }
                    if (selectRanges[i].from > to || selectRanges[i].to < openFrom) {
                        omittedRanges.push(
                            HiddenWidget.of(openFrom, openFrom + length, val),
                            HiddenWidget.of(from, to, val)
                        );
                    }
                    openOffset[type as MainFormat] = null;
                }
            }
        });
        return Decoration.set(omittedRanges, true);
    }
}