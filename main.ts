import { MarkdownView, Plugin, Command } from "obsidian";
// import { drawSelection } from "@codemirror/view";
import { PreviewExtendedSyntax } from "src/preview-mode/post-processor";
import { ColorConfig, PluginSettings, TagConfig } from "src/types";
import { DEFAULT_SETTINGS } from "src/settings";
import { ExtendedSettingTab } from "src/settings/interface";
import { pluginFacet, settingsFacet } from "src/editor-mode/facets";
import { deepCopy } from "src/utils";
import { configureDelimLookup, reconfigureDelimLookup, supportTag } from "src/format-configs/utils"
import { appFacet } from "src/editor-mode/facets";
import { editorExtendedSyntax } from "src/editor-mode/extensions";
import { refresherAnnot } from "src/editor-mode/annotations";
import { StyleSheetHandler } from "src/stylesheet-handler";
import { createColorConfig, convertColorConfigToCSSRule, getDefaultColorConfigs } from "src/color-management";
import { Format, Theme } from "src/enums";
import { editorCommands } from "src/editor-mode/commands";
import { extendEditorCtxMenu } from "src/editor-mode/ui-components/utils";
import { getTagConfigs } from "src/settings/configs";

export default class ExtendedMarkdownSyntax extends Plugin {
    settings: PluginSettings;
    colorsHandler: StyleSheetHandler;
    opacityHandler: StyleSheetHandler;
    async onload() {
        await this.loadSettings();
        this.addSettingTab(new ExtendedSettingTab(this.app, this));
        configureDelimLookup(this.settings);
        this.registerEditorExtension([
            appFacet.of(this.app),
            pluginFacet.of(this),
            settingsFacet.of(this.settings),
            editorExtendedSyntax
        ]);
        this.registerMarkdownPostProcessor(new PreviewExtendedSyntax(this.settings).postProcess);
        this.colorsHandler = new StyleSheetHandler(this);
        this.opacityHandler = new StyleSheetHandler(this);
        this.buildColorsStyleSheet();
        this.opacityHandler.insert(`body.theme-light{--hl-opacity:${this.settings.lightModeHlOpacity}}`);
        this.opacityHandler.insert(`body.theme-dark{--hl-opacity:${this.settings.darkModeHlOpacity}}`);
        this.registerCommands(editorCommands);
        this.extendEditorCtxMenu();
        console.log("Load Extended Markdown Syntax");
    }
    async loadSettings() {
        this.settings = Object.assign({}, deepCopy(DEFAULT_SETTINGS), await this.loadData());
    }
    async saveSettings() {
        await this.saveData(this.settings);
    }
    onunload(): void {
        this.colorsHandler.destroy();
        this.opacityHandler.destroy();
        console.log("Unload Extended Markdown Syntax");
    }
    reconfigureDelimLookup() {
        reconfigureDelimLookup(this.settings);
    }
    /** Get the settings change effect without reload the whole app. */
    refreshMarkdownView() {
        this.app.workspace.iterateAllLeaves(leaf => {
            let view = leaf.view;
            if (view instanceof MarkdownView) {
                let cmView = view.editor.cm;
                cmView.dispatch({
                    annotations: refresherAnnot.of(true),
                });
                view.previewMode.rerender(true);
            }
        });
    }
    buildColorsStyleSheet(callback?: (colorConfig: ColorConfig, colorConfigs: ColorConfig[]) => unknown) {
        let colorConfigs = this.settings.colorConfigs;
        for (let i = 0; i < colorConfigs.length; i++) {
            let ruleStr = convertColorConfigToCSSRule(colorConfigs[i]);
            this.colorsHandler.insert(ruleStr);
            if (callback) { callback(colorConfigs[i], colorConfigs) }
        }
    }
    setHlOpacity(value: number, theme: Theme) {
        let selector = theme == Theme.LIGHT
                ? "body.theme-light"
                : "body.theme-dark",
            property = "--hl-opacity",
            // The index of light mode opacity is 0, and dark mode opacity is 1.
            ruleIndex = theme;
        this.opacityHandler.replace(`${selector}{${property}:${value}}`, ruleIndex);
    }
    rebuildColorsStyleSheet(callback?: (colorConfig: ColorConfig, colorConfigs: ColorConfig[]) => unknown) {
        this.colorsHandler.removeAll();
        this.buildColorsStyleSheet(callback);
    }
    addNewColor() {
        let index = this.settings.colorConfigs.length,
            newConfig = createColorConfig("color-" + index, "#ffd000", "Color " + index),
            ruleStr = convertColorConfigToCSSRule(newConfig);
        this.settings.colorConfigs.push(newConfig);
        this.colorsHandler.insert(ruleStr, index);
    }
    addTagConfig(type: Format) {
        if (!supportTag(type)) { return }
        if (type == Format.HIGHLIGHT) { this.addNewColor() }
        else {
            let configs = getTagConfigs(this.settings, type),
                index = configs.length;
            configs.push({
                name: "Tag " + index,
                tag: "tag-" + index,
                showInMenu: true
            });
        }
    }
    revertColorConfigs(callback?: (colorConfig: ColorConfig, colorConfigs: ColorConfig[]) => unknown) {
        let configs = this.settings.colorConfigs;
        configs.splice(0, configs.length, ...getDefaultColorConfigs());
        this.rebuildColorsStyleSheet(callback);
    }
    revertTagConfigs(type: Format, callback?: (config: TagConfig, configs: TagConfig[]) => unknown) {
        if (!supportTag(type)) { return }
        if (type == Format.HIGHLIGHT) {
            this.revertColorConfigs(callback);
        } else {
            let configs = getTagConfigs(this.settings, type);
            configs.splice(0);
        }
    }
    registerCommands(commands: Command[]) {
        commands.forEach(cmd => this.addCommand(cmd));
    }
    extendEditorCtxMenu() {
        this.registerEvent(this.app.workspace.on("editor-menu", (menu, editor, ctx) => {
            extendEditorCtxMenu(menu, editor, ctx);
        }));
    }
}