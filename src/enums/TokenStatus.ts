/**
 * To state whether the token is active or not.
 * Only that stated as `ACTIVE` can pass through the
 * rendering phase, whereas `INACTIVE` is used as a
 * cut-through for reparsing when necessary.
 * Note that, `INACTIVE` is only used by insertion,
 * spoiler, sup, and sub.
 */
export enum TokenStatus {
    /** 
     * The token is being processed through the parser queue.
     * After that, its status switched to either `ACTIVE` or `INACTIVE`.
     */
    PENDING,
    /** The token is ready for the rendering phase. */
    ACTIVE,
    /**
     * The token stated as `INACTIVE` by default doesn't
     * go through rendering phase. Often used to stating
     * token sequence that doesn't have closing delimiter.
     */
    INACTIVE
}