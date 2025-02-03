export class CustomHighlight {
    constructor() {}
    decorate(el: HTMLElement) {
        let markElements = el.querySelectorAll<HTMLElement>("mark"),
            colorTagRe = /^\{([a-z0-9\-_]+)\}/i;
        markElements.forEach((el) => {
            if (!(el.firstChild instanceof Text && el.firstChild.textContent)) { return }
            let color = colorTagRe.exec(el.firstChild.textContent)?.[1];
            if (color) {
                let from = 0, to = from + color.length + 2;
                el.firstChild.replaceData(from, to - from, "");
                el.classList.add("custom-highlight", `custom-highlight-${color}`);
            }
        });
    }
}