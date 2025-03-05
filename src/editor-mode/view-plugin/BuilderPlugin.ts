import { EditorView, PluginValue, ViewUpdate } from "@codemirror/view";
import { DecorationBuilder } from "src/editor-mode/decorator/builder";
import { builderField } from "src/editor-mode/state-fields";
import { pluginFacet } from "src/editor-mode/facets";
import ExtendedMarkdownSyntax from "main";

export class BuilderPlugin implements PluginValue {
    builder: DecorationBuilder;
    mainPlugin: ExtendedMarkdownSyntax;
    root: DocumentOrShadowRoot;
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