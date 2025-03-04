import { WidgetType, EditorView, Decoration } from "@codemirror/view"
import { Menu } from "obsidian";
import { appFacet, settingsFacet } from "src/editor-mode/facets";
import { getActiveCanvasNodeCoords } from "src/editor-mode/utils";
import { PlainRange, Token } from "src/types";

/**
 * These code snippets are taken from 
 * https://github.com/Superschnizel/obisdian-fast-text-color/blob/master/src/widgets/ColorWidget.ts
 * with some modifications.
*/
export class ColorButton extends WidgetType {
    menu: Menu;
    tagRange: PlainRange;
    openRange: PlainRange;
    closeRange: PlainRange;
    constructor(token: Token) {
        super();
        this.openRange = { from: token.from, to: token.from + token.openLen };
        this.tagRange = { from: this.openRange.to, to: this.openRange.to + token.tagLen };
        this.closeRange = { from: token.to - token.closeLen, to: token.to };
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
    eq(other: ColorButton) {
        return (
            other.tagRange.from == this.tagRange.from &&
            other.tagRange.to == this.tagRange.to
        );
    }
    toDOM(view: EditorView): HTMLElement {
        let btn = document.createElement("span"),
            settings = view.state.facet(settingsFacet),
            colorConfigs = settings.colorConfigs;
        btn.setAttribute("aria-hidden", "true");
        btn.className = "cm-highlight-color-btn";
        btn.onclick = () => {
            view.dispatch({
                selection: {
                    anchor: this.tagRange.from,
                    head: this.tagRange.to
                }
            });
            this.menu = new Menu();
            this.menu.dom.addClass("highlight-colors-modal");
            colorConfigs.forEach(({ name, tag, showInMenu }) => {
                if (!showInMenu) { return }
                this.addItem(name, "palette", "menu-item-" + tag, () => { this.changeColor(view, tag) });
            });
            this.addItem("Accent", "palette", "menu-item-accent", () => { this.changeColor(view, "accent") });
            this.addItem("Default", "palette", "menu-item-default", () => { this.toDefault(view) });
            this.addItem("Remove", "eraser", "menu-item-remove-highlight", () => { this.removeColor(view) });
            this.showMenu(view);
        }
        return btn;
    }
    showMenu(view: EditorView) {
        let charPos = this.tagRange.from,
            menu = this.menu;
        view.requestMeasure({
            read(view) {
                let app = view.state.facet(appFacet.reader),
                    canvasNodeCoords = getActiveCanvasNodeCoords(app),
                    charCoords = view.coordsForChar(charPos);
                return { charCoords, canvasNodeCoords };
            },
            write(measure) {
                let { charCoords, canvasNodeCoords } = measure;
                if (charCoords) {
                    let menuCoords = { x: charCoords.left, y: charCoords.bottom };
                    if (canvasNodeCoords) {
                        menuCoords.x += canvasNodeCoords.x;
                        menuCoords.y += canvasNodeCoords.y;
                    }
                    menu.showAtPosition(menuCoords);
                }
            }
        });
    }
    adjustPos(differ: number) {
        this.tagRange.to += differ;
        this.closeRange.from += differ;
        this.closeRange.to += differ;
    }
    changeColor(view: EditorView, color: string) {
        view.dispatch({
            changes: {
                from: this.tagRange.from,
                to: this.tagRange.to,
                insert: `{${color}}`
            }
        });
        let differ = color.length + 2 - (this.tagRange.to - this.tagRange.from);
        this.adjustPos(differ);
    }
    removeColor(view: EditorView) {
        view.dispatch({
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
    toDefault(view: EditorView) {
        view.dispatch({
            changes: {
                from: this.tagRange.from,
                to: this.tagRange.to,
                insert: ""
            }
        });
        let tagLen = this.tagLen;
        this.adjustPos(-tagLen);
    }
    addItem(title: string, icon: string, cls: string, callback: (evt: MouseEvent | KeyboardEvent) => unknown) {
        this.menu.addItem(item => {
            item.setTitle(title);
            item.setIcon(icon);
            item.dom.addClass(cls);
            item.onClick(callback);
        });
    }
    ignoreEvent() {
        return false;
    }
    static of(hlToken: Token) {
        let btnOffset = hlToken.from + hlToken.openLen;
        return Decoration
            .widget({ widget: new ColorButton(hlToken), side: 1 })
            .range(btnOffset);
    }
}