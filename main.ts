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
import { appFacet } from "src/editor-mode/facets/appFacet";

export default class ExtendedMarkdownSyntax extends Plugin {
    settings: PluginSettings;
    areSettingsChanged: boolean = false;
    async onload() {
        await this.loadSettings();
        this.addSettingTab(new SettingTab(this.app, this));
        configureDelimLookup(this.settings);
        this.registerEditorExtension([
            appFacet.of(this.app),
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
        if (!this.areSettingsChanged) {
            this.areSettingsChanged = true;
            new Notice("You must restart the app to take the effect")
        }
        await this.saveData(this.settings);
    }
    onunload(): void {
        console.log("Unload Extended Markdown Syntax");
    }
}