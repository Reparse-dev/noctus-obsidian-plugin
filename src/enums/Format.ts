/** 
 * Formatting type for each token.
 */
export enum Format {
    /** Insertion (underline) */
    INSERTION = 1,
    /** Spoiler */
    SPOILER,
    /** Superscript */
    SUPERSCRIPT,
    /** Subscript */
    SUBSCRIPT,
    /** Highlight */
    HIGHLIGHT,
    /** Custom span */
    CUSTOM_SPAN,
    /** Fenced div (custom block) */
    FENCED_DIV
}