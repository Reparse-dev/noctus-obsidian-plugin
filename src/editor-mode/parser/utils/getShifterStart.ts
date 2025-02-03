import { SyntaxNode } from "@lezer/common";
import { NodeSpec } from "src/types";
import { ShifterNodeConfigs } from "src/editor-mode/parser/configs";

export function getShifterStart(spec: NodeSpec) {
    let node: SyntaxNode | null = spec.node,
        type = spec.type;
    if (node = ShifterNodeConfigs[type]?.getOpen(node)) {
        return node.from;
    }
    return null;
}