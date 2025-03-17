import { Format, TokenLevel, TokenStatus } from "src/enums";
import { InlineFormat, Token } from "src/types";
import { ParserState } from "src/editor-mode/parser";
import { Formats, InlineRules } from "src/format-configs";

/**
 * A place storing token based on its type, to be resolved through
 * the `Parser` and `ParserState` when satisfies certain conditions,
 * such as the token finally reaches its closing delimiter or faces
 * a context boundary.
 */
export class TokenQueue {
    /** Contains all queued tokens (if any), each is paired by its format type. */
    private tokenMap: Partial<Record<Format, Token>> = {};
    private state: ParserState;
    constructor() {
    }
    /**
     * Attach a state to the queue. Often used when
     * initializing the parsing.
     */
    attachState(state: ParserState) {
        this.state = state;
        this.state.queue = this;
    }
    /** 
     * Detach currently attached state from the queue. Often used
     * when the parsing was done.
     */
    detachState() {
        (this.state.queue as unknown) = undefined;
        (this.state as unknown) = undefined;
    }
    /** Checking whether the token with `type` format is queued or not. */
    isQueued(type: Format) {
        return !!this.tokenMap[type];
    }
    /** Push a token into the queue, exactly into the token map. */
    push(token: Token) {
        // Any token pushed into the queue will instantly be stated as `PENDING`.
        token.status = TokenStatus.PENDING;
        this.tokenMap[token.type] = token;
    }
    /** 
     * Get queued token as specified by `type` parameter.
     * Returns `null` if it isn't queued.
     */
    getToken(type: Format) {
        return this.tokenMap[type] ?? null;
    }
    /**
     * Resolve type-specific token(s) in the queue. Resolving it means
     * that the token will no longer be in `PENDING` status. Instead, it
     * will be stated as `ACTIVE` or `INACTIVE` depending on presence of
     * closing delimiter, if it is required for that. Then, resolved token
     * will be ejected from the map.
     * 
     * @param closed If false and the token's type requires to be closed,
     * then the token will be resolved as `INACTIVE`. Otherwise, it will
     * be stated as `ACTIVE`.
     * 
     * @param closedByBlankLine Resolved token is either closed by a blank
     * line or not. It has no effect when `closed` is `true`.
     * 
     * @param to Only needed when `closed` is `false`. Used to specify
     * the end offset of the resolved token.
     */
    resolve(types: Format[], closed: boolean, closedByBlankLine: boolean, to = this.state.globalOffset) {
        for (let type of types) {
            let token = this.getToken(type);
            // If token with this type doesn't exist, then continue to the next one.
            if (!token) { continue }
            // When it is an inline token.
            if (token.level == TokenLevel.INLINE) {
                // There is a type -that is highlight- that doesn't need to be closed.
                if (!closed && InlineRules[type as InlineFormat].mustBeClosed) {
                    token.status = TokenStatus.INACTIVE;
                } else {
                    token.status = TokenStatus.ACTIVE;
                }
            // When it is a block token.
            } else {
                // Block token doesn't need to be closed.
                // Only the validity of its tag affects its status.
                if (token.validTag) {
                    token.status = TokenStatus.ACTIVE;
                } else {
                    token.status = TokenStatus.INACTIVE;
                }
            }
            // Assign "to" value into token.to when "closed" is false.
            if (!closed) {
                token.to = to;
                // Determine that the resolved token is either located after the blank line or not.
                token.closedByBlankLine = closedByBlankLine;
            }
            // Eject the token from the queue.
            delete this.tokenMap[type];
        }
    }
    /**
     * Resolve all existing token in the queue. Often used when facing context boundary,
     * blank line, or table separator. Should be executed without any closing delimiter
     * has been met.
     */
    resolveAll(closedByBlankLine: boolean, to = this.state.globalOffset) {
        this.resolve(Formats.ALL, false, closedByBlankLine, to);
    }
    /** Clear all queued tokens. */
    clear() {
        this.tokenMap = {};
    }
}