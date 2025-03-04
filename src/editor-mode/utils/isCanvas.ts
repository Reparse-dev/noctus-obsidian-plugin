import { App } from "obsidian";

export function isCanvas(app: App) {
    return app.workspace.getMostRecentLeaf()?.view.getViewType() == "canvas";
}