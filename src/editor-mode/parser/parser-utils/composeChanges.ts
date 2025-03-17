import { ChangeSet } from "@codemirror/state";
import { ChangedRange } from "src/types";

/**
 * [id] Mengakumulasi seluruh range yang dimuat oleh
 * `ChangeSet` untuk menghasilkan `ChangedRange` bila
 * memang terdapat pengubahan teks. `ChangedRange` dapat
 * difungsikan sebagai offset permulaan parsing,
 * menghindari reparsing seluruh dokumen.
 */
export function composeChanges(changes: ChangeSet): ChangedRange | null {
    if (changes.empty) {
        // Bila tidak terdapat pengubahan, hasilkan null
        return null;
    }
    let from: number, initTo: number, changedTo: number;
    changes.iterChangedRanges((fromA, toA, fromB, toB) => {
        // [id] Memilih offset terkecil sebagai offset awal pengubahan
        from = from === undefined ? fromA : Math.min(from, fromA);
        // [id] Memilih offset terbesar sebagai offset akhir pengubahan
        initTo = initTo === undefined ? toA : Math.max(initTo, toA);
        changedTo = changedTo === undefined ? toB : Math.max(changedTo, toB);
    }, false);
    return {
        from: from!,
        initTo: initTo!,
        changedTo: changedTo!,
        length: changedTo! - initTo!
    };
}