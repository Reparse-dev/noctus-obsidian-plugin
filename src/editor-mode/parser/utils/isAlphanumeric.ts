export function isAlphanumeric(char: string) {
    let charCode = char.charCodeAt(0);
    return (
        charCode >= 0x30 && charCode <= 0x39 ||
        charCode >= 0x41 && charCode <= 0x5a ||
        charCode >= 0x61 && charCode <= 0x7a
    );
}