import { Format } from "src/enums";
import { InlineFormatRule, InlineFormat } from "src/types";

export const InlineRules: Record<InlineFormat, InlineFormatRule> = {
    [Format.INSERTION]: {
        char: "+",
        length: 2,
        exactLen: true,
        allowSpace: true,
        mustBeClosed: true,
        class: "ins",
        getEl: () => document.createElement("ins"),
        builtin: false
    },
    [Format.SPOILER]: {
        char: "|",
        length: 2,
        exactLen: true,
        allowSpace: true,
        mustBeClosed: true,
        class: "spoiler",
        getEl: () => {
            let spoilerEl = document.createElement("span");
            spoilerEl.addClass("spoiler");
            spoilerEl.addEventListener("click", (evt) => {
                let spoilerEl = evt.currentTarget as Element,
                    isHidden = !spoilerEl.hasClass("spoiler-revealed");
                spoilerEl.toggleClass("spoiler-revealed", isHidden);
            });
            return spoilerEl;
        },
        builtin: false
    },
    [Format.SUPERSCRIPT]: {
        char: "^",
        length: 1,
        exactLen: true,
        allowSpace: false,
        mustBeClosed: true,
        class: "sup",
        getEl: () => document.createElement("sup"),
        builtin: false
    },
    [Format.SUBSCRIPT]: {
        char: "~",
        length: 1,
        exactLen: true,
        allowSpace: false,
        mustBeClosed: true,
        class: "sub",
        getEl: () => document.createElement("sub"),
        builtin: false
    },
    [Format.HIGHLIGHT]: {
        char: "=",
        length: 2,
        exactLen: false,
        allowSpace: true,
        mustBeClosed: false,
        class: "custom-highlight",
        getEl: () => document.createElement("mark"),
        builtin: true
    },
    [Format.CUSTOM_SPAN]: {
        char: "!",
        length: 2,
        exactLen: true,
        allowSpace: true,
        mustBeClosed: true,
        class: "custom-span",
        getEl() {
            let el = document.createElement("span");
            el.classList.add(InlineRules[Format.CUSTOM_SPAN].class);
            return el;
        },
        builtin: false
    }
}