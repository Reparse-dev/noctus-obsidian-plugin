import { StateEffect, StateField } from "@codemirror/state";
import { Parser } from "src/editor-mode/parser";
import { ParseContext, syntaxTree } from "@codemirror/language";
import { Tree } from "@lezer/common";
import { settingsFacet } from "src/editor-mode/facets";
import { refresherAnnot } from "src/editor-mode/annotations";
import { activityFacet } from "../facets/activityFacet";

/**
 * In the context of extending syntax extension, this field should be the
 * first in order.
 */
export const parserField = StateField.define({
    create(state) {
        let parser = new Parser(state.facet(settingsFacet.reader)),
            activityRecorder = state.facet(activityFacet);
        parser.initParse(state.doc, syntaxTree(state));
        activityRecorder.enter({ isParsing: true });
        return parser;
    },
    update(parser, transaction) {
        let oldTree = syntaxTree(transaction.startState),
            newTree = syntaxTree(transaction.state),
            isRefreshed = transaction.annotation(refresherAnnot),
            activityRecorder = transaction.state.facet(activityFacet);
        // Sometimes, there is an effect containing ParseContext and the most
        // updated Tree along with the state update. If any, we should use it
        // instead of that was taken from the state.
        transaction.effects.forEach((effect: StateEffect<unknown>) => {
            let updatedTree = (effect.value as Partial<{ context: ParseContext, tree: Tree }>)?.tree;
            if (updatedTree instanceof Tree) {
                newTree = updatedTree;
            }
        });
        if (isRefreshed) {
            parser.initParse(transaction.newDoc, newTree);
            activityRecorder.enter({ isParsing: true });
            return parser;
        }
        // Also, do reparse when the Tree got to be reparsed.
        if (transaction.docChanged || oldTree.length != newTree.length) {
            parser.applyChange(transaction.newDoc, newTree, oldTree, transaction.changes);
            activityRecorder.enter({ isParsing: true });
		}
        return parser;
    }
});