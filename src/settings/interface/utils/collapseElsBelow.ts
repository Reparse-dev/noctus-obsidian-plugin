export function collapseElsBelow(rootEl: HTMLElement) {
    for (let el = rootEl.nextElementSibling; el?.hasClass("is-collapsible"); el = el.nextElementSibling) {
        if (el.hasClass("collapsed")) {
            el.removeClass("collapsed");
        } else {
            el.addClass("collapsed");
        }
    }
}