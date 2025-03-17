import { EditorState } from "@codemirror/state";
import { editorLivePreviewField } from "obsidian";

export function isEditorModeChanged(curState: EditorState, prevState: EditorState) {
    let isLivePreviewCurrently = curState.field(editorLivePreviewField),
        isLivePreviewPreviously = prevState.field(editorLivePreviewField);
    return isLivePreviewCurrently != isLivePreviewPreviously;
}