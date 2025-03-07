import { EditorView } from "@codemirror/view";
import { Menu } from "obsidian";
import { ColorConfig, IndexCache, PlainRange, Token } from "src/types";
import { appFacet, settingsFacet } from "src/editor-mode/facets";
import { getActiveCanvasNodeCoords } from "src/editor-mode/utils";

export class ColorMenu extends Menu {
    openRange: PlainRange;
    tagRange: PlainRange;
    closeRange: PlainRange;
    itemIndexCache: IndexCache;
    moveCursorAfterTag: boolean;
    view: EditorView;
    private constructor(view: EditorView, openRange: PlainRange, tagRange: PlainRange, closeRange: PlainRange, moveCursorAfterTag: boolean, itemIndexCache: IndexCache) {
        super();
        this.view = view;
        this.openRange = openRange;
        this.tagRange = tagRange;
        this.closeRange = closeRange;
        this.moveCursorAfterTag = moveCursorAfterTag;
        this.dom.addClass("highlight-colors-modal");
        this.itemIndexCache = itemIndexCache;
    }
    get openLen() {
        return this.openRange.to - this.openRange.from;
    }
    get closeLen() {
        return this.closeRange.to - this.closeRange.from;
    }
    get tagLen() {
        return this.tagRange.to - this.tagRange.from;
    }
    addColorConfigs(configs: ColorConfig[]) {
        configs.forEach(({ name, tag, showInMenu }) => {
            if (!showInMenu) { return }
            this.setItem(name, "palette", "menu-item-" + tag, () => { this.changeColor(tag) })
        });
    }
    addAccent() {
        this.setItem("Accent", "palette", "menu-item-accent", () => { this.changeColor("accent") });
    }
    addDefault() {
        this.setItem("Default", "palette", "menu-item-default", () => { this.toDefault() });
    }
    addRemove() {
        this.setItem("Remove", "eraser", "menu-item-remove-highlight", () => { this.removeColor() });
    }
    setItem(title: string, icon: string, cls: string, callback: (evt: MouseEvent | KeyboardEvent) => unknown) {
        this.addItem(item => {
            item.setTitle(title);
            item.setIcon(icon);
            item.dom.addClass(cls);
            item.onClick(evt => {
                let index = this.items.findIndex(i => i == item);
                this.itemIndexCache.number = index;
                callback(evt);
            });
        });
    }
    showMenu(offset?: number) {
        this.checkItemIndexCache();
        this.view.requestMeasure({
            read: (view) => {
                let app = view.state.facet(appFacet.reader),
                    canvasNodeCoords = getActiveCanvasNodeCoords(app),
                    charCoords = view.coordsForChar(this.tagRange.from);
                return { charCoords, canvasNodeCoords };
            },
            write: (measure) => {
                let { charCoords, canvasNodeCoords } = measure;
                if (charCoords) {
                    let menuCoords = { x: charCoords.left, y: charCoords.bottom };
                    if (canvasNodeCoords) {
                        menuCoords.x += canvasNodeCoords.x;
                        menuCoords.y += canvasNodeCoords.y;
                    }
                    this.showAtPosition(menuCoords);
                    this.select(this.itemIndexCache.number);
                }
            }
        });
    }
    adjustPos(differ: number) {
        this.tagRange.to += differ;
        this.closeRange.from += differ;
        this.closeRange.to += differ;
    }
    changeColor(color: string) {
        let oldTagRange = { from: this.tagRange.from, to: this.tagRange.to };
        let differ = color.length + 2 - (this.tagRange.to - this.tagRange.from);
        this.adjustPos(differ);
        this.view.dispatch({
            changes: {
                from: oldTagRange.from,
                to: oldTagRange.to,
                insert: `{${color}}`
            }
        }, {
            selection: this.moveCursorAfterTag ? {
                anchor: this.tagRange.to,
                head: this.tagRange.to
            } : undefined,
            sequential: true
        });
    }
    removeColor() {
        this.view.dispatch({
            changes: [{
                from: this.openRange.from,
                to: this.tagRange.to,
                insert: ""
            }, {
                from: this.closeRange.from,
                to: this.closeRange.to,
                insert: ""
            }]
        });
    }
    toDefault() {
        this.view.dispatch({
            changes: {
                from: this.tagRange.from,
                to: this.tagRange.to,
                insert: ""
            }
        });
        let tagLen = this.tagLen;
        this.adjustPos(-tagLen);
    }
    onunload() {
        (this.view as unknown as null) = null;
        super.onunload();
    }
    checkItemIndexCache() {
        if (this.itemIndexCache.number >= this.items.length) {
            this.itemIndexCache.number = this.items.length - 1;
        }
    }
    static create(
        view: EditorView,
        openRange: PlainRange,
        tagRange: PlainRange,
        closeRange: PlainRange,
        moveCursorAfterTag: boolean,
        itemIndexCache: IndexCache = { number: 0 },
        option: { default?: boolean, accent?: boolean, remove?: boolean } = { default: true, accent: true, remove: true }
    ) {
        let colorMenu = new ColorMenu(view, openRange, tagRange, closeRange, moveCursorAfterTag, itemIndexCache),
            colorConfigs = view.state.facet(settingsFacet).colorConfigs;
        colorMenu.addColorConfigs(colorConfigs);
        if (option?.accent) { colorMenu.addAccent() }
        if (option?.default) { colorMenu.addDefault() }
        if (option?.remove) { colorMenu.addRemove() }
        return colorMenu;
    }
    static fromToken(view: EditorView, hlToken: Token, moveCursorAfterTag: boolean, itemIndexCache: IndexCache = { number: 0 }, option: { default?: boolean, accent?: boolean, remove?: boolean } = { default: true, accent: true, remove: true }) {
        let openRange = { from: hlToken.from, to: hlToken.from + hlToken.openLen },
            tagRange = { from: openRange.to, to: openRange.to + hlToken.tagLen },
            closeRange = { from: hlToken.to - hlToken.closeLen, to: hlToken.to },
            colorConfigs = view.state.facet(settingsFacet).colorConfigs,
            colorMenu = new ColorMenu(view, openRange, tagRange, closeRange, moveCursorAfterTag, itemIndexCache);
        colorMenu.addColorConfigs(colorConfigs);
        if (option?.accent) { colorMenu.addAccent() }
        if (option?.default) { colorMenu.addDefault() }
        if (option?.remove) { colorMenu.addRemove() }
        return colorMenu;
    }
}