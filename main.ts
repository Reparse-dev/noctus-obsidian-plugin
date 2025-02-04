import { Plugin } from "obsidian";
import { EditorView } from "@codemirror/view";
// import { drawSelection } from "@codemirror/view";
import { parserField } from "src/editor-mode/state-fields";
import { editorExtendedSyntax } from "src/editor-mode/extensions";
import { PreviewExtendedSyntax } from "src/preview-mode/post-processor";
import { PluginSettings } from "src/types";
import { DEFAULT_SETTINGS } from "src/settings";
import { SettingTab } from "src/settings/interface";
import { settingsFacet } from "src/editor-mode/facets";
import { configureDelimLookup } from "src/utils";

export default class ExtendedMarkdownSyntax extends Plugin {
    settings: PluginSettings;
    async onload() {
        await this.loadSettings();
        this.addSettingTab(new SettingTab(this.app, this));
        configureDelimLookup(this.settings);
        this.registerEditorExtension([
            settingsFacet.of(this.settings),
            parserField,
            editorExtendedSyntax,
            EditorView.outerDecorations.of(view => view.plugin(editorExtendedSyntax)!.outerDecoSet)
        ]);
        this.registerMarkdownPostProcessor(new PreviewExtendedSyntax(this.settings).postProcess);
        console.log("Load Extended Markdown Syntax");
    }
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
    async saveSettings() {
        await this.saveData(this.settings);
    }
    onunload(): void {
        console.log("Unload Extended Markdown Syntax");
    }
}