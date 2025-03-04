export function takeBuiltinColor(color: string) {
    return document.body.computedStyleMap().get(`--color-${color}`)?.toString();
}