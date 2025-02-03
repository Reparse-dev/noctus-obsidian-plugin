export class SpoilerSpanElement extends HTMLElement {
    constructor() {
        super();
    }
    clickListener = (evt: MouseEvent) => {
        let curTarget = evt.currentTarget as HTMLElement;
        if (curTarget.getAttribute("revealed") === null) {
            curTarget.setAttribute("revealed", "");
        } else {
            curTarget.removeAttribute("revealed");
        }
    }
    connectedCallback() {
        this.addEventListener("click", this.clickListener);
    }
    disconnectedCallback() {
        this.removeEventListener("click", this.clickListener);
    }
}