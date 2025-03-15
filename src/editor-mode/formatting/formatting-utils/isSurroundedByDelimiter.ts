export function isSurroundedByDelimiter(str: string, delimStr: string) {
    return str.startsWith(delimStr) && str.endsWith(delimStr);
}