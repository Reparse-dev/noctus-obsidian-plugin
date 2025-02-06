import { Decoration, DecorationSet, EditorView, PluginValue, ViewUpdate } from "@codemirror/view";
import { Parser } from "src/editor-mode/parser";
import { DecorationBuilder, RangeOmitter } from "src/editor-mode/decorator/builder";
import { parserField } from "src/editor-mode/state-fields";
import { EditorState, RangeSet } from "@codemirror/state";
import { editorLivePreviewField } from "obsidian";

export class ExtendedSyntax implements PluginValue {
    /** Insertion, superscript, and subscript. */
    mainDecoSet: DecorationSet;
    /**
     * Spoiler and highlight, positioned at upper DOM hierarchy and
     * not split by other decorations. Useful for making them appear
     * continous in the editor, especially when overlap with others.
     */
    outerDecoSet: DecorationSet;
    /** Any type of tag and delimiter */
    delimiterSet: DecorationSet;
    /**
     * Any type of tag and delimiter omitted due to touching cursor or selection.
     * Used only when in live preview mode.
     */
    omittedSet: DecorationSet;
    /**
     * Color button for highlight and revealed text for spoiler,
     * only when selection or cursor are touching them.
     */
    supplementalSet: DecorationSet;
    combinedSet: DecorationSet;
    parser: Parser;
    builder: DecorationBuilder;
    omitter: RangeOmitter;
    noOmit = true;
    constructor(view: EditorView) {
        this.builder = new DecorationBuilder();
        this.omitter = new RangeOmitter();
        this.parser = view.state.field(parserField);
        this.builder.parser = this.parser;
        this.init(view.state);
    }
    init(state: EditorState) {
        let { mainDecoRanges, outerDecoRanges, delimiterRanges } = this.builder.build(state);
        this.mainDecoSet = Decoration.set(mainDecoRanges);
        this.outerDecoSet = Decoration.set(outerDecoRanges);
        this.delimiterSet = Decoration.set(delimiterRanges);
        this.supplementalSet = this.builder.getSupplemental(state, this.outerDecoSet);
        if (state.field(editorLivePreviewField)) {
            this.noOmit = false;
            this.omittedSet = this.omitter.omit(state, this.delimiterSet);
        } else {
            this.omittedSet = RangeSet.empty;
        }
        this.combine();
    }
    update(update: ViewUpdate) {
        if (update.docChanged || this.parser.isReparsing) {
            let { mainDecoRanges, outerDecoRanges, delimiterRanges } = this.builder.build(update.state);
            this.mainDecoSet = this.builder.updateSet(update, this.mainDecoSet, mainDecoRanges);
            this.outerDecoSet = this.builder.updateSet(update, this.outerDecoSet, outerDecoRanges);
            this.delimiterSet = this.builder.updateSet(update, this.delimiterSet, delimiterRanges);
        }
        if (update.docChanged || update.selectionSet || this.parser.isReparsing) {
            this.supplementalSet = this.builder.getSupplemental(update.state, this.outerDecoSet);
        }
        if (update.state.field(editorLivePreviewField)) {
            if (update.docChanged || update.selectionSet || this.parser.isReparsing || this.noOmit) {
                this.omittedSet = this.omitter.omit(update.state, this.delimiterSet);
            }
            this.noOmit = false;
        } else {
            this.omittedSet = RangeSet.empty;
            this.noOmit = true;
        }
        this.combine();
        this.parser.isReparsing = false;
    }
    combine() {
        this.combinedSet = RangeSet.join([
            this.mainDecoSet,
            this.delimiterSet,
            this.omittedSet,
            this.supplementalSet
        ]);
    }
}