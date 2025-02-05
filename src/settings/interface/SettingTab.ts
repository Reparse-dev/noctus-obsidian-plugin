import * as Plugin from 'main'
import { App, PluginSettingTab, Setting } from 'obsidian';
import { SettingOpt1 } from 'src/enums';

const DROPDOWN_OPTIONS_1: Record<SettingOpt1, string> = {
    [SettingOpt1.DISABLED]: "Disable all",
    [SettingOpt1.EDITOR_MODE]: "Editor only",
    [SettingOpt1.PREVIEW_MODE]: "Preview only",
    [SettingOpt1.ALL]: "Enable all"
};

export class SettingTab extends PluginSettingTab {
    plugin: Plugin.default;
    constructor(app: App, plugin: Plugin.default) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display(): void {
        let { containerEl } = this,
            { settings } = this.plugin;
        this.plugin.areSettingsChanged = false;
        containerEl.empty();
        new Setting(containerEl)
            .setName("Insertion (underline)")
            .setDesc("Use double plus (\"++\") as a delimiter.")
            .addDropdown((dropdown) => {
                dropdown.addOptions(DROPDOWN_OPTIONS_1);
                dropdown.setValue(settings.insertion.toString());
                dropdown.onChange((val) => { settings.insertion = parseInt(val); this.plugin.saveSettings() });
            });
        new Setting(containerEl)
            .setName("Discord flavoured spoiler")
            .setDesc("Use double bars (\"||\") as a delimiter.")
            .addDropdown((dropdown) => {
                dropdown.addOptions(DROPDOWN_OPTIONS_1);
                dropdown.setValue(settings.spoiler.toString());
                dropdown.onChange((val) => { settings.spoiler = parseInt(val); this.plugin.saveSettings() });
            });
        new Setting(containerEl)
            .setName("Pandoc-style superscript")
            .setDesc("Use single caret (\"^\") as a delimiter.")
            .addDropdown((dropdown) => {
                dropdown.addOptions(DROPDOWN_OPTIONS_1);
                dropdown.setValue(settings.superscript.toString());
                dropdown.onChange((val) => { settings.superscript = parseInt(val); this.plugin.saveSettings() });
            });
        new Setting(containerEl)
            .setName("Pandoc-style subscript")
            .setDesc("Use single tilde (\"~\") as a delimiter.")
            .addDropdown((dropdown) => {
                dropdown.addOptions(DROPDOWN_OPTIONS_1);
                dropdown.setValue(settings.subscript.toString());
                dropdown.onChange((val) => { settings.subscript = parseInt(val); this.plugin.saveSettings() });
            });
        new Setting(containerEl)
            .setName("Custom highlight color")
            .setDesc("Type at least one, and only, alphanumeric character (\"A-Za-z0-9-_\") after highlight opening covered by curly brackets (\"{}\").")
            .addDropdown((dropdown) => {
                dropdown.addOptions(DROPDOWN_OPTIONS_1);
                dropdown.setValue(settings.customHighlight.toString());
                dropdown.onChange((val) => { settings.customHighlight = parseInt(val); this.plugin.saveSettings() });
            });
        new Setting(containerEl)
            .setName("Paragraph alignment")
            .setDesc("Type \"left\", \"right\", \"center\", or \"justify\", covered by two exclamation marks (\"!!\"), and place it in the beginning of line.")
            .addDropdown((dropdown) => {
                dropdown.addOptions(DROPDOWN_OPTIONS_1);
                dropdown.setValue(settings.customAlign.toString());
                dropdown.onChange((val) => { settings.customAlign = parseInt(val); this.plugin.saveSettings() });
            });
        new Setting(containerEl)
            .setName("Escape delimiter")
            .setDesc("Use backslash as a delimiter escaper. Works only in editor.")
            .addToggle((toggle) => {
                toggle.setValue(settings.editorEscape);
                toggle.onChange((val) => { settings.editorEscape = val; this.plugin.saveSettings() });
            });
        new Setting(containerEl)
            .setName("Highlight color button")
            .setDesc("Display button after highlight opening delimiter, used to open a color menu for quick customizing by clicking on it.")
            .addToggle((toggle) => {
                toggle.setValue(settings.colorButton);
                toggle.onChange((val) => { settings.colorButton = val; this.plugin.saveSettings() });
            });
    }
}