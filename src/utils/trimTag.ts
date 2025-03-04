export function trimTag(tagStr: string) {
    return tagStr
        .trim()
        .replaceAll(/\s{2,}/g, " ");
}