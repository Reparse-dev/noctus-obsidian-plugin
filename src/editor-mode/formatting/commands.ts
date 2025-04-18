import { Command } from "obsidian";
import { EditorView } from "@codemirror/view";
import { Format } from "src/enums";
import { CtxMenuCommand } from "src/types";
import { instancesStore } from "src/editor-mode/cm-extensions";
import { TagMenu } from "src/editor-mode/ui-components";
import { Formatter } from "src/editor-mode/formatting/formatter";

function _getFormatter(view: EditorView): Formatter {
	return view.state.facet(instancesStore).formatter;
}

export const insertionCmd: CtxMenuCommand = {
	id: "toggle-insertion",
	name: "Toggle insertion",
	icon: "underline",
	ctxMenuTitle: "Insertion",
	editorCallback: (editor, ctx) => {
		let editorView = (editor.activeCm || editor.cm);
		if (editorView instanceof EditorView) {
			let formatter = _getFormatter(editorView);
			formatter.startFormat(editorView, Format.INSERTION);
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
			let formatter = _getFormatter(editorView);
			formatter.startFormat(editorView, Format.SPOILER);
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
			let formatter = _getFormatter(editorView);
			formatter.startFormat(editorView, Format.SUPERSCRIPT);
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
			let formatter = _getFormatter(editorView);
			formatter.startFormat(editorView, Format.SUBSCRIPT);
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
			let formatter = _getFormatter(editorView);
			formatter.startFormat(editorView, Format.HIGHLIGHT, undefined, false, true);
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
			let formatter = _getFormatter(editorView);
			formatter.startFormat(editorView, Format.CUSTOM_SPAN, undefined, false, true);
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
			let formatter = _getFormatter(editorView);
			formatter.startFormat(editorView, Format.FENCED_DIV, undefined, false, true);
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

export const ctxMenuCommands = [
	insertionCmd,
	spoilerCmd,
	superscriptCmd,
	subscriptCmd,
	customHighlightCmd,
	customSpanCmd
];

export const editorCommands = [
	fencedDivCmd,
	colorMenuCmd,
	spanTagMenuCmd,
	divTagMenuCmd
].concat(ctxMenuCommands);