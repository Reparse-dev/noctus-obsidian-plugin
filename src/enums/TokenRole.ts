/**
 * Indicate that the token is recognized as a part of
 * tokens sequence, or a stand-alone one.
 */
export enum TokenRole {
    /** Opening delimiter */
    OPEN,
    /**
     * Act as a metadata stored in a token sequence.
     * In this case, it's only used as a highlight color tag
     */
    INLINE_TAG,
    /** Content of a token sequence */
    CONTENT,
    /** Closing delimiter */
    CLOSE,
    /** Act as a metadata for the block element */
    BLOCK_TAG
}