import { Facet } from "@codemirror/state";
import { ActivityRecorder } from "src/editor-mode/observer";

export const activityFacet = Facet.define({
    combine() {
        return new ActivityRecorder();
    },
    static: true
});