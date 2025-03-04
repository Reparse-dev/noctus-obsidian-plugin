import { ChangeDesc, Range } from "@codemirror/state";
import { Decoration, DecorationSet } from "@codemirror/view";
import { DisplayBehaviour, Format, TokenLevel, TokenStatus } from "src/enums";
import { PluginSettings, TokenGroup } from "src/types";
import { HiddenWidget } from "src/editor-mode/decorator/widgets";
import { SelectionObserver } from "src/editor-mode/observer";

export class DelimOmitter {
    selectionObserver: SelectionObserver;
    settings: PluginSettings;
    constructor(settings: PluginSettings, selectionObserver: SelectionObserver) {
        this.settings = settings;
        this.selectionObserver = selectionObserver;
    }
    omitBlock(omittedSet?: DecorationSet, changes?: ChangeDesc) {
        let omittedRanges: Range<Decoration>[] = [],
            filterRegion = this.selectionObserver.filterRegions[TokenLevel.BLOCK];
        this.selectionObserver.iterateChangedRegion(TokenLevel.BLOCK, (token, index, tokens, inSelection) => {
            if (inSelection || token.status != TokenStatus.ACTIVE || !token.validTag) { return }
            let openFrom = token.from,
                openTo = openFrom + token.openLen + token.tagLen;
            if (token.to > openTo) { openTo++ }
            omittedRanges.push(HiddenWidget.of(openFrom, openTo, token, true));
        });
        if (!omittedSet?.size) {
            omittedSet = Decoration.set(omittedRanges);
        } else {
            if (changes) {
                omittedSet = omittedSet.map(changes);
            }
            for (let i = 0; i < filterRegion.length; i++) {
                let filterRange = filterRegion[i];
                omittedSet = omittedSet.update({
                    filterFrom: filterRange.from,
                    filterTo: filterRange.to,
                    filter: () => false,
                });
            }
            omittedSet = omittedSet.update({ add: omittedRanges });
        }
        return omittedSet;
    }
    omitInline(activeTokens: TokenGroup) {
        let alwaysShowHlTag = this.settings.hlTagDisplayBehaviour & DisplayBehaviour.ALWAYS,
            alwaysShowSpanTag = this.settings.spanTagDisplayBehaviour & DisplayBehaviour.ALWAYS,
            showHlTagIfTouched = this.settings.hlTagDisplayBehaviour & DisplayBehaviour.TAG_TOUCHED,
            showSpanTagIfTouched = this.settings.spanTagDisplayBehaviour & DisplayBehaviour.TAG_TOUCHED;
        let omittedRanges: Range<Decoration>[] = [];
        for (let i = 0; i < activeTokens.length; i++) {
            let token = activeTokens[i],
                openFrom = token.from,
                openTo = openFrom + token.openLen,
                tagTo = openTo + token.tagLen;
            if (this.selectionObserver.touchSelection(token.from, token.to)) {
                if (
                    token.validTag && !this.selectionObserver.touchSelection(openTo, tagTo) &&
                    (token.type == Format.HIGHLIGHT && showHlTagIfTouched || token.type == Format.CUSTOM_SPAN && showSpanTagIfTouched)                    
                ) {
                    omittedRanges.push(HiddenWidget.of(openTo, tagTo, token));
                }
            } else {
                if (token.type == Format.HIGHLIGHT && !alwaysShowHlTag || token.type == Format.CUSTOM_SPAN && !alwaysShowSpanTag) {
                    openTo = tagTo;
                }
                omittedRanges.push(HiddenWidget.of(openFrom, openTo, token));
                if (token.closeLen) {
                    omittedRanges.push(HiddenWidget.of(token.to - token.closeLen, token.to, token));
                }
            }
        }
        return Decoration.set(omittedRanges);
    }
}