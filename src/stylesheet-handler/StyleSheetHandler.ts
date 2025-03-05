import * as Plugin from "main";

export class StyleSheetHandler {
    stylesheet: CSSStyleSheet;
    plugin?: Plugin.default;
    root: DocumentOrShadowRoot;
    subHandlers: StyleSheetHandler[] = [];
    constructor(plugin?: Plugin.default, root: DocumentOrShadowRoot = document, rootStyleSheet?: CSSStyleSheet) {
        let curWindow = (root as Document)?.win ?? (root as ShadowRoot).ownerDocument.win;
        this.stylesheet = new ((curWindow as unknown as { globalThis: typeof globalThis }).globalThis).CSSStyleSheet();
        this.plugin = plugin;
        this.root = root;
        this.adoptMain();
        if (rootStyleSheet) {
            this.copy(rootStyleSheet);
        }
    }
    get rulesLen() {
        return this.stylesheet.cssRules.length;
    }
    adoptMain() {
        this.root.adoptedStyleSheets = [this.stylesheet, ...this.root.adoptedStyleSheets];
    }
    abandonMain() {
        let initStyleSheets = this.root.adoptedStyleSheets.filter(stylesheet => stylesheet != this.stylesheet);
        this.root.adoptedStyleSheets = initStyleSheets;
        this.subHandlers.forEach(handler => handler.destroy());
        this.subHandlers = [];
    }
    adopt(doc: DocumentOrShadowRoot) {
        if (doc == this.root || this.subHandlers.find(handler => handler.root == this.root)) { return }
        this.subHandlers.push(new StyleSheetHandler(undefined, doc, this.stylesheet));
    }
    abandon(doc: DocumentOrShadowRoot) {
        if (doc == this.root) { return }
        this.subHandlers.find((handler, index) => {
            if (handler.root == doc) {
                handler.destroy();
                this.subHandlers.splice(index, 1);
                return true;
            }
        });
    }
    destroy() {
        this.abandonMain();
        (this.root as unknown as undefined) = undefined;
        (this.stylesheet as unknown as undefined) = undefined;
        if (this.plugin) {
            (this.plugin.colorsHandler as unknown as undefined) = undefined;
        }
    }
    insert(ruleStr: string, index = this.rulesLen) {
        this.subHandlers.forEach(handler => handler.insert(ruleStr, index));
        return this.stylesheet.insertRule(ruleStr, index);
    }
    replace(ruleStr: string, index: number) {
        this.stylesheet.deleteRule(index);
        this.stylesheet.insertRule(ruleStr, index);
        this.subHandlers.forEach(handler => handler.replace(ruleStr, index));
    }
    moveSingleRule(index: number, to: 1 | -1) {
        if (to !== 1 && to !== -1) { throw Error("") }
        if (index <= 0 && to < 0 || index >= this.rulesLen - 1 && to > 0) { return false }
        let ruleStr = this.stylesheet.cssRules.item(index)!.cssText;
        this.stylesheet.deleteRule(index);
        this.insert(ruleStr, index + to);
        this.subHandlers.forEach(handler => handler.moveSingleRule(index, to));
    }
    moveRule(fromIndex: number, toIndex: number) {
        if (fromIndex == toIndex) { return }
        let greaterIndex = Math.max(fromIndex, toIndex),
            smallerIndex = Math.min(fromIndex, toIndex),
            ruleStr = this.stylesheet.cssRules.item(greaterIndex)!.cssText;
        this.removeSingle(greaterIndex);
        this.insert(ruleStr, smallerIndex);
        this.subHandlers.forEach(handler => handler.moveRule(fromIndex, toIndex));
    }
    removeSingle(index: number) {
        this.stylesheet.deleteRule(index);
        this.subHandlers.forEach(handler => handler.removeSingle(index));
    }
    remove(from: number, to: number) {
        let rulesLen = this.rulesLen;
        for (let i = Math.min(to, rulesLen) - 1; i >= from; i--) {
            this.stylesheet.deleteRule(i);
        }
        this.subHandlers.forEach(handler => handler.remove(from, to));
    }
    removeAll() {
        this.stylesheet.replace("");
        this.subHandlers.forEach(handler => handler.removeAll());
    }
    copy(stylesheet: CSSStyleSheet) {
        for (let i = 0; i < stylesheet.cssRules.length; i++) {
            let ruleStr = stylesheet.cssRules.item(i)!.cssText;
            this.stylesheet.insertRule(ruleStr, i);
        }
    }
}