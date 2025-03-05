import * as Plugin from 'main'
import { App, IconName, PluginSettingTab, Setting } from 'obsidian';
import { Field, MarkdownViewMode, DisplayBehaviour } from 'src/enums';
import { retrieveSettingUIConfigs } from 'src/settings/configs';
import { ColorConfig, DropdownFieldDesc, MultiToggleFieldDesc, PluginSettings, SettingGroup, SettingItem, SettingRoot, SliderFieldDesc, ToggleFieldDesc } from 'src/types';
import { collapseElsBelow, insertButton } from 'src/settings/interface/utils';
import { createCSSRuleFromColorConfig } from 'src/color-management';
import { moveElement } from 'src/utils';

export class ExtendedSettingTab extends PluginSettingTab {
    plugin: Plugin.default;
    colorSettingItems: Setting[] = [];
    refreshInternal = false;
    rebuildColorStyleRules = false;
    isHidden = true;
    constructor(app: App, plugin: Plugin.default) {
        super(app, plugin);
        this.plugin = plugin;
    }
    saveSettings(spec?: { internal?: boolean, colors?: boolean }) {
        this.plugin.saveSettings();
        if (spec?.internal) {
            this.refreshInternal = true;
        }
        if (spec?.colors) {
            this.rebuildColorStyleRules = true;
        }
    }
    display(): void {
        let { containerEl } = this,
            { settings } = this.plugin;
        containerEl.empty();
        let settingsUIConfig = retrieveSettingUIConfigs(settings);
        this.drawFromConfig(settingsUIConfig, containerEl);
        this.isHidden = false;
    }
    hide(): void {
        if (this.refreshInternal) {
            this.plugin.refreshMarkdownView();
        }
        if (this.rebuildColorStyleRules) {
            this.plugin.rebuildColorsStyleSheet();
        }
        this.refreshInternal = this.rebuildColorStyleRules = false;
        this.colorSettingItems.splice(0);
        this.isHidden = true;
        super.hide();
    }
    removeSetting(setting: Setting) {
        setting.clear();
        setting.settingEl.remove();
    }
    drawFromConfig(config: SettingRoot<PluginSettings>, containerEl: HTMLElement) {
        for (let group of config) {
            if (group.heading) { this.drawHeading(group, containerEl) }
            for (let item of group.items) {
                this.drawSettingItem(item, containerEl, group.collapsible);
                if (item.preservedForColorSettings) { this.drawColorSettings(containerEl, group.collapsible) }
            }
        }
    }
    drawHeading(group: SettingGroup<PluginSettings>, containerEl: HTMLElement) {
        if (!group.heading) { return }
        let heading = new Setting(containerEl)
            .setHeading()
            .setName(group.heading);
        if (group.desc) {
            heading.setDesc(group.desc);
        }
        if (group.collapsible) {
            heading.addExtraButton(btn => {
                let btnEl = btn.extraSettingsEl;
                btn
                    .setIcon("chevron-down")
                    .setTooltip("Collapse", { placement: "bottom" })
                    .onClick(() => {
                        let btnEl = btn.extraSettingsEl;
                        collapseElsBelow(heading.settingEl);
                        if (btnEl.hasClass("collapsing")) {
                            btn.setTooltip("Collapse", { placement: "bottom" });
                            btnEl.removeClass("collapsing");
                        } else {
                            btn.setTooltip("Expand", { placement: "bottom" });
                            btnEl.addClass("collapsing");
                        }
                    });
                btnEl.addClass("collapse-button", "ems-button");
            });
            heading.controlEl.addClass("collapse-control");
        }
    }
    drawSettingItem(item: SettingItem<PluginSettings>, containerEl: HTMLElement, collapsible?: boolean) {
        let setting = new Setting(containerEl).setName(item.name);
        if (item.desc) {
            setting.setDesc(item.desc);
        }
        if (collapsible) {
            setting.setClass("is-collapsible")
        }
        if (item.fields) {
            for (let field of item.fields) {
                if (field.type == Field.TOGGLE) { this.setToggleField(field, setting) }
                else if (field.type == Field.DROPDOWN) { this.setDropdownField(field, setting) }
                else if (field.type == Field.MULTI_TOGGLE) { this.setMultiToggleField(field, setting) }
                else if (field.type == Field.SLIDER) { this.setSliderField(field, setting) }
            }
        }
    }
    drawColorSettings(containerEl: HTMLElement, collapsible?: boolean) {
        let colorConfigs = this.plugin.settings.colorConfigs,
            groupEl = containerEl.createDiv({ cls: ["setting-item", "setting-group", "ems-setting-group"] });
        if (collapsible) { groupEl.addClass("is-collapsible") }
        colorConfigs.forEach(config => {
            this.setColorItem(config, colorConfigs, groupEl);
        });
        let controlSetting = new Setting(containerEl);
        insertButton(controlSetting, "Add color", false, () => {
            this.plugin.addNewColor();
            let newSetting = this.setColorItem(colorConfigs.at(-1)!, colorConfigs, groupEl);
            newSetting.controlEl.querySelector<HTMLElement>(".ems-field-tag")?.focus();
            this.saveSettings({ internal: false, colors: false });
        });
        insertButton(controlSetting, "Reset to default", true, () => {
            this.colorSettingItems.forEach(setting => {
                this.removeSetting(setting);
            });
            this.colorSettingItems.splice(0);
            this.plugin.revertColorConfigs((config, configs) => {
                this.setColorItem(config, configs, groupEl);
            });
            this.saveSettings({ internal: false, colors: true });
        });
        if (collapsible) {
            controlSetting.setClass("is-collapsible");
        }
        this.makeDragable(groupEl, evt => {
            let oldIndex = evt.oldDraggableIndex,
                newIndex = evt.newDraggableIndex,
                colorConfigs = this.plugin.settings.colorConfigs;
            if (this.isHidden || oldIndex === undefined || newIndex === undefined || oldIndex == newIndex) { return }
            colorConfigs.splice(
                Math.min(oldIndex, newIndex),
                0,
                ...colorConfigs.splice(Math.max(oldIndex, newIndex), 1)
            );
            this.plugin.colorsHandler.moveRule(oldIndex, newIndex);
        });
    }
    setColorItem(config: ColorConfig, configs: ColorConfig[], containerEl: HTMLElement) {
        if (/[^a-z0-9-]/i.test(config.tag)) { config.tag = config.tag.replaceAll(/[^a-z0-9-]/ig, "") }
        let colorSetting = new Setting(containerEl)
            .setClass("ems-setting-item")
            .setClass("ems-highlight-color-config")
            .addExtraButton(btn => {
                btn.extraSettingsEl.addClasses(["ems-button", "ems-button-drag-handle"]);
                btn.setIcon("grip-vertical");
                btn.setTooltip("Hold and drag to move", { placement: "left" });
            })
            .addText(text => {
                text.setPlaceholder("Color name");
                text.setValue(config.name);
                text.inputEl.addClasses(["ems-field", "ems-field-name"]);
                text.onChange(name => {
                    config.name = name;
                    this.saveSettings({ internal: false, colors: false });
                });
            })
            .addExtraButton(btn => {
                let btnEl = btn.extraSettingsEl;
                btnEl.addClasses(["ems-button", "ems-button-delete"]);
                btn.setIcon("trash");
                btn.setTooltip("Delete");
                btn.onClick(() => {
                    let index = configs.findIndex(target => target == config);
                    configs.splice(index, 1);
                    this.colorSettingItems.splice(index, 1);
                    this.plugin.colorsHandler.removeSingle(index);
                    this.removeSetting(colorSetting);
                    this.saveSettings({ internal: false, colors: true });
                });
            })
            .addExtraButton(btn => {
                btn.extraSettingsEl.addClasses(["ems-button", "ems-button-shift-up"]);
                btn.setIcon("arrow-up");
                btn.setTooltip("Shift up");
                btn.onClick(() => {
                    let index = configs.findIndex(target => target == config);
                    if (index) {
                        moveElement(colorSetting.settingEl, -1)
                        configs.splice(index - 1, 0, configs.splice(index, 1)[0]);
                        this.plugin.colorsHandler.moveSingleRule(index, -1);
                        this.saveSettings({ internal: false, colors: true });
                    }
                });
            })
            .addExtraButton(btn => {
                btn.extraSettingsEl.addClasses(["ems-button", "ems-button-shift-down"]);
                btn.setIcon("arrow-down");
                btn.setTooltip("Shift down");
                btn.onClick(() => {
                    let index = configArr.findIndex(target => target == config);
                    if (index < configArr.length - 1) {
                        moveElement(colorSetting.settingEl, 1)
                        configArr.splice(index, 0, configArr.splice(index + 1, 1)[0]);
                        this.plugin.colorsHandler.moveSingleRule(index, 1);
                        this.saveSettings({ internal: false, colors: true });
                    }
                });
            })
            .addExtraButton(btn => {
                btn.extraSettingsEl.addClasses(["ems-button", "ems-button-toggle-show-hide"]);
                btn.setIcon(config.showInMenu ? "eye" : "eye-off");
                btn.setTooltip("Show/hide menu item");
                btn.onClick(() => {
                    config.showInMenu = !config.showInMenu;
                    btn.setIcon(config.showInMenu ? "eye" : "eye-off");
                    this.saveSettings({ internal: false, colors: false })
                });
            })
            .addText(text => {
                text.setPlaceholder("Tag string");
                text.inputEl.addClasses(["ems-field", "ems-field-tag"]);
                text.setValue(config.tag);
                text.onChange(tag => {
                    config.tag = tag.replaceAll(/[^a-z0-9-]/gi, "");
                    text.setValue(config.tag);
                    let index = configs.findIndex(target => target == config),
                        ruleStr = createCSSRuleFromColorConfig(config);
                    this.plugin.colorsHandler.replace(ruleStr, index);
                    this.saveSettings({ internal: false, colors: true });
                });
            })
            .addColorPicker(picker => {
                picker.setValue(config.color);
                picker.colorPickerEl.addClasses(["ems-field", "ems-field-color-picker"]);
                picker.onChange(color => {
                    config.color = color;
                    let index = configs.findIndex(target => target == config),
                        ruleStr = createCSSRuleFromColorConfig(config);
                    this.plugin.colorsHandler.replace(ruleStr, index);
                    this.saveSettings({ internal: false, colors: true });
                });
            });
        this.colorSettingItems.push(colorSetting);
        return colorSetting;
    }
    setToggleField(field: ToggleFieldDesc<PluginSettings>, setting: Setting) {
        setting.addToggle(toggle => {
            let { record, key } = field;
            toggle.setValue(record[key]);
            toggle.onChange(val => {
                record[key] = val;
                this.saveSettings(field.update);
                if (field.callback) {
                    field.callback(toggle, this.plugin);
                }
            });
        });
    }
    setDropdownField(field: DropdownFieldDesc<PluginSettings>, setting: Setting) {
        setting.addDropdown(dropdown => {
            let { record, key } = field;
            dropdown.addOptions(field.spec.options);
            dropdown.setValue(record[key].toString());
            dropdown.onChange(val => {
                (record[key] as MarkdownViewMode | DisplayBehaviour) = parseInt(val);
                this.saveSettings(field.update);
                if (field.callback) {
                    field.callback(dropdown, this.plugin);
                }
            });
        });
    }
    setMultiToggleField(field: MultiToggleFieldDesc<PluginSettings>, setting: Setting) {
        let { record, key } = field,
            value = record[key],
            options = field.spec.options as Record<typeof value, { icon: IconName, tooltip?: string }>,
            optionMap: string[] = (() => {
                let optionMap = [];
                for (let opt in options) { optionMap.push(opt) };
                return optionMap;
            })(),
            index = optionMap.findIndex(val => val === value.toString());
        setting.addExtraButton(btn => {
            let { icon, tooltip } = options[value];
            btn.setIcon(icon);
            btn.setTooltip(tooltip ?? "");
            btn.onClick(() => {
                if (index + 1 >= optionMap.length) { index = 0 }
                else { index++ }
                let changedVal = parseInt(optionMap[index]) as typeof value,
                    { icon, tooltip } = options[changedVal];
                btn.setIcon(icon);
                btn.setTooltip(tooltip ?? "");
                (record[key] as MarkdownViewMode | DisplayBehaviour) = changedVal;
                this.saveSettings(field.update);
                if (field.callback) {
                    field.callback(btn, this.plugin);
                }
            });
        });
    }
    setSliderField(field: SliderFieldDesc<PluginSettings>, setting: Setting) {
        setting.addSlider(slider => {
            let { record, key, spec } = field;
            slider.setInstant(false);
            slider.setDynamicTooltip();
            slider.setLimits(spec.min, spec.max, spec.step);
            slider.setValue(record[key]);
            slider.onChange(val => {
                (record[key] as number) = val;
                this.saveSettings(field.update);
                if (field.callback) {
                    field.callback(slider, this.plugin);
                }
            });
        });
    }
    makeDragable(groupEl: HTMLElement, onEnd: (evt: SortableEvent) => unknown) {
        Sortable.create(groupEl, {
            handle: ".ems-button-drag-handle",
            animation: 200,
            easing: "cubic-bezier(0.2, 0, 0, 1)",
            forceFallback: true,
            fallbackOnBody: true,
            fallbackClass: "ems-setting-item-dragged",
            fallbackTolerance: 4,
            onEnd: onEnd,
        });
    }
}