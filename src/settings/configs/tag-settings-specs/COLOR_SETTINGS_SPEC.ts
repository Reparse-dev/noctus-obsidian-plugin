import { convertColorConfigToCSSRule } from "src/color-management";
import { Format } from "src/enums";
import { ColorConfig, TagSettingsSpec } from "src/types";

export const COLOR_SETTINGS_SPEC: TagSettingsSpec = {
    type: Format.HIGHLIGHT,
    addBtnPlaceholder: "Add color",
    nameFieldPlaceholder: "Color name",
    tagFieldPlaceholder: "Tag string",
    tagFilter: /[^a-z0-9-]/gi,
    onAdd: (settingTab, settingItem, config: ColorConfig) => {
        settingItem.addColorPicker(picker => {
            let plugin = settingTab.plugin,
                configs = plugin.settings.colorConfigs;
            picker.setValue(config.color);
            picker.colorPickerEl.addClasses(["ems-field", "ems-field-color-picker"]);
            picker.onChange(color => {
                config.color = color;
                let index = configs.findIndex(target => target == config),
                    ruleStr = convertColorConfigToCSSRule(config);
                plugin.colorsHandler.replace(ruleStr, index);
                settingTab.saveSettings({ colors: true });
            });
        });
    },
    onMove: (settingTab, oldIndex, newIndex) => {
        settingTab.plugin.colorsHandler.moveRule(oldIndex, newIndex);
    },
    onResetted: (settingTab) => {
        settingTab.saveSettings({ colors: true });
    },
    onDelete: (settingTab, index) => {
        settingTab.plugin.colorsHandler.removeSingle(index);
    },
    onTagChange: (settingTab, config: ColorConfig, index) => {
        let ruleStr = convertColorConfigToCSSRule(config);
        settingTab.plugin.colorsHandler.replace(ruleStr, index);
    }
}