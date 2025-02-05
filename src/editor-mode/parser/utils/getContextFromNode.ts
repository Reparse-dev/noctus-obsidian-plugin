import { SyntaxNode } from "@lezer/common";
import { LineCtx } from "src/enums";

export function getContextFromNode(node: SyntaxNode) {
    let nodeName = node.name,
        context = LineCtx.NONE;
    if (node.name == "Document") { return context }
    if (!node.name.startsWith("HyperMD")) {
        if (node.parent!.name == "Document") { return context }
        node = node.parent!;
    }
    // 8 is the length of "HyperMD-" string
    if (nodeName.startsWith("hr", 8)) {
        context = LineCtx.HR_LINE;
    } else if (nodeName.startsWith("header", 8)) {
        context = LineCtx.HEADING;
    } else if (nodeName.startsWith("quote", 8)) {
        context = LineCtx.BLOCKQUOTE;
    } else if (nodeName.startsWith("codeblock", 8)) {
        context = LineCtx.CODEBLOCK;
    } else if (nodeName.startsWith("list", 8)) {
        if (nodeName.includes("nobullet")) {
            context = LineCtx.LIST;
        } else {
            context = LineCtx.LIST_HEAD;
        }
    } else if (nodeName.startsWith("footnote", 8)) {
        if (node.firstChild?.name.includes("footnote")) {
            context = LineCtx.FOOTNOTE_HEAD;
        } else {
            context = LineCtx.FOOTNOTE;
        }
    } else if (nodeName.startsWith("table", 8)) {
        if (nodeName.includes("table-row-1")) {
            context = LineCtx.TABLE_DELIM;
        } else {
            context = LineCtx.TABLE;
        }
    }
    return context;
}