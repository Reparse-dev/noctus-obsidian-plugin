import ExtendedMarkdownSyntax from "main";
import { editorLivePreviewField } from "obsidian";
import { Annotation, EditorState, Extension, Facet, Prec, StateEffect, StateField, Transaction } from "@codemirror/state";
import { EditorView, PluginValue, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { ParseContext, syntaxTree } from "@codemirror/language";
import { Tree } from "@lezer/common";
import { IndexCache } from "src/types";
import { EditorParser } from "src/editor-mode/preprocessor/parser";
import { SelectionObserver } from "src/editor-mode/preprocessor/observer";
import { DecorationBuilder } from "src/editor-mode/decorator/builder";
import { Formatter } from "src/editor-mode/formatting/formatter";

type TagMenuOptionCaches = Record<"colorMenuItem" | "spanTagMenuItem" | "divTagMenuItem", IndexCache>;

interface BuiltinParserState {
	context: ParseContext,
	tree: Tree
}

interface RefreshDesc {
	deep?: boolean;
}

interface InternalInstances {
	mainPlugin: ExtendedMarkdownSyntax;
	parser: EditorParser;
	observer: SelectionObserver;
	builder: DecorationBuilder;
	formatter: Formatter;
	activities: ActivityRecord;
}

export interface ActivityRecord {
	isParsing?: boolean;
	isObserving?: boolean;
	isSelectionMoved?: boolean;
	isRefreshed?: boolean;
	isDeepRefreshed?: boolean;
	isModeChanged?: boolean;
}

function _isBuiltinParserStateEffect(effect: StateEffect<unknown>): effect is StateEffect<BuiltinParserState> {
	let effectVal = effect;
	return (
		"context" in effectVal && effectVal.context instanceof ParseContext &&
		"tree" in effectVal && effectVal.tree instanceof Tree
	);
}

function _isSelectionMoved(transaction: Transaction): boolean {
	return !(
		transaction.selection &&
		transaction.startState.selection.eq(transaction.selection)
	);
}

function _ensureMostUpdatedTree(transaction: Transaction): Tree {
	let currentTree = syntaxTree(transaction.state),
	mostUpdatedTree = transaction.effects.reduce(
		(tree: Tree, effect: StateEffect<unknown>) => {
			if (_isBuiltinParserStateEffect(effect)) {
					tree = effect.value.tree;
				}
				return tree;
			},
			currentTree
		);
	return mostUpdatedTree;
}

function _isEditorModeChanged(transaction: Transaction): boolean {
	let isLivePreviewCurrently = transaction.state.field(editorLivePreviewField),
		isLivePreviewPreviously = transaction.startState.field(editorLivePreviewField);
	return isLivePreviewCurrently != isLivePreviewPreviously;
}

class _EditorPlugin implements PluginValue {
	public readonly builder: DecorationBuilder;
	public readonly mainPlugin: ExtendedMarkdownSyntax;

	public root: DocumentOrShadowRoot;
	public activities: ActivityRecord;

	constructor(
		plugin: ExtendedMarkdownSyntax,
		view: EditorView,
		builder: DecorationBuilder,
		activities: ActivityRecord
	) {
		this.mainPlugin = plugin;
		this.root = view.root;
		this.builder = builder;
		this.activities = activities;
		this.builder.onViewInit(view);
	}

	public update(update: ViewUpdate) {
		if (this.root !== update.view.root) {
			this._onRootChanged(update.view.root);
		}
		this.builder.onViewUpdate(update, this.activities);
	}

	public destroy(): void {
		this.mainPlugin.tagManager.colorsHandler.eject(this.root);
		this.mainPlugin.opacityHandler.eject(this.root);
	}

	private _onRootChanged(newRoot: DocumentOrShadowRoot): void {
		this.mainPlugin.tagManager.colorsHandler.eject(this.root);
		this.mainPlugin.opacityHandler.eject(this.root);
		this.mainPlugin.tagManager.colorsHandler.inject(newRoot);
		this.mainPlugin.opacityHandler.inject(newRoot);
		this.root = newRoot;
	}
}

export const refreshCall = Annotation.define<RefreshDesc>();

export const instancesStore = Facet.define<ExtendedMarkdownSyntax, InternalInstances>({
	combine(value) {
		if (!value.length) return undefined as unknown as InternalInstances;
		let mainPlugin = value[0],
			parser = new EditorParser(mainPlugin.settings),
			observer = new SelectionObserver(parser),
			builder = new DecorationBuilder(parser, observer),
			formatter = new Formatter(parser, observer);
		return { mainPlugin, parser, observer, builder, formatter, activities: {} }
	},
	get static() {
		return true;
	}
});

export const tagMenuOptionCaches = Facet.define<TagMenuOptionCaches, TagMenuOptionCaches>({
	combine(value) {
		return value[0];
	},
	get static() {
		return true;
	}
});

export const editorSyntaxExtender = (plugin: ExtendedMarkdownSyntax): Extension => {
	let preprocessField = StateField.define({
		create(state: EditorState) {
			let { parser, observer, builder, activities } = state.facet(instancesStore);
			parser.initParse(state.doc, syntaxTree(state));
			observer.observe(state.selection, true);
			builder.onStateInit(state);
			return {
				parser, observer, builder, activities,
				lineBreaksSet: builder.holder.lineBreaksSet,
				blockOmittedSet: builder.holder.blockOmittedSet
			}
		},

		update(prevField, transaction: Transaction) {
			let newTree = _ensureMostUpdatedTree(transaction),
				oldTree = syntaxTree(transaction.startState),
				refreshDesc = transaction.annotation(refreshCall),
				{ parser, observer, builder, activities } = prevField;

			let isParsing = false,
				isObserving = false,
				isRefreshed = !!refreshDesc,
				isDeepRefreshed = !!refreshDesc?.deep,
				isModeChanged = _isEditorModeChanged(transaction);

			if (isDeepRefreshed) {
				parser.initParse(transaction.newDoc, newTree);
				isParsing = true;
			} else if (transaction.docChanged || oldTree.length != newTree.length) {
				parser.applyChange(transaction.newDoc, newTree, oldTree, transaction.changes);
				isParsing = true;
			}

			if (isDeepRefreshed || isModeChanged) {
				observer.restartObserver(transaction.newSelection, transaction.docChanged);
				isObserving = true;
			} else if (isParsing || _isSelectionMoved(transaction)) {
				observer.observe(transaction.newSelection, activities.isParsing ?? false);
				isObserving = true;
			}

			builder.onStateUpdate(transaction, { isParsing, isObserving, isDeepRefreshed, isModeChanged });

			activities.isParsing ||= isParsing;
			activities.isObserving ||= isObserving;
			activities.isRefreshed ||= isRefreshed;
			activities.isModeChanged ||= isModeChanged;

			if (
				prevField.lineBreaksSet === builder.holder.lineBreaksSet &&
				prevField.blockOmittedSet === builder.holder.blockOmittedSet
			) return prevField;

			return {
				parser, observer, builder, activities,
				lineBreaksSet: builder.holder.lineBreaksSet,
				blockOmittedSet: builder.holder.blockOmittedSet
			};
		},

		provide(field): Extension {
			return [
				EditorView.decorations.from(field, sets => sets.blockOmittedSet),
				Prec.lowest(EditorView.decorations.from(field, sets => sets.lineBreaksSet))
			]
		}
	});

	let viewPlugin = ViewPlugin.define(
		view => {
			let { builder, activities } = view.state.facet(instancesStore);
			return new _EditorPlugin(plugin, view, builder, activities);
		},
		{
			provide: () => {
				return [
					tagMenuOptionCaches.of({
						colorMenuItem: { number: 0 },
						spanTagMenuItem: { number: 0 },
						divTagMenuItem: { number: 0 },
					}),
					EditorView.decorations.of(view => view.state.facet(instancesStore).builder.holder.blockSet),
					EditorView.decorations.of(view => view.state.facet(instancesStore).builder.holder.inlineOmittedSet),
					EditorView.decorations.of(view => view.state.facet(instancesStore).builder.holder.colorBtnSet),
					EditorView.decorations.of(view => view.state.facet(instancesStore).builder.holder.revealedSpoilerSet),
					EditorView.outerDecorations.of(view => view.state.facet(instancesStore).builder.holder.inlineSet),
				];
			}
		}
	);

	return [instancesStore.of(plugin), preprocessField, viewPlugin];
}