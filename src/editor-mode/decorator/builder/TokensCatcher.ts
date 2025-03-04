import { TokenGroup } from "src/types";

export class TokensCatcher {
    activeTokens: TokenGroup = [];
    hlTokens: TokenGroup = [];
    spoilerTokens: TokenGroup = [];
    constructor () {}
    catch(activeTokens: TokenGroup, hlTokens: TokenGroup, spoilerTokens: TokenGroup) {
        this.activeTokens = activeTokens;
        this.hlTokens = hlTokens;
        this.spoilerTokens = spoilerTokens;
    }
    empty() {
        this.activeTokens = [];
        this.hlTokens = [];
        this.spoilerTokens = [];
    }
}