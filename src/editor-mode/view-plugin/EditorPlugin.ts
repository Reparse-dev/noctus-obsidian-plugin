import { EditorView, PluginValue, ViewUpdate } from "@codemirror/view";
import { DecorationBuilder } from "src/editor-mode/decorator/builder";
import { builderField } from "src/editor-mode/state-fields";
import { pluginFacet } from "src/editor-mode/facets";
import ExtendedMarkdownSyntax from "main";
import { IndexCache } from "src/types";
import { Formatter } from "src/editor-mode/formatting";

export class EditorPlugin implements PluginValue {
    builder: DecorationBuilder;
    mainPlugin: ExtendedMarkdownSyntax;
    formatter: Formatter;
    root: DocumentOrShadowRoot;
    indexCache: Record<"colorMenuItem" | "spanTagMenuItem" | "divTagMenuItem", IndexCache> = {
        colorMenuItem: { number: 0 },
        spanTagMenuItem: { number: 0 },
        divTagMenuItem: { number: 0 }
    }
    constructor(view: EditorView) {
        let state = view.state;
        this.mainPlugin = state.facet(pluginFacet);
        this.root = view.root;
        this.builder = state.field(builderField);
        this.builder.onViewInit(view);
        this.formatter = new Formatter(view);
    }
    update(update: ViewUpdate) {
        if (this.root !== update.view.root) {
            this.onRootChanged(update.view.root);
        }
        this.builder.onViewUpdate(update);
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
}