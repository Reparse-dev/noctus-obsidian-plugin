import { Transaction } from "@codemirror/state";
import { refresherAnnot } from "src/editor-mode/annotations";

export function checkRefreshed(transactions: Transaction[] | readonly Transaction[] | Transaction) {
    if (transactions instanceof Array) {
        for (let i = 0; i < transactions.length; i++) {
            if (transactions[i].annotation(refresherAnnot)) { return true }
        }
    } else {
        if (transactions.annotation(refresherAnnot)) { return true }
    }
    return false;
}