export function hasClasses(el: Element, classes: string[]) {
    for (let cls of classes) {
        if (el.classList.contains(cls)) { return true }
    }
    return false;
}