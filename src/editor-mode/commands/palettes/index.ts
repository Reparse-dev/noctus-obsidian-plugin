import { EditorView } from "codemirror";
import { Format } from "src/enums";
import { CtxMenuCommand } from "src/types";
import { Command } from "obsidian";
import { editorPlugin } from "src/editor-mode/extensions";
import { TagMenu } from "src/editor-mode/ui-components";

export const insertionCmd: CtxMenuCommand = {
    id: "toggle-insertion",
    name: "Toggle insertion",
    icon: "underline",
    ctxMenuTitle: "Insertion",
    editorCallback: (editor, ctx) => {
        let editorView = (editor.activeCm || editor.cm);
        if (editorView instanceof EditorView) {
            let formatter = editorView.plugin(editorPlugin)!.formatter;
            formatter.startFormat(Format.INSERTION);
        }
    },
    type: Format.INSERTION
}

export const spoilerCmd: CtxMenuCommand = {
    id: "toggle-spoiler",
    name: "Toggle spoiler",
    icon: "rectangle-horizontal",
    ctxMenuTitle: "Spoiler",
    editorCallback: (editor, ctx) => {
        let editorView = (editor.activeCm || editor.cm);
        if (editorView instanceof EditorView) {
            let formatter = editorView.plugin(editorPlugin)!.formatter;
            formatter.startFormat(Format.SPOILER);
        }
    },
    type: Format.SPOILER
}

export const superscriptCmd: CtxMenuCommand = {
    id: "toggle-superscript",
    name: "Toggle superscript",
    icon: "superscript",
    ctxMenuTitle: "Superscript",
    editorCallback: (editor, ctx) => {
        let editorView = (editor.activeCm || editor.cm);
        if (editorView instanceof EditorView) {
            let formatter = editorView.plugin(editorPlugin)!.formatter;
            formatter.startFormat(Format.SUPERSCRIPT);
        }
    },
    type: Format.SUPERSCRIPT
}

export const subscriptCmd: CtxMenuCommand = {
    id: "toggle-subscript",
    name: "Toggle subscript",
    icon: "subscript",
    ctxMenuTitle: "Subscript",
    editorCallback: (editor, ctx) => {
        let editorView = (editor.activeCm || editor.cm);
        if (editorView instanceof EditorView) {
            let formatter = editorView.plugin(editorPlugin)!.formatter;
            formatter.startFormat(Format.SUBSCRIPT);
        }
    },
    type: Format.SUBSCRIPT
}

export const customHighlightCmd: CtxMenuCommand = {
    id: "toggle-custom-highlight",
    name: "Toggle custom highlight",
    icon: "highlighter",
    ctxMenuTitle: "Custom highlight",
    editorCallback: (editor, ctx) => {
        let editorView = (editor.activeCm || editor.cm);
        if (editorView instanceof EditorView) {
            let formatter = editorView.plugin(editorPlugin)!.formatter;
            formatter.startFormat(Format.HIGHLIGHT, undefined, false, true);
        }
    },
    type: Format.HIGHLIGHT
}

export const customSpanCmd: CtxMenuCommand = {
    id: "toggle-custom-span",
    name: "Toggle custom span",
    icon: "brush",
    ctxMenuTitle: "Custom span",
    editorCallback: (editor, ctx) => {
        let editorView = (editor.activeCm || editor.cm);
        if (editorView instanceof EditorView) {
            let formatter = editorView.plugin(editorPlugin)!.formatter;
            formatter.startFormat(Format.CUSTOM_SPAN, undefined, false, true);
        }
    },
    type: Format.CUSTOM_SPAN
}

export const fencedDivCmd: Command = {
    id: "toggle-fenced-div",
    name: "Toggle fenced div",
    icon: "list-plus",
    editorCallback: (editor, ctx) => {
        let editorView = (editor.activeCm || editor.cm);
        if (editorView instanceof EditorView) {
            let formatter = editorView.plugin(editorPlugin)!.formatter;
            formatter.startFormat(Format.FENCED_DIV, undefined, false, true);
        }
    },
}

export const colorMenuCmd: Command = {
    id: "show-color-menu",
    name: "Show highlight color menu",
    icon: "palette",
    editorCallback: (editor, ctx) => {
        let editorView = (editor.activeCm || editor.cm);
        if (editorView instanceof EditorView) {
            TagMenu.create(editorView, Format.HIGHLIGHT).showMenu();
        }
    }
}

export const spanTagMenuCmd: Command = {
    id: "show-custom-span-tag-menu",
    name: "Show custom span tag menu",
    icon: "shapes",
    editorCallback: (editor, ctx) => {
        let editorView = (editor.activeCm || editor.cm);
        if (editorView instanceof EditorView) {
            TagMenu.create(editorView, Format.CUSTOM_SPAN).showMenu();
        }
    }
}

export const divTagMenuCmd: Command = {
    id: "show-fenced-div-tag-menu",
    name: "Show fenced div tag menu",
    icon: "shapes",
    editorCallback: (editor, ctx) => {
        let editorView = (editor.activeCm || editor.cm);
        if (editorView instanceof EditorView) {
            TagMenu.create(editorView, Format.FENCED_DIV).showMenu();
        }
    }
}