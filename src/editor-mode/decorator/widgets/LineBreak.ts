import { Decoration, WidgetType } from "@codemirror/view";

export class LineBreak extends WidgetType {
    offset: number;
    constructor(offset: number) {
        super();
        this.offset = offset;
    }
    eq(other: LineBreak) {
        return other.offset === this.offset;
    }
    toDOM(): HTMLElement {
        return document.createElement("br");
    }
    static of(offset: number) {
        return Decoration.replace({
            widget: new LineBreak(offset),
        }).range(offset - 1, offset);
    }
}