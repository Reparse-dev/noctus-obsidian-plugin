import { EditorView, PluginValue, ViewUpdate } from "@codemirror/view";
import { DecorationBuilder } from "src/editor-mode/decorator/builder";
import { builderField } from "src/editor-mode/state-fields";

export class BuilderPlugin implements PluginValue {
    builder: DecorationBuilder;
    constructor(view: EditorView) {
        let state = view.state;
        this.builder = state.field(builderField);
        this.builder.onViewInit(view);
    }
    update(update: ViewUpdate) {
        this.builder.onViewUpdate(update);
    }
}