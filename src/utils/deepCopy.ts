export function deepCopy<T extends object>(obj: T) {
    return JSON.parse(JSON.stringify(obj)) as T;
}