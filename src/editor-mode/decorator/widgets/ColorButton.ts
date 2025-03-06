import { WidgetType, EditorView, Decoration } from "@codemirror/view"
import { Menu } from "obsidian";
import { ColorMenu } from "src/editor-mode/ui-components";
import { PlainRange, Token } from "src/types";

/**
 * These code snippets are taken from 
 * https://github.com/Superschnizel/obisdian-fast-text-color/blob/master/src/widgets/ColorWidget.ts
 * with some modifications.
*/
export class ColorButton extends WidgetType {
    menu: Menu;
    colorMenu: ColorMenu;
    tagRange: PlainRange;
    openRange: PlainRange;
    closeRange: PlainRange;
    constructor(token: Token) {
        super();
        this.openRange = { from: token.from, to: token.from + token.openLen };
        this.tagRange = { from: this.openRange.to, to: this.openRange.to + token.tagLen };
        this.closeRange = { from: token.to - token.closeLen, to: token.to };
    }
    eq(other: ColorButton) {
        return (
            other.tagRange.from == this.tagRange.from &&
            other.tagRange.to == this.tagRange.to
        );
    }
    toDOM(view: EditorView): HTMLElement {
        let btn = document.createElement("span");
        btn.setAttribute("aria-hidden", "true");
        btn.className = "cm-highlight-color-btn";
        btn.onclick = () => {
            view.dispatch({
                selection: {
                    anchor: this.tagRange.from,
                    head: this.tagRange.to
                }
            });
            this.colorMenu = ColorMenu.create(view, this.openRange, this.tagRange, this.closeRange);
            this.colorMenu.showMenu();
        }
        return btn;
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