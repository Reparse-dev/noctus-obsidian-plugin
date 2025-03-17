import * as Plugin from 'main'
import Sortable, { SortableEvent } from 'sortablejs';
import { App, IconName, PluginSettingTab, Setting } from 'obsidian';
import { Field, MarkdownViewMode, DisplayBehaviour, Format } from 'src/enums';
import { COLOR_SETTINGS_SPEC, DIV_TAG_SETTINGS_SPEC, SPAN_TAG_SETTINGS_SPEC, getTagConfigs, retrieveSettingUIConfigs } from 'src/settings/configs';
import { DropdownFieldDesc, MultiToggleFieldDesc, PluginSettings, SettingGroup, SettingItem, SettingRoot, SliderFieldDesc, TagConfig, TagSettingsSpec, ToggleFieldDesc } from 'src/types';
import { collapseElsBelow, insertButton } from 'src/settings/interface/utils';

export class ExtendedSettingTab extends PluginSettingTab {
    plugin: Plugin.default;
    tagSettingItems: Record<Format.HIGHLIGHT | Format.CUSTOM_SPAN | Format.FENCED_DIV, Setting[]> = {
        [Format.HIGHLIGHT]: [],
        [Format.CUSTOM_SPAN]: [],
        [Format.FENCED_DIV]: []
    };
    collapsedGroups: Record<string, boolean> = {
        "syntax-switch": true,
        "formatting": true,
        "tag-display": true,
        "custom-highlight": true,
        "custom-span": true,
        "fenced-div": true,
        "others": true
    };
    rebuildColorStyleRules = false;
    refreshInternal = false;
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
        this.emptyTagSettingItems();
        this.isHidden = true;
        super.hide();
    }
    emptyTagSettingItems() {
        for (let type of [Format.HIGHLIGHT, Format.CUSTOM_SPAN, Format.FENCED_DIV] as (keyof typeof this.tagSettingItems)[]) {
            this.tagSettingItems[type].splice(0);
        }
    }
    removeSetting(setting: Setting) {
        setting.clear();
        setting.settingEl.remove();
    }
    drawFromConfig(config: SettingRoot<PluginSettings>, containerEl: HTMLElement) {
        for (let group of config) {
            let isCollapsing = this.collapsedGroups[group.id];
            if (group.heading) { this.drawHeading(group, containerEl) }
            for (let item of group.items) {
                this.drawSettingItem(item, containerEl, group.collapsible, isCollapsing);
                if (item.preservedForTagSettings == Format.HIGHLIGHT) {
                    this.drawTagSettings(containerEl, COLOR_SETTINGS_SPEC, group.collapsible, isCollapsing);
                } else if (item.preservedForTagSettings == Format.CUSTOM_SPAN) {
                    this.drawTagSettings(containerEl, SPAN_TAG_SETTINGS_SPEC, group.collapsible, isCollapsing);
                } else if (item.preservedForTagSettings == Format.FENCED_DIV) {
                    this.drawTagSettings(containerEl, DIV_TAG_SETTINGS_SPEC, group.collapsible, isCollapsing);
                }
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
                    .onClick(() => {
                        let btnEl = btn.extraSettingsEl;
                        collapseElsBelow(heading.settingEl);
                        if (btnEl.hasClass("collapsing")) {
                            btn.setTooltip("Collapse", { placement: "bottom" });
                            btnEl.removeClass("collapsing");
                            delete this.collapsedGroups[group.id];
                        } else {
                            btn.setTooltip("Expand", { placement: "bottom" });
                            btnEl.addClass("collapsing");
                            this.collapsedGroups[group.id] = true;
                        }
                    });
                btnEl.addClass("collapse-button", "ems-button");
                if (this.collapsedGroups[group.id]) {
                    btnEl.addClass("collapsing");
                    btn.setTooltip("Expand", { placement: "bottom" });
                } else {
                    btn.setTooltip("Collapse", { placement: "bottom" });
                }
            });
            heading.controlEl.addClass("collapse-control");
        }
    }
    drawSettingItem(item: SettingItem<PluginSettings>, containerEl: HTMLElement, collapsible?: boolean, isCollapsing?: boolean) {
        let setting = new Setting(containerEl).setName(item.name);
        if (item.desc) {
            setting.setDesc(item.desc);
        }
        if (collapsible) {
            setting.setClass("is-collapsible");
            if (isCollapsing) {
                setting.setClass("collapsed");
            }
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
    drawTagSettings(containerEl: HTMLElement, spec: TagSettingsSpec, collapsible?: boolean, isCollapsing?: boolean) {
        let configs = getTagConfigs(this.plugin.settings, spec.type),
            groupEl = containerEl.createDiv({ cls: ["setting-item", "setting-group", "ems-setting-group"] });
        configs.forEach(config => {
            this.setTagItem(spec, config, configs, groupEl);
        });
        let controlSetting = new Setting(containerEl);
        insertButton(controlSetting, spec.addBtnPlaceholder, false, () => {
            this.plugin.addTagConfig(spec.type);
            let newSetting = this.setTagItem(spec, configs.at(-1)!, configs, groupEl);
            newSetting.controlEl.querySelector<HTMLElement>(".ems-field-tag")?.focus();
            this.saveSettings();
        });
        insertButton(controlSetting, "Reset to default", true, () => {
            this.tagSettingItems[spec.type].forEach(setting => {
                this.removeSetting(setting);
            });
            this.tagSettingItems[spec.type].splice(0);
            this.plugin.revertTagConfigs(spec.type, (config, configs) => {
                this.setTagItem(spec, config, configs, groupEl);
            });
            this.saveSettings();
            spec.onResetted?.(this);
        });
        if (collapsible) {
            controlSetting.setClass("is-collapsible");
            groupEl.addClass("is-collapsible");
            if (isCollapsing) {
                controlSetting.setClass("collapsed");
                groupEl.addClass("collapsed");
            }
        }
        this.makeDragable(groupEl, evt => {
            let oldIndex = evt.oldDraggableIndex,
                newIndex = evt.newDraggableIndex;
            if (this.isHidden || oldIndex === undefined || newIndex === undefined || oldIndex == newIndex) { return }
            configs.splice(
                Math.min(oldIndex, newIndex),
                0,
                ...configs.splice(Math.max(oldIndex, newIndex), 1)
            );
            spec.onMove?.(this, oldIndex, newIndex);
        });
    }
    setTagItem(spec: TagSettingsSpec, config: TagConfig, configs: TagConfig[], groupEl: HTMLElement) {
        config.tag = config.tag.replaceAll(spec.tagFilter, "");
        let tagSetting = new Setting(groupEl)
            .setClass("ems-setting-item")
            .setClass("ems-tag-config")
            .addExtraButton(btn => {
                btn.extraSettingsEl.addClasses(["ems-button", "ems-button-drag-handle"]);
                btn.setIcon("grip-vertical");
                btn.setTooltip("Hold and drag to move", { placement: "left" });
            })
            .addText(text => {
                text.setPlaceholder(spec.nameFieldPlaceholder);
                text.setValue(config.name);
                text.inputEl.addClasses(["ems-field", "ems-field-name"]);
                text.onChange(name => {
                    config.name = name;
                    this.saveSettings();
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
                    this.tagSettingItems[spec.type].splice(index, 1);
                    this.removeSetting(tagSetting);
                    this.saveSettings();
                    spec.onDelete?.(this, index);
                });
            })
            .addExtraButton(btn => {
                btn.extraSettingsEl.addClasses(["ems-button", "ems-button-toggle-show-hide"]);
                btn.setIcon(config.showInMenu ? "eye" : "eye-off");
                btn.setTooltip("Show/hide menu item");
                btn.onClick(() => {
                    config.showInMenu = !config.showInMenu;
                    btn.setIcon(config.showInMenu ? "eye" : "eye-off");
                    this.saveSettings();
                });
            })
            .addText(text => {
                text.setPlaceholder(spec.tagFieldPlaceholder);
                text.inputEl.addClasses(["ems-field", "ems-field-tag"]);
                text.setValue(config.tag);
                text.onChange(tag => {
                    let index = configs.findIndex(target => target == config);
                    config.tag = tag.replaceAll(spec.tagFilter, "");
                    text.setValue(config.tag);
                    this.saveSettings();
                    spec.onTagChange?.(this, config, index);
                });
            });
        spec.onAdd?.(this, tagSetting, config);
        return tagSetting;
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
            animation: 100,
            easing: "cubic-bezier(0.2, 0, 0, 1)",
            forceFallback: true,
            fallbackOnBody: true,
            fallbackClass: "ems-setting-item-dragged",
            fallbackTolerance: 4,
            onEnd: onEnd,
        });
    }
}