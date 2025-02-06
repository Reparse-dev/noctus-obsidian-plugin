import { Facet } from "@codemirror/state";
import { App } from "obsidian";

export const appFacet = Facet.define<App, App>({
    combine(value) {
        return value[0];
    },
    static: true
});