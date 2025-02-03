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
    TAG,
    /** Content of a token sequence */
    CONTENT,
    /** Closing delimiter */
    CLOSE,
    /** Stand-alone token that isn't a part of any sequence */
    SINGLE
}