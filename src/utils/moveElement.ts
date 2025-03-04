export function moveElement(el: Element, direction: 1 | -1) {
    let parentEl = el.parentElement;
    if (!parentEl) { return false }
    if (direction > 0) {
        let nextEl = el.nextElementSibling;
        parentEl.insertAfter(el, nextEl);
    } else if (direction < 0) {
        let prevEl = el.previousElementSibling;
        parentEl.insertBefore(el, prevEl);
    }
}