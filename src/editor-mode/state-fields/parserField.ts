import { StateEffect, StateField } from "@codemirror/state";
import { Parser } from "src/editor-mode/parser";
import { ParseContext, syntaxTree } from "@codemirror/language";
import { Tree } from "@lezer/common";

export const parserField = StateField.define({
    create(state) {
        let parser = new Parser();
        parser.initParse(state.doc, syntaxTree(state));
        return parser;
    },
    update(parser, transaction) {
        let oldTree = syntaxTree(transaction.startState),
            newTree = syntaxTree(transaction.state);
        transaction.effects.forEach((value: StateEffect<{context: ParseContext, tree: Tree}>) => {
            newTree = (value.value?.tree ?? newTree);
        });
        if (transaction.docChanged || oldTree.length != newTree.length) {
            parser.applyChange(transaction.newDoc, newTree, oldTree, transaction.changes);
		}
        return parser;
    }
});