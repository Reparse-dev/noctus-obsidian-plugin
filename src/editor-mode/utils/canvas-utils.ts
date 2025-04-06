import { App, MarkdownView } from "obsidian";

function _isCanvas(app: App) {
    return app.workspace.getMostRecentLeaf()?.view.getViewType() == "canvas";
}

function _getActiveCanvasEditor(app: App) {
    if (_isCanvas(app)) {
        return app.workspace.activeEditor;
    }
    return null;
}

export function getActiveCanvasNodeCoords(app: App) {
    let canvasEditor = _getActiveCanvasEditor(app),
        containerEl = (canvasEditor as MarkdownView)?.containerEl;
    if (containerEl) {
        return containerEl.getBoundingClientRect();
    }
    return null;
}