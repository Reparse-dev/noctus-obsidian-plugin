import { Format, TokenRole, TokenStatus } from "src/enums";
import { MainFormat, Token } from "src/types";
import { ParserState } from "src/editor-mode/parser";

export class TokenQueue {
    open: Record<MainFormat, Token | null> = {
        [Format.INSERTION]: null,
        [Format.SPOILER]: null,
        [Format.SUPERSCRIPT]: null,
        [Format.SUBSCRIPT]: null,
        [Format.HIGHLIGHT]: null,
    };
    /**
     * Content token is generated and pushed automatically
     * as its opening delimiter enter the queue.
     */
    content: Record<MainFormat, Token | null> = {
        [Format.INSERTION]: null,
        [Format.SPOILER]: null,
        [Format.SUPERSCRIPT]: null,
        [Format.SUBSCRIPT]: null,
        [Format.HIGHLIGHT]: null,
    };
    close: Record<MainFormat, Token | null> = {
        [Format.INSERTION]: null,
        [Format.SPOILER]: null,
        [Format.SUPERSCRIPT]: null,
        [Format.SUBSCRIPT]: null,
        [Format.HIGHLIGHT]: null,
    };
    state: ParserState;
    constructor() {
    }
    get tokens() {
        return this.state.tokens;
    }
    attachState(state: ParserState) {
        this.state = state;
        state.queue = this;
    }
    deattachState() {
        (this.state as ParserState | undefined) = undefined;
    }
    isQueued(type: MainFormat) {
        return !!this.open[type];
    }
    push(token: Token) {
        if (token.type < Format.INSERTION || token.type == Format.HIGHLIGHT_COLOR_TAG) {
            throw TypeError("Type of token must be one of MainFormat");
        }
        // Used as key to access certain queued token
        let type = token.type as MainFormat,
            role = token.role;
        if (role == TokenRole.OPEN) {
            this.open[type] = token;
        } else if (role == TokenRole.CONTENT) {
            this.content[type] = token;
        } else if (role == TokenRole.CLOSE) {
            this.close[type] = token;
            this.resolve([type]);
        }
    }
    getOpen(type: MainFormat) {
        return this.open[type];
    }
    /**
     * Resolve type-specific token(s) in the queue. Resolving it means
     * that the token will no longer be in `PENDING` status. Instead, it
     * will be stated as `ACTIVE` or `INACTIVE` depending on presence of
     * closing delimiter in the queue.
     */
    resolve(types: MainFormat[], to = this.state.gOffset) {
        for (let type of types) {
            let status: TokenStatus,
                open = this.open[type],
                content = this.content[type],
                close = this.close[type];
            if (!open) { continue }
            if (close) {
                let size = this.tokens.length - open.pointer;
                status = TokenStatus.ACTIVE;
                content!.to = close.from;
                close.status = status;
                close.size = content!.size = open.size = size;
                this.close[type] = null;
            } else {
                status = TokenStatus.INACTIVE;
                content!.to = to;
            }
            if (type != Format.HIGHLIGHT) {
                open.status = content!.status = status;
            }
            this.open[type] = this.content[type] = null;
        }
    }
    /** Resolve all existing token in the queue. Often used when facing boundary or a blank line. */
    resolveAll(to = this.state.gOffset) {
        this.resolve([Format.INSERTION, Format.SPOILER, Format.SUPERSCRIPT, Format.SUBSCRIPT, Format.HIGHLIGHT], to);
    }
    clear() {
        for (let type = Format.INSERTION as MainFormat; type <= Format.HIGHLIGHT; type++) {
            this.open[type] = this.content[type] = this.close[type] = null;
        }
        (this.state as ParserState | undefined) = undefined;
    }
}