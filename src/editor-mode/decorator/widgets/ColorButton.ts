import { WidgetType, EditorView, Decoration } from "@codemirror/view"
import { Menu } from "obsidian";

const PredefinedColors = ["red", "orange", "yellow", "green", "cyan", "blue", "purple", "pink", "accent", "default"];

/**
 * These code snippets are taken from 
 * https://github.com/Superschnizel/obisdian-fast-text-color/blob/master/src/widgets/ColorWidget.ts
 * with some modifications.
*/
export class ColorButton extends WidgetType {
	color: string;
    menu: Menu;
	menuPos: { x: number, y: number };
	colorTag: { from: number, to: number };
    constructor(offset: number, color: string) {
        super();
        this.color = color;
		this.colorTag = color ?
			{ from: offset, to: offset + color.length + 2 } :
			{ from: offset, to: offset };
    }
    eq(other: ColorButton) {
        return (
			other.colorTag.from == this.colorTag.from &&
			other.colorTag.to == this.colorTag.to
		);
    }
    toDOM(view: EditorView): HTMLElement {
        let btn = document.createElement("span");
        btn.setAttribute("aria-hidden", "true");
        btn.className = "cm-highlight-color-btn";
        btn.onclick = evt => {
			view.dispatch({
				selection: {
					anchor: this.colorTag.from,
					head: this.colorTag.to
				}
			});
			this.menu = new Menu();
            this.menu.dom.addClass("highlight-colors-modal");
			PREDEFINED_COLORS.forEach((color) => {
				this.menu.addItem((item) => {
					item
						.setTitle(color)
						.onClick(evt => {
							view.dispatch({
								changes: {
									from: this.colorTag.from,
									to: this.colorTag.to,
									insert: color != "default" ? `{${color}}` : ""
								}
							});
							if (color == "default") {
								this.color = "";
								this.colorTag.to = this.colorTag.from;
							} else {
								this.color = color;
								this.colorTag.to = this.colorTag.from + color.length + 2;
							}
						})
						.setIcon("palette")
						.dom.addClass(`cm-item-${color || "default"}`);
				})
			});
			/* this.menu.addItem(item => {
				item
					.setTitle("Remove")
					.setIcon("ban")
					.onClick((evt) => {
						view.dispatch({
							changes: [{
								from: this.colorTag.from,
								to: this.colorTag.to,
								insert: ''
							}]
						});
						this.colorTag.from = this.colorTag.to = 0;
					});
			}); */
			this.showMenu(view, btn);
		}
        return btn;
    }
	showMenu(view: EditorView, btn: HTMLElement) {
		let menu = this.menu;
		view.requestMeasure({
			read(view) {
				let rect = btn.getBoundingClientRect();
				return { x: rect.left, y: rect.bottom }
			},
			write(measure, view) {
				menu.showAtPosition(measure);
			},
		});
	}
    ignoreEvent() {
        return false;
    }
	static of(offset: number, color: string) {
		return Decoration.widget({ widget: new ColorButton(offset, color) }).range(offset);
	}
}