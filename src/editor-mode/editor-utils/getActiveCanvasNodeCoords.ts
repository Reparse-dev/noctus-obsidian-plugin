import { App, MarkdownView } from "obsidian";
import { getActiveCanvasEditor } from "./getActiveCanvasEditor";

export function getActiveCanvasNodeCoords(app: App) {
    let canvasEditor = getActiveCanvasEditor(app),
        containerEl = (canvasEditor as MarkdownView)?.containerEl;
    if (containerEl) {
        return containerEl.getBoundingClientRect();
    }
    return null;
}