import { SyntaxNode, Tree } from "@lezer/common";
import { SEMANTIC_INTERFERER_RE } from "src/editor-mode/parser/regexps";
import { findNode } from "src/editor-mode/parser/parser-utils";

export function hasInterferer(tree: Tree, from: number, to: number) {
    let matcher = (node: SyntaxNode) => {
        let match = SEMANTIC_INTERFERER_RE.exec(node.name);
        if (match) {
            if (
                (match[0] == "math-begin" || match[0] == "math-end") &&
                node.to - node.from < 2
            ) { return false }
            return true;
        }
        return false;
    };
    return !!findNode(tree, from, to, matcher);
}