import { WidgetType, EditorView, Decoration } from "@codemirror/view"
import { Menu } from "obsidian";
import { TagMenu } from "src/editor-mode/ui-components";
import { Format } from "src/enums";
import { Token } from "src/types";

/**
 * These code snippets are taken from 
 * https://github.com/Superschnizel/obisdian-fast-text-color/blob/master/src/widgets/ColorWidget.ts
 * with some modifications.
 */
export class ColorButton extends WidgetType {
    menu: Menu;
    btnPos: number;
    colorMenu: TagMenu;
    constructor(token: Token) {
        super();
        this.btnPos = token.from + token.openLen;
    }
    eq(other: ColorButton) {
        return this.btnPos == other.btnPos;
    }
    toDOM(view: EditorView): HTMLElement {
        let btn = document.createElement("span");
        btn.setAttribute("aria-hidden", "true");
        btn.className = "cm-highlight-color-btn";
        btn.onclick = () => {
            view.dispatch({
                selection: { anchor: this.btnPos }
            });
            this.colorMenu ||= TagMenu.create(view, Format.HIGHLIGHT);
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