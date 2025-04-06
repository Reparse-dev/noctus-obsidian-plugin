import { Line, Text, TextLeaf, TextNode, ILine } from "@codemirror/state";
import { PlainRange } from "src/types";

// TODO: utilize TextCursor to all functions

type LineAddress = { parent: TextNode | TextLeaf, index: number }[];

function _isTextLeaf(doc: Text): doc is TextLeaf {
	return "text" in doc && doc.text instanceof Array;
}

function _isTextNode(doc: Text): doc is TextNode {
	return doc.children !== null;
}

export class TextCursor {
	public address: LineAddress;
	public curLine: ILine;

	private constructor() {}

	public get doc(): Text {
		return this.address[0].parent;
	}

	public next(): boolean {
		for (let i = this.address.length - 1; i >= 0; i--) {
			let { parent, index } = this.address[i],
				branches = _isTextLeaf(parent) ? parent.text : parent.children;
			if (index + 1 < branches.length) {
				this.address[i].index++;
				while (i < this.address.length) {
					let { parent, index } = this.address[i++];
					if (_isTextLeaf(parent)) {
						let length = parent.text[index].length,
							from = this.curLine.to + 1;
						this.curLine = {
							number: this.curLine.number + 1,
							text: parent.text[index],
							from,
							to: from + length,
							length
						};
					} else {
						this.address[i].parent = parent.children[index] as TextNode | TextLeaf;
						this.address[i].index = 0;
					}
				}
				return true;
			}
		}
		return false;
	}

	public prev(): boolean {
		for (let i = this.address.length - 1; i >= 0; i--) {
			if (this.address[i].index > 0) {
				this.address[i].index--;
				while (i < this.address.length) {
					let { parent, index } = this.address[i++];
					if (_isTextLeaf(parent)) {
						let length = parent.text[index].length,
							to = this.curLine.from - 1;
						this.curLine = {
							number: this.curLine.number - 1,
							text: parent.text[index],
							from: to - length,
							to,
							length
						};
					} else {
						let prevBranch = parent.children[index] as TextNode | TextLeaf;
						this.address[i].parent = prevBranch;
						this.address[i].index = (_isTextLeaf(prevBranch) ? prevBranch.text : prevBranch.children).length - 1;
					}
				}
				return true;
			}
		}
		return false;
	}

	public goto(offset: number): TextCursor {
		if (offset < this.curLine.from) while (offset < this.curLine.from && this.prev());
		else if (offset > this.curLine.to) while (offset > this.curLine.to && this.next());
		return this;
	}

	public gotoLine(linePos: number): TextCursor {
		if (linePos < this.curLine.number) while (this.curLine.number != linePos && this.prev());
		else if (linePos > this.curLine.number) while (this.curLine.number != linePos && this.next());
		return this;
	}

	public gotoLast(): TextCursor {
		this.address.forEach((branchAddress, i) => {
			let { parent } = branchAddress,
				branches = _isTextLeaf(parent) ? parent.text : parent.children;
			branchAddress.index = branches.length - 1;
			if (i + 1 < this.address.length) {
				this.address[i + 1].parent = branches[branchAddress.index] as TextLeaf | TextNode;
			} else {
				let to = this.doc.length,
					lineNum = this.doc.lines,
					lineStr = branches[branchAddress.index] as string;
				this.curLine = {
					from: to - lineStr.length,
					to,
					number: lineNum,
					length: lineStr.length,
					text: lineStr
				};
			}
		});
		return this;
	}

	public getPrevLine(): ILine | null {
		if (this.curLine.number <= 1 || !this.prev()) return null;
		let prevLine = this.curLine;
		this.next();
		return prevLine;
	}

	public getNextLine(): ILine | null {
		if (this.curLine.number >= this.doc.lines || !this.next()) return null;
		let nextLine = this.curLine;
		this.prev();
		return nextLine;
	}

	public static atOffset(doc: Text, offset: number): TextCursor {
		let { address, line: curLine } = getLineAddressAt(doc, offset),
			cursor = new TextCursor();
		cursor.address = address;
		cursor.curLine = curLine;
		return cursor;
	}
}

export function getNextLine(doc: Text, offsetOrLine: number | Line): Line | null {
	let line = offsetOrLine instanceof Line ? offsetOrLine : doc.lineAt(offsetOrLine);
	if (line.number >= doc.lines) { return null }
	return doc.line(line.number + 1);
}

export function getBlockEndAt(doc: Text, offsetOrLine: number | Line, blankLineAsEnd = true): Line {
	let line = offsetOrLine instanceof Line ? offsetOrLine : doc.lineAt(offsetOrLine);
	while (line.number < doc.lines) {
		line = doc.line(line.number + 1);
		if (isBlankLine(line)) {
			if (!blankLineAsEnd) { line = doc.line(line.number - 1) }
			break;
		}
	}
	return line;
}

export function getBlocks(doc: Text, range: PlainRange, lookBehind = false, lookAhead = false): { start: number, end: number }[] {
	let blocks: { start: number, end: number }[] = [],
		line = doc.lineAt(range.from),
		initLine = line,
		curBlock: { start: number, end: number } | undefined;
	if (!isBlankLine(line) && lookBehind) {
		let blockStart = getBlockStartAt(doc, line);
		curBlock = { start: blockStart.number, end: line.number + 1 };
		blocks.push(curBlock);
	}
	for (; range.to >= line.from; line = doc.line(line.number + 1)) {
		if (isBlankLine(line)) { curBlock = undefined }
		else if (curBlock) { curBlock.end++ }
		else {
			curBlock = { start: line.number, end: line.number + 1 };
			blocks.push(curBlock);
		}
		if (line.number >= doc.lines) { break }
	}
	if (curBlock && lookAhead) {
		curBlock.end = getBlockEndAt(doc, line, false).number + 1;
	}
	if (!blocks.length) {
		blocks.push({ start: initLine.number, end: initLine.number + 1 });
	}
	return blocks;
}

export function getBlockStartAt(doc: Text, offsetOrLine: number | Line): Line {
	let curLine = offsetOrLine instanceof Line ? offsetOrLine : doc.lineAt(offsetOrLine),
		prevLine = curLine.number > 1 ? doc.line(curLine.number - 1) : null;
	if (isBlankLine(curLine)) { return curLine }
	while (prevLine) {
		if (isBlankLine(prevLine)) { break }
		curLine = prevLine;
		prevLine = curLine.number > 1 ? doc.line(curLine.number - 1) : null;
	}
	return curLine;
}

export function getPrevLine(doc: Text, offsetOrLineNum: number | Line): Line | null {
	let lineNum: number;
	if (offsetOrLineNum instanceof Line) {
		lineNum = offsetOrLineNum.number;
	} else {
		lineNum = doc.lineAt(offsetOrLineNum).number;
	}
	if (lineNum <= 1) { return null }
	return doc.line(lineNum - 1);
}

export function isBlankLine(line: Line): boolean {
	return !line.text.trimEnd();
}

export function isBlockEnd(doc: Text, line: Line): boolean {
	let nextLine = getNextLine(doc, line);
	return !nextLine || isBlankLine(nextLine);
}

export function isBlockStart(doc: Text, line: Line): boolean {
	let prevLine = getPrevLine(doc, line);
	return !prevLine || isBlankLine(prevLine);
}

export function sliceStrFromLine(line: Line, from: number, to: number): string {
	from -= line.from;
	to -= line.from;
	return line.text.slice(from, to);
}

export function getLineAddressAt(doc: Text, offset: number): { address: LineAddress, line: ILine } {
	let parent = doc,
		address: LineAddress = [],
		lineNum = 0,
		lineStr = "",
		passedLen = 0;

	if (offset < 0 || offset > parent.length) throw RangeError();

	while (_isTextNode(parent)) {
		let branches = parent.children;
		for (let i = 0; i < branches.length; i++) {
			let curBranch = branches[i];
			if (offset >= passedLen && offset <= passedLen + curBranch.length) {
				address.push({ parent, index: i });
				parent = curBranch;
				break;
			}
			passedLen += curBranch.length + 1;
			lineNum += curBranch.lines;
		}
	}

	if (!_isTextLeaf(parent)) throw TypeError();

	for (let i = 0; i < parent.text.length; i++) {
		let curLineStr = parent.text[i];
		lineNum++;
		if (offset >= passedLen && offset <= passedLen + curLineStr.length) {
			address.push({ parent, index: i });
			lineStr = curLineStr;
			break;
		}
		passedLen += curLineStr.length + 1;
	}

	let line: ILine = {
		number: lineNum,
		text: lineStr,
		from: passedLen,
		to: passedLen + lineStr.length,
		length: lineStr.length
	}
	return { address, line };
}