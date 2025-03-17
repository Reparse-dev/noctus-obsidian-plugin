export function measureIndent(str: string, max?: number) {
    let indentSize = 0,
        charLen = 0;
    max ??= str.length * 4;
    for (let char = str[charLen]; charLen < str.length && indentSize < max; char = str[++charLen]) {
        if (char == " ") { indentSize++ }
        else if (char == "\t") { indentSize += 4 - (indentSize % 4) }
        else { break }
    }
    return { indentSize, charLen }
}