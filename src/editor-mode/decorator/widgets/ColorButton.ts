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
	colorTag: CharPos;
	open: CharPos;
	close: CharPos;
    constructor(color: string, open: CharPos, close: CharPos) {
        super();
        this.color = color;
		this.colorTag = color ?
			{ from: open.to, to: open.to + color.length + 2 } :
			{ from: open.to, to: open.to };
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
					item.setTitle(color[1]);
					item.setIcon("palette");
					item.dom.addClass(`menu-item-${color[0] || "default"}`);
					item.onClick(() => { this.changeColor(view, color[0]) });
				});
			});
			this.menu.addItem(item => {
				item.setTitle("Remove");
				item.setIcon("eraser");
				item.dom.addClass("menu-item-remove-highlight");
				item.onClick(() => {
					view.dispatch({
						changes: [{
							from: this.open.from,
							to: this.colorTag.to,
							insert: ""
						}, {
							from: this.close.from,
							to: this.close.to,
							insert: ""
						}]
					});
				});
			});
			let app = view.state.facet(appFacet.reader),
				menuCoord = { x: evt.clientX, y: evt.clientY + 10 };
			if (app.workspace.getMostRecentLeaf()?.view.getViewType() == "canvas") {
				let containerEl = (app.workspace.activeEditor as MarkdownView)?.containerEl;
				if (containerEl) {
					let containerCoord = containerEl.getBoundingClientRect();
					menuCoord.x += containerCoord.x;
					menuCoord.y += containerCoord.y;
				}
			}
			this.menu.showAtPosition(menuCoord);
		}
        return btn;
    }
	adjustPos(length: number) {
		this.colorTag.to += length;
		this.close.from += length;
		this.close.to += length;
	}
	changeColor(view: EditorView, color: string) {
		view.dispatch({
			changes: {
				from: this.colorTag.from,
				to: this.colorTag.to,
				insert: color != "default" ? `{${color}}` : ""
			}
		});
		let differ = color == "default" ?
			this.colorTag.from - this.colorTag.to :
			color.length + 2 - (this.colorTag.to - this.colorTag.from);
		this.adjustPos(differ);
	}
    ignoreEvent() {
        return false;
    }
	static of(color: string, open: CharPos, close: CharPos) {
		return Decoration.widget({ widget: new ColorButton(color, open, close) }).range(open.to);
	}
}