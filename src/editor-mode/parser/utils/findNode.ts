import { SyntaxNode, Tree } from "@lezer/common";

export function findNode(tree: Tree, from: number, to: number, matcher: (node: SyntaxNode) => boolean): SyntaxNode | null {
    let node: SyntaxNode | null = null;
    tree.iterate({
        from, to, enter(nodeRef) {
            if (matcher(nodeRef.node)) {
                node = nodeRef.node;
                return false;
            }
        }
    });
    return node;
}