export class CustomAlign {
    constructor() {}
    decorate(el: HTMLElement) {
        if (!(el.firstChild instanceof Text && el.firstChild.textContent)) { return }
        let textNode = el.firstChild,
            alignRe = /!!(?:left|right|center|justify)!!/y,
            match = alignRe.exec(textNode.textContent ?? "");
        if (match) {
            let align = match[0].slice(2, match[0].length - 2);
            textNode.replaceData(0, match[0].length, "");
            el.addClass("align-" + align);
        }
    }
}