import { RangeSet, Range, Text, ChangeSet } from "@codemirror/state";
import { Decoration } from "@codemirror/view";
import { Parser } from "src/editor-mode/parser";
import { IndexCache, RangeSetUpdate, TokenGroup } from "src/types";
import { getLineAt, iterLine } from "src/editor-mode/doc-utils";
import { LineBreak } from "src/editor-mode/decorator/widgets";
import { TokenLevel, TokenStatus } from "src/enums";

export class LineBreakReplacer {
    private linePosCache: IndexCache = { number: 1 };
    parser: Parser;
    lineBreakSet: RangeSet<Decoration> = RangeSet.empty;
    constructor(parser: Parser) {
        this.parser = parser;
    }
    replace(doc: Text, changes?: ChangeSet) {
        let reparsedRange = this.parser.reparsedRanges[TokenLevel.BLOCK],
            blockTokens = this.parser.blockTokens,
            updateSpec: RangeSetUpdate<Decoration> = {
                add: this.produceWidgetRanges(doc)
            };
        if (!blockTokens.length) {
            return this.lineBreakSet = RangeSet.empty;
        }
        if (reparsedRange.from != reparsedRange.initTo || reparsedRange.from != reparsedRange.changedTo) {
            updateSpec.filterFrom = Math.min(blockTokens[reparsedRange.from]?.from ?? this.parser.lastStreamPoint.from, this.parser.lastStreamPoint.from);
            updateSpec.filterTo = this.parser.lastStreamPoint.to;
            updateSpec.filter = () => false;
        }
        if (changes) {
            this.lineBreakSet = this.lineBreakSet.map(changes);
        }
        return this.lineBreakSet = this.lineBreakSet.update(updateSpec);
    }
    private getReparsedBlockTokens(): TokenGroup {
        let range = this.parser.reparsedRanges[TokenLevel.BLOCK];
        return this.parser.blockTokens.slice(range.from, range.changedTo);
    }
    private produceWidgetRanges(doc: Text) {
        let tokens = this.getReparsedBlockTokens(),
            ranges: Range<Decoration>[] = [];
        if (!tokens.length) { return ranges }
        let startLine = getLineAt(doc, tokens[0].from, this.linePosCache),
            tokenIndex = 0;
        iterLine({
            doc,
            fromLn: startLine.number,
            callback: (line) => {
                let curToken = tokens[tokenIndex];
                if (!curToken) { return false }
                if (curToken.status != TokenStatus.ACTIVE) { tokenIndex++; return }
                if (
                    line.from == curToken.from ||
                    line.from - 1 == curToken.from + curToken.openLen + curToken.tagLen
                ) { return }
                if (
                    line.from >= curToken.to ||
                    line.to < curToken.from ||
                    line.to == curToken.to && curToken.closedByBlankLine
                ) { tokenIndex++; return }
                ranges.push(LineBreak.of(line.from));
            },
        });
        return ranges;
    }
}