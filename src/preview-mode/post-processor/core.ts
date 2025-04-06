import { MarkdownPostProcessor } from "obsidian";
import { MarkdownViewMode, Format } from "src/enums";
import { PluginSettings } from "src/types";
import { InlineRules, BlockRules } from "src/format-configs/rules";
import { PreviewModeParser } from "src/preview-mode/post-processor/parser";
import { CUSTOM_SPAN_TAG_RE, COLOR_TAG_RE, FENCED_DIV_RE } from "src/preview-mode/post-processor/configs";

function _trimTag(tagStr: string): string {
	return tagStr
		.trim()
		.replaceAll(/\s{2,}/g, " ");
}

function _drawCustomSpan(settings: PluginSettings, el: HTMLElement): void {
	let baseCls = InlineRules[Format.CUSTOM_SPAN].class,
		customSpanElements = el.querySelectorAll<HTMLElement>("." + baseCls);

	customSpanElements.forEach((el) => {
		if (!(el.firstChild instanceof Text && el.firstChild.textContent)) return;
		let tag = CUSTOM_SPAN_TAG_RE.exec(el.firstChild.textContent)?.[1];
		if (tag) {
			let clsList = _trimTag(tag).split(" ");
			el.classList.add(...clsList);
			if (settings.showSpanTagInPreviewMode) { return }
			let from = 0, to = from + tag.length + 2;
			el.firstChild.replaceData(from, to - from, "");
		}
	});
}

function _drawCustomHighlight(settings: PluginSettings, el: HTMLElement): void {
	let markElements = el.querySelectorAll<HTMLElement>("mark"),
		baseCls = InlineRules[Format.HIGHLIGHT].class;

	markElements.forEach((el) => {
		if (!(el.firstChild instanceof Text && el.firstChild.textContent)) { return }
		let color = COLOR_TAG_RE.exec(el.firstChild.textContent)?.[1];
		if (color) {
			el.classList.add(baseCls, `${baseCls}-${color}`);
			if (settings.showHlTagInPreviewMode) { return }
			let from = 0, to = from + color.length + 2;
			el.firstChild.replaceData(from, to - from, "");
		}
	});
}

function _drawFencedDiv(settings: PluginSettings, el: HTMLElement): void {
	if (!(el.firstChild instanceof Text && el.firstChild.textContent)) return;

	FENCED_DIV_RE.lastIndex = 0;
	let baseCls = BlockRules[Format.FENCED_DIV].class,
		textNode = el.firstChild,
		lineBreakEl = el.querySelector("br"),
		match = FENCED_DIV_RE.exec(textNode.textContent ?? "");

	if (match) {
		let tag = match[1]!,
			clsList = _trimTag(tag).split(" ");
		el.addClass(baseCls, ...clsList);
		if (settings.alwaysShowFencedDivTag & MarkdownViewMode.PREVIEW_MODE) return;
		el.removeChild(textNode);
		if (lineBreakEl) { el.removeChild(lineBreakEl) }
	}
}

export class ReadingModeSyntaxExtender {
	private readonly _selectorQuery = "p, h1, h2, h3, h4, h5, h6, td, th, li:not(:has(p)), .callout-title-inner";
	private readonly _settings: PluginSettings;

	constructor(settings: PluginSettings) {
		this._settings = settings;
	}

	private _parseInline(targetEl: HTMLElement): void {
		let targetedEls = targetEl.querySelectorAll(this._selectorQuery),
			parsingQueue: PreviewModeParser[] = [];

		if (targetEl.classList.contains("table-cell-wrapper")) {
			new PreviewModeParser(targetEl, parsingQueue).streamParse();
			for (let i = 0; i < parsingQueue.length; i++) {
				parsingQueue[i].streamParse();
				if (i >= 100) { throw Error(`${parsingQueue}`) }
			}
			return;
		}

		for (let i = 0; i < targetedEls.length; i++) {
			new PreviewModeParser(targetedEls[i], parsingQueue).streamParse();
			for (let i = 0; i < parsingQueue.length; i++) {
				parsingQueue[i].streamParse();
				if (i >= 100) { throw Error(`${parsingQueue}`) }
			}
			parsingQueue.splice(0);
		}
	}

	private _isTargeted(container: HTMLElement): boolean {
		let firstChild = container.firstElementChild;
		if (
			container.classList.contains("table-cell-wrapper") ||
			firstChild && (
			firstChild instanceof HTMLParagraphElement ||
			firstChild instanceof HTMLTableElement ||
			firstChild instanceof HTMLUListElement ||
			firstChild instanceof HTMLOListElement ||
			firstChild.tagName == "BLOCKQUOTE" ||
			firstChild.classList.contains("callout")
		)) { return true }
		return false;
	}

	private _decorate(container: HTMLElement): void {
		if (this._settings.customHighlight & MarkdownViewMode.PREVIEW_MODE)
			_drawCustomHighlight(this._settings, container);

		if (
			this._settings.fencedDiv & MarkdownViewMode.PREVIEW_MODE &&
			container.firstElementChild instanceof HTMLParagraphElement
		) _drawFencedDiv(this._settings, container.firstElementChild);

		if (this._isTargeted(container)) this._parseInline(container);

		if (this._settings.customSpan & MarkdownViewMode.PREVIEW_MODE)
			_drawCustomSpan(this._settings, container);
	}

	public postProcess: MarkdownPostProcessor = (container) => {
		let isWholeDoc = container.classList.contains("markdown-preview-view");
		if (isWholeDoc) {
			if (!this._settings.decoratePDF) { return }
			let sectionEls = container.querySelectorAll<HTMLElement>("&>div");
			for (let i = 0; i < sectionEls.length; i++) {
				this._decorate(sectionEls[i]);
			}
		} else {
			this._decorate(container);
		}
	}
}