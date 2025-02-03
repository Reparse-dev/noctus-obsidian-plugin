import { Decoration, WidgetType } from "@codemirror/view";

export class HiddenWidget extends WidgetType {
    replaced: Decoration;
    constructor(replaced: Decoration) {
        super();
        this.replaced = replaced;
    }
    eq(other: HiddenWidget) {
        return other.replaced == this.replaced;
    }
    toDOM(): HTMLElement {
        return document.createElement("span");
    }
    static of(from: number, to: number, replaced: Decoration) {
        return Decoration.replace({
            widget: new HiddenWidget(replaced)
        }).range(from, to);
    }
}