import { Direction, EditorView } from "@codemirror/view";
import { IconName, Menu } from "obsidian";
import { IndexCache, ITagMenu, PluginSettings, TagConfig } from "src/types";
import { appFacet, settingsFacet } from "src/editor-mode/facets";
import { getActiveCanvasNodeCoords } from "src/editor-mode/editor-utils";
import { editorPlugin } from "src/editor-mode/extensions";
import { Format } from "src/enums";
import { Formatter } from "src/editor-mode/formatting";
import { supportTag } from "src/format-configs/utils";

export class TagMenu extends Menu {
    itemIndexCache: IndexCache = { number: 0 };
    view: EditorView;
    type: Format;
    formatter: Formatter;
    settings: PluginSettings;
    CLS_PREFIX = "ems-menu-item";
    ICON: string;
    constructor(view: EditorView, type: Format) {
        super();
        this.constructMenu(view, type);
    }
    constructMenu(view: EditorView, type: Format) {
        this.view = view;
        this.type = type;
        this.formatter = view.plugin(editorPlugin)!.formatter;
        this.settings = view.state.facet(settingsFacet);
        this.bindIndexCache();
        this.setClassPrefix();
        this.setIcon();
        this.addConfigs(this.getConfigs());
        this.addDefaultItem();
        this.addRemoveItem();
        this.dom.addClass("ems-menu", "ems-tag-menu");
        if (type == Format.HIGHLIGHT) {
            this.dom.addClass("ems-color-menu");
        }
    }
    setClassPrefix() {
        if (this.type == Format.HIGHLIGHT) {
            this.CLS_PREFIX += " ems-highlight-";
        } else if (this.type == Format.CUSTOM_SPAN) {
            this.CLS_PREFIX += " ems-span-";
        } else if (this.type == Format.FENCED_DIV) {
            this.CLS_PREFIX += " ems-div-";
        }
    }
    setIcon() {
        if (this.type == Format.HIGHLIGHT) {
            this.ICON = "palette";
        } else {
            this.ICON = "shapes";
        }
    }
    bindIndexCache() {
        let { indexCache } = this.view.plugin(editorPlugin)!;
        switch (this.type) {
            case Format.HIGHLIGHT:
                this.itemIndexCache = indexCache.colorMenuItem;
                break;
            case Format.CUSTOM_SPAN:
                this.itemIndexCache = indexCache.spanTagMenuItem;
                break;
            case Format.FENCED_DIV:
                this.itemIndexCache = indexCache.divTagMenuItem;
                break;
            default:
                this.itemIndexCache = { number: 0 };
        }
    }
    getConfigs() {
        let configs: TagConfig[] = [];
        if (this.type == Format.HIGHLIGHT) {
            configs = this.settings.colorConfigs;
        } else if (this.type == Format.CUSTOM_SPAN) {
            configs = this.settings.predefinedSpanTag;
        } else if (this.type == Format.FENCED_DIV) {
            configs = this.settings.predefinedDivTag;
        }
        return configs;
    }
    addConfigs(configs: TagConfig[]) {
        configs.forEach(({ name, tag, showInMenu }) => {
            if (!showInMenu) { return }
            this.addConfigItem(name, this.ICON, this.CLS_PREFIX + tag, () => { this.format(tag) });
        });
        if (this.type == Format.HIGHLIGHT && this.settings.showAccentColor) {
            this.addConfigItem("Accent", this.ICON, this.CLS_PREFIX + "accent", () => { this.format("accent") });
        }
    }
    addConfigItem(name: string, icon: IconName, cls: string, callback: (evt: MouseEvent | KeyboardEvent) => unknown) {
        this.addItem(item => {
            item.setTitle(name);
            item.setIcon(icon);
            item.dom.addClass(...cls.split(" "));
            item.onClick(evt => {
                let index = this.items.findIndex(i => i == item);
                this.itemIndexCache.number = index;
                callback(evt);
            });
        });
    }
    addDefaultItem() {
        if (
            this.type == Format.HIGHLIGHT && this.settings.showDefaultColor ||
            this.type == Format.CUSTOM_SPAN && this.settings.showDefaultSpanTag
        ) {
            this.addConfigItem("Default", this.ICON, this.CLS_PREFIX + "default", () => { this.format("") });
        }
    }
    addRemoveItem() {
        if (
            this.type == Format.HIGHLIGHT && this.settings.showRemoveColor ||
            this.type == Format.CUSTOM_SPAN && this.settings.showRemoveSpanTag
        ) {
            this.addConfigItem("Remove", "eraser", "ems-menu-item ems-remove", () => { this.removeFormatting() });
        }
    }
    format(tag: string) {
        this.formatter.startFormat(this.type, tag);
    }
    removeFormatting() {
        this.formatter.startFormat(this.type, undefined, true);
    }
    showMenu() {
        this.checkItemIndexCache();
        this.view.requestMeasure({
            read: (view) => {
                let app = view.state.facet(appFacet.reader),
                    canvasNodeCoords = getActiveCanvasNodeCoords(app),
                    charOffset = view.state.selection.ranges.at(-1)!.to,
                    charCoords = view.coordsForChar(charOffset);
                if (!charCoords) {
                    let contentDOMCoords = view.contentDOM.getBoundingClientRect(),
                        firstBlock = view.lineBlockAt(charOffset),
                        isRTL = view.textDirection == Direction.RTL;
                    charCoords = {
                        top: contentDOMCoords.top,
                        bottom: contentDOMCoords.top + firstBlock.height,
                        left: isRTL ? contentDOMCoords.right : contentDOMCoords.left,
                        right: isRTL ? contentDOMCoords.left : contentDOMCoords.right
                    };
                }
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
    checkItemIndexCache() {
        if (this.itemIndexCache.number >= this.items.length) {
            this.itemIndexCache.number = this.items.length - 1;
        }
    }
    static bindMenu(other: Menu, ...args: ConstructorParameters<typeof TagMenu>) {
        let methodNames = ["addConfigItem", "addConfigs", "bindIndexCache", "checkItemIndexCache", "constructMenu", "format", "removeFormatting", "showMenu", "setClassPrefix", "setIcon", "addDefaultItem", "addRemoveItem", "getConfigs"] as const;
        for (let methodName of methodNames) {
            Object.defineProperty(other, methodName, {
                value: this.prototype[methodName].bind(other)
            });
        }
        Object.defineProperty(other, "CLS_PREFIX", {
            value: "ems-menu-item",
            configurable: true,
            writable: true
        });
        (other as ITagMenu).constructMenu(...args);
        return other as ITagMenu;
    }
    static create(...args: ConstructorParameters<typeof TagMenu>) {
        let [view, type] = args;
        if (!supportTag(type)) { throw new TypeError("This format type doesn't support custom tag.") }
        return new this(view, type);
    }
}