import { Decoration, WidgetType } from "@codemirror/view";
import { Token } from "src/types";

export class HiddenWidget extends WidgetType {
    token: Token;
    constructor(replaced: Token) {
        super();
        this.token = replaced;
    }
    eq(other: HiddenWidget) {
        return other.token == this.token;
    }
    toDOM(): HTMLElement {
        return document.createElement("span");
    }
    static of(from: number, to: number, token: Token, isBlock = false) {
        return Decoration.replace({
            widget: new HiddenWidget(token),
            block: isBlock,
            inclusiveEnd: false
        }).range(from, to);
    }
}