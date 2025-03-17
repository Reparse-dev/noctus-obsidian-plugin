import { EditorView } from "@codemirror/view";
import { Editor, MarkdownFileInfo, MarkdownView, Menu, Platform } from "obsidian";
import { selectionObserverField } from "src/editor-mode/state-fields";
import { Format, TokenLevel, TokenStatus } from "src/enums";
import { InlineFormat } from "src/types";
import { ctxMenuCommands } from "src/editor-mode/commands";
import { TagMenu } from "src/editor-mode/ui-components";

export function extendEditorCtxMenu(menu: Menu, editor: Editor, ctx: MarkdownFileInfo | MarkdownView) {
    menu.addItem(item => {
        let subMenu = item.setSubmenu(),
            cmView = editor.activeCm || editor.cm,
            activeFormats: Partial<Record<InlineFormat, boolean>> = {},
            commands = ctxMenuCommands;
        subMenu.onload = function () {
            if (Platform.isMobile) { return }
            subMenu.registerDomEvent(subMenu.dom, "mouseover", () => {
                if (subMenu.currentSubmenu && subMenu.currentSubmenu !== subMenu.items[subMenu.selected]?.submenu) {
                    subMenu.closeSubmenu();
                    // @ts-ignore
                    subMenu.openSubmenuSoon(subMenu.items[subMenu.selected]);
                }
            });
        };
        if (!(cmView instanceof EditorView)) {
            throw ReferenceError("EditorView not found");
        }
        let selectionObserver = cmView.state.field(selectionObserverField);
        selectionObserver.iterateSelectedRegion(TokenLevel.INLINE, true, (token , index, tokens, pos) => {
            let type = token.type as InlineFormat;
            if (token.status != TokenStatus.ACTIVE || activeFormats[type]) { return }
            if (pos == "covered" || pos == "covering") {
                activeFormats[type] = true;
            }
        });
        subMenu.addSections(["selection-extended-inline", "selection-extended-block"]);
        item.setTitle("More format...");
        item.setIcon("paintbrush-vertical");
        item.setSection("selection");
        for (let i = 0; i < commands.length; i++) {
            subMenu.addItem(item => {
                let type = commands[i].type as InlineFormat;
                item.setTitle(commands[i].ctxMenuTitle);
                item.setIcon(commands[i].icon);
                item.setSection("selection-extended-inline");
                if (activeFormats[type]) {
                    item.setChecked(true);
                }
                if (type == Format.HIGHLIGHT || type == Format.CUSTOM_SPAN) {
                    let tagSubMenu = item.setSubmenu();
                    TagMenu.bindMenu(tagSubMenu, cmView, type);
                }
                item.onClick(() => {
                    commands[i].editorCallback(editor, ctx);
                    menu.close();
                });
            });
        }
    });
}