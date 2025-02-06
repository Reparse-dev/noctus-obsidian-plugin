import { Decoration } from "@codemirror/view";
import { Format } from "src/enums";

export const AlignDeco = {
    [Format.ALIGN_LEFT]: Decoration.line({
        class: "cm-align-left",
        type: Format.ALIGN_LEFT
    }),
    [Format.ALIGN_RIGHT]: Decoration.line({
        class: "cm-align-right",
        type: Format.ALIGN_RIGHT
    }),
    [Format.ALIGN_CENTER]: Decoration.line({
        class: "cm-align-center",
        type: Format.ALIGN_CENTER
    }),
    [Format.ALIGN_JUSTIFY]: Decoration.line({
        class: "cm-align-justify",
        type: Format.ALIGN_JUSTIFY
    })
};

export const AlignMarkDeco = {
    [Format.ALIGN_LEFT]: Decoration.mark({
        class: "cm-align-mark-left",
        type: Format.ALIGN_LEFT,
        omitted: true
    }),
    [Format.ALIGN_RIGHT]: Decoration.mark({
        class: "cm-align-mark-right",
        type: Format.ALIGN_RIGHT,
        omitted: true
    }),
    [Format.ALIGN_CENTER]: Decoration.mark({
        class: "cm-align-mark-center",
        type: Format.ALIGN_CENTER,
        omitted: true
    }),
    [Format.ALIGN_JUSTIFY]: Decoration.mark({
        class: "cm-align-mark-justify",
        type: Format.ALIGN_JUSTIFY,
        omitted: true
    }),
};

export const DelimDeco = {
    [Format.INSERTION]: Decoration.mark({
        class: "cm-delim cm-ins",
        type: Format.INSERTION,
        omitted: true
    }),
    [Format.SPOILER]: Decoration.mark({
        class: "cm-delim cm-spoiler",
        type: Format.SPOILER,
        omitted: true
    }),
    [Format.SUPERSCRIPT]: Decoration.mark({
        class: "cm-delim cm-sup",
        type: Format.SUPERSCRIPT,
        omitted: true
    }),
    [Format.SUBSCRIPT]: Decoration.mark({
        class: "cm-delim cm-sub",
        type: Format.SUBSCRIPT,
        omitted: true
    }),
    [Format.HIGHLIGHT]: Decoration.mark({
        class: "cm-highlight",
        type: Format.HIGHLIGHT,
        omitted: true
    })
};

export const ContentDeco = {
    [Format.INSERTION]: Decoration.mark({
        class: "cm-ins",
        type: Format.INSERTION,
        inclusive: true
    }),
    [Format.SPOILER]: Decoration.mark({
        class: "cm-spoiler",
        type: Format.SPOILER,
        inclusive: true
    }),
    [Format.SUPERSCRIPT]: Decoration.mark({
        class: "cm-sup",
        type: Format.SUPERSCRIPT,
        inclusive: true
    }),
    [Format.SUBSCRIPT]: Decoration.mark({
        class: "cm-sub",
        type: Format.SUBSCRIPT,
        inclusive: true
    }),
    [Format.HIGHLIGHT]: Decoration.mark({
        class: "cm-highlight",
        type: Format.HIGHLIGHT,
        inclusive: true
    })
};

export const ColorTagDeco = Decoration.mark({
    class: "cm-color-tag",
    type: Format.COLOR_TAG,
    omitted: true
});

export const RevealedSpoiler = Decoration.mark({
    class: "cm-spoiler-revealed",
    type: Format.SPOILER
});