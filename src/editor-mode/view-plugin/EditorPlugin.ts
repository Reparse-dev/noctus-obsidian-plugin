import { EditorView, PluginValue, ViewUpdate } from "@codemirror/view";
import { DecorationBuilder } from "src/editor-mode/decorator/builder";
import { builderField } from "src/editor-mode/state-fields";
import { pluginFacet } from "src/editor-mode/facets";
import ExtendedMarkdownSyntax from "main";
import { menuInvokerAnnot } from "src/editor-mode/annotations";
import { IndexCache, TagMenuSpec } from "src/types";
import { ColorMenu } from "src/editor-mode/ui-components";
import { Format } from "src/enums";

export class EditorPlugin implements PluginValue {
    builder: DecorationBuilder;
    mainPlugin: ExtendedMarkdownSyntax;
    root: DocumentOrShadowRoot;
    indexCache: Record<"colorMenuItem", IndexCache> = {
        colorMenuItem: { number: 0 }
    }
    constructor(view: EditorView) {
        let state = view.state;
        this.mainPlugin = state.facet(pluginFacet);
        this.root = view.root;
        this.builder = state.field(builderField);
        this.builder.onViewInit(view);
    }
    update(update: ViewUpdate) {
        if (this.root !== update.view.root) {
            this.onRootChanged(update.view.root);
        }
        this.builder.onViewUpdate(update);
        let colorMenuSpec: undefined | TagMenuSpec;
        update.transactions.find(tr => colorMenuSpec = tr.annotation(menuInvokerAnnot));
        if (colorMenuSpec && colorMenuSpec.type == Format.HIGHLIGHT && !colorMenuSpec.accessed) {
            let showAtPos = update.state.selection.main.to;
            colorMenuSpec.accessed = true;
            this.invokeColorMenu(colorMenuSpec, update.view, showAtPos);
        }
    }
    destroy(): void {
        this.mainPlugin.colorsHandler.abandon(this.root);
        this.mainPlugin.opacityHandler.abandon(this.root);
    }
    onRootChanged(newRoot: DocumentOrShadowRoot) {
        this.mainPlugin.colorsHandler.abandon(this.root);
        this.mainPlugin.opacityHandler.abandon(this.root);
        this.mainPlugin.colorsHandler.adopt(newRoot);
        this.mainPlugin.opacityHandler.adopt(newRoot);
        this.root = newRoot;
    }
    invokeColorMenu(spec: TagMenuSpec, view: EditorView, showAtPos?: number) {
        let menu = ColorMenu.create(view, spec.openRange, spec.tagRange, spec.closeRange, spec.moveCursorAfterTag, this.indexCache.colorMenuItem);
        menu.showMenu(showAtPos);
    }
}