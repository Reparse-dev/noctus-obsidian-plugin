import { App } from "obsidian";
import { isCanvas } from "src/editor-mode/utils";

export function getActiveCanvasEditor(app: App) {
    if (isCanvas(app)) {
        return app.workspace.activeEditor;
    }
    return null;
}