/** 
 * Formatting type for each token.
 */
export enum Format {
	/** Insertion */
	INSERTION = 1,
	/** Spoiler */
	SPOILER = 2,
	/** Superscript */
	SUPERSCRIPT = 3,
	/** Subscript */
	SUBSCRIPT = 4,
	/** Highlight */
	HIGHLIGHT = 5,
	/** Custom span */
	CUSTOM_SPAN = 6,
	/** Fenced div (custom block) */
	FENCED_DIV = 7,
	/** Underline */
	UNDERLINE = 8,
	/** Subtext */
	SUBTEXT = 9
}