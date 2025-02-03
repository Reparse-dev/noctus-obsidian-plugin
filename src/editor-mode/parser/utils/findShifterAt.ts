import { SyntaxNode, Tree } from "@lezer/common";
import { NodeSpec } from "src/types";
import { SHIFTER_RE } from "src/editor-mode/parser/regexps";

export function findShifterAt(tree: Tree, offset: number): NodeSpec | null {
    let node: SyntaxNode | null = null,
        type: string | null = null;
    tree.iterate({
        from: offset, to: offset,
        enter(nodeRef) {
            if (nodeRef.name == "Document") { return }
            let match = SHIFTER_RE.exec(nodeRef.name);
            if (match) {
                node = nodeRef.node;
                type = match[0];
                return false;
            }
        },
    });
    if (node && type) {
        return { node, type }
    }
    return null;
}