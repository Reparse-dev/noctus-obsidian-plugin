import { Facet } from "@codemirror/state";
import ExtendedMarkdownSyntax from "main";

export let pluginFacet = Facet.define<ExtendedMarkdownSyntax, ExtendedMarkdownSyntax>({
    combine(value) {
        return value[0];
    },
    static: true
});