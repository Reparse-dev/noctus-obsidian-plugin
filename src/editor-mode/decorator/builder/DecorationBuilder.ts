import { EditorState, Range } from "@codemirror/state";
import { Decoration, DecorationSet, ViewUpdate } from "@codemirror/view";
import { Parser } from "src/editor-mode/parser";
import { Format, TokenRole, TokenStatus } from "src/enums";
import { createHlDeco } from "src/editor-mode/decorator/utils";
import { AlignDeco, AlignMarkDeco, ColorTagDeco, ContentDeco, DelimDeco, RevealedSpoiler } from "src/editor-mode/decorator/decorations";
import { AlignFormat, MainFormat } from "src/types";
import { ColorButton } from "src/editor-mode/decorator/widgets";

/** Decoration builder (excludes omitted delimiter), should be attached to `ExtendedSyntax` */
export class DecorationBuilder {
    /** Attached `Parser` for obtaining tokens quickly */
    parser: Parser;
    constructor() {
    }
    /**
     * Produces _necessary_ decoration ranges from tokens provided by
     * `Builder.parser`. Therefore, it doesn't reproduce new ranges
     * from reused tokens. Doesn't include supplementary and omitted
     * delimiter.
     */
    build(state: EditorState) {
        let doc = state.doc,
            tokens = this.parser.tokens,
            mainDecoRanges: Range<Decoration>[] = [],
            outerDecoRanges: Range<Decoration>[] = [],
            delimiterRanges: Range<Decoration>[] = [],
            { startToken, endToken } = this.parser.lastParsed;
        for (
            let i = startToken, token = tokens[i];
            i < endToken;
            token = tokens[++i]
        ) {
            if (token.status != TokenStatus.ACTIVE) { continue }
            if (token.role == TokenRole.OPEN) {
                if (token.type == Format.HIGHLIGHT) {
                    let color = "",
                        mayBeColorTag = tokens[i + 2],
                        close = tokens[i + token.size - 1],
                        hasColorTag = mayBeColorTag?.type == Format.HIGHLIGHT_COLOR_TAG;
                    // gets color tag
                    if (hasColorTag) {
                        color = doc.sliceString(mayBeColorTag.from + 1, mayBeColorTag.to - 1);
                        i++;
                    }
                    let hlDeco = createHlDeco(color, { openLen: token.to - token.from });
                    // highlight should be pushed in outer decorations
                    outerDecoRanges.push(hlDeco.range(token.from, close.to));
                    if (hasColorTag) {
                        delimiterRanges.push(ColorTagDeco.range(mayBeColorTag.from, mayBeColorTag.to));
                    }
                } else {
                    let content = tokens[++i];
                    delimiterRanges.push(DelimDeco[token.type as MainFormat].range(token.from, token.to));
                    if (token.type == Format.SPOILER) { // spoiler should be pushed in outer decorations
                        outerDecoRanges.push(ContentDeco[token.type as MainFormat].range(content.from, content.to));
                    } else {
                        mainDecoRanges.push(ContentDeco[token.type as MainFormat].range(content.from, content.to));
                    }
                }
            } else if (token.role == TokenRole.CLOSE && token.type != Format.HIGHLIGHT) {
                delimiterRanges.push(DelimDeco[token.type as MainFormat].range(token.from, token.to));
            } else if (token.role == TokenRole.SINGLE) {
                delimiterRanges.push(AlignMarkDeco[token.type as AlignFormat].range(token.from, token.to));
                mainDecoRanges.push(AlignDeco[token.type as AlignFormat].range(token.from, token.from));
            }
        }
        return { mainDecoRanges, outerDecoRanges, delimiterRanges };
    }
    /**
     * Filters out some ranges from old set that needs to be replaced by the new one,
     * resulting new `DecorationSet`. Doesn't intended to filtering supplementary
     * and omitted delimiter set.
     */
    updateSet(update: ViewUpdate, decoSet: DecorationSet, ranges: Range<Decoration>[]) {
        let { startToken: start, endToken: end } = this.parser.lastParsed,
            docLen = update.state.doc.length,
            filterFrom = (this.parser.tokens[start - 1]?.to ?? 0),
            filterTo = (this.parser.tokens[end]?.from ?? docLen);
        return decoSet.map(update.changes).update({
            add: ranges, filterFrom, filterTo,
            filter(from, to, val) {
                return (to == filterFrom || from == filterTo) && ((val.spec.type as Format) <= Format.ALIGN_JUSTIFY || to != from);
            }
        });
    }
    /** Produces supplementary decorations (color button and reveled text for spoiler). */
    // TODO: Make it incrementally
    getSupplemental(state: EditorState, outerDecoSet: DecorationSet) {
        let decoRanges: Range<Decoration>[] = [],
            selectRanges = state.selection.ranges,
            i = 0;
        outerDecoSet.between(0, state.doc.length, (from, to, val) => {
            while (selectRanges[i] && selectRanges[i].to < from) { i++ }
            if (!selectRanges[i]) { return false }
            if (selectRanges[i].from > to) { return }
            let type = val.spec.type as Format.HIGHLIGHT | Format.SPOILER;
            if (type == Format.HIGHLIGHT) {
                let color = val.spec.color as string,
                    offset = from + (val.spec.openLen as number);
                decoRanges.push(ColorButton.of(offset, color));
            } else if (type == Format.SPOILER) {
                decoRanges.push(RevealedSpoiler.range(from, to));
            }
        });
        return Decoration.set(decoRanges);
    }
}