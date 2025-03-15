import { ChangeSet, ChangeSpec, EditorSelection, SelectionRange, Text } from "@codemirror/state";
import { Format, TokenLevel } from "src/enums";
import { BlockFormat, InlineFormat, PluginSettings, TokenGroup } from "src/types";
import { SelectionObserver } from "src/editor-mode/observer";
import { isInlineFormat } from "src/format-configs/utils";
import { trimSelection } from "src/editor-mode/selection";
import { BlockRules, InlineRules } from "src/format-configs";

export class FormatterState {
    docLen: number;
    tokens: TokenGroup;
    selectionRanges: SelectionRange[];
    curSelectionIndex: number = 0;
    tokenMaps: (number[] | undefined)[];
    curTokenMap: number[] | undefined;
    level: TokenLevel;
    type: Format;
    delimStr: string;
    tagStr: string | undefined;
    precise: boolean;
    changes: ChangeSpec[] = [];
    selectionShift: Partial<Record<number, { shift: number }>> = {};
    changeSet: ChangeSet;
    remappedSelection: EditorSelection;
    constructor(type: Format, doc: Text, selectionObserver: SelectionObserver, settings: PluginSettings, tagStr?: string) {
        this.type = type;
        this.docLen = doc.length;
        this.level = isInlineFormat(type) ? TokenLevel.INLINE : TokenLevel.BLOCK;
        this.tagStr = tagStr;
        this.precise = settings.tidyFormatting;
        this.tokens = selectionObserver.parser.getTokens(this.level);
        this.tokenMaps = selectionObserver.pickMaps(type);
        this.curTokenMap = this.tokenMaps[this.curSelectionIndex];
        if (this.precise) {
            let trimmedSelection = trimSelection(selectionObserver.selection, doc);
            this.selectionRanges = trimmedSelection.ranges.map(range => range);
        } else {
            this.selectionRanges = selectionObserver.selection.ranges.map(range => range);
        }
        if (tagStr && this.level == TokenLevel.INLINE) {
            this.tagStr = "{" + tagStr + "}";
        } else if (this.level == TokenLevel.BLOCK) {
            this.tagStr += "\n";
        }
        let { char, length: delimLen } = this.level == TokenLevel.INLINE
            ? InlineRules[type as InlineFormat]
            : BlockRules[type as BlockFormat];
        this.delimStr = char.padEnd(delimLen, char);
    }
    get curRange() {
        return this.selectionRanges[this.curSelectionIndex];
    }
    get mappedTokens(): TokenGroup {
        if (!this.curTokenMap) { return [] }
        return this.curTokenMap.map(index => this.tokens[index]);
    }
    advance() {
        this.curSelectionIndex++
        if (this.curSelectionIndex >= this.selectionRanges.length) {
            return false;
        }
        this.curTokenMap = this.tokenMaps[this.curSelectionIndex];
        return true;
    }
    pushChange(spec: ChangeSpec) {
        this.changes.push(spec);
    }
    pushSelectionShift(index: number, shift: number) {
        this.selectionShift[index] = { shift };
    }
}