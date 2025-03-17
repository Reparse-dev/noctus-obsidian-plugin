import { colorMenuCmd, customHighlightCmd, customSpanCmd, divTagMenuCmd, fencedDivCmd, insertionCmd, spanTagMenuCmd, spoilerCmd, subscriptCmd, superscriptCmd } from "src/editor-mode/commands/palettes";

export const editorCommands = [
    insertionCmd,
    spoilerCmd,
    superscriptCmd,
    subscriptCmd,
    customHighlightCmd,
    customSpanCmd,
    fencedDivCmd,
    colorMenuCmd,
    spanTagMenuCmd,
    divTagMenuCmd
];

export const ctxMenuCommands = [
    insertionCmd,
    spoilerCmd,
    superscriptCmd,
    subscriptCmd,
    customHighlightCmd,
    customSpanCmd
];