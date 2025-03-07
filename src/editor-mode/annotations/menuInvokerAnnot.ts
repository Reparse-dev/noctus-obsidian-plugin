import { Annotation } from "@codemirror/state";
import { TagMenuSpec } from "src/types";

export let menuInvokerAnnot = Annotation.define<TagMenuSpec>();