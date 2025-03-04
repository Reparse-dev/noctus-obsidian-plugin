export function decToHex(value: number, minDigit = 2) {
    return value.toString(16).padStart(minDigit, "0");
}