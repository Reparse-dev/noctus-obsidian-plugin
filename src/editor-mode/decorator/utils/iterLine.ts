import { IterLineSpec } from "src/types";

export function iterLine(spec: IterLineSpec) {
    for (let i = spec.fromLn; i <= (spec.toLn ?? spec.doc.lines); i++) {
        let curLine = spec.doc.line(i);
        if (spec.callback(curLine, spec.doc) === false) { break }
    }
}