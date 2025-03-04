import { Setting } from "obsidian";

export function insertButton(setting: Setting, text: string, cta: boolean, onClick: (evt: MouseEvent) => unknown) {
    setting.addButton(btn => {
        btn.setButtonText(text);
        btn.onClick(onClick);
        if (cta) { btn.setCta() }
    });
    return setting;
}