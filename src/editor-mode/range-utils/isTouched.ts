import { PlainRange } from "src/types";

export function isTouched(offset: number, range: PlainRange) {
    return offset >= range.from && offset <= range.to;
}