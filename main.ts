import { Plugin } from "obsidian";
import { EditorView } from "@codemirror/view";
// import { drawSelection } from "@codemirror/view";
import { parserField } from "src/editor-mode/state-fields";
import { editorExtendedSyntax } from "src/editor-mode/extensions";
import { PreviewExtendedSyntax } from "src/preview-mode/post-processor";

export default class ExtendedMarkdownSyntax extends Plugin {
    async onload() {
        await this.loadData();
        this.registerEditorExtension([
            // state fields
            parserField,
            // view plugins
            editorExtendedSyntax,
            // facet
            EditorView.outerDecorations.of(view => view.plugin(editorExtendedSyntax)!.outerDecoSet)
        ]);
        this.registerMarkdownPostProcessor(new PreviewExtendedSyntax().postProcess);
        console.log("Load Extended Markdown Syntax");
    }
    onunload(): void {
        console.log("Unload Extended Markdown Syntax");
    }
}