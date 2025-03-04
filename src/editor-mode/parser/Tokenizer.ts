import { Format, TokenLevel, Delimiter, TokenStatus } from "src/enums";
import { ParserState } from "src/editor-mode/parser";
import { BlockFormat, InlineFormat, Token } from "src/types";
import { handleClosingDelim, retrieveDelimSpec, validateDelim } from "src/editor-mode/parser/utils";
import { colorTag, customSpanTag, fencedDivTag } from "src/editor-mode/parser/tokenizer-components";

/**
 * Tokens will only be created through this. Each method
 * returns whether `true` or `false`, indicating the success
 * of the tokenization. Parsed token will be automatically
 * inserted to the token group.
 */
export const Tokenizer = {
    /**
     * Used for parsing block token. Should only be executed when the
     * current line was a block start.
     */
    block(state: ParserState, type: BlockFormat) {
        // Block token is only parsed when the current line is a block start.
        if (!state.blkStart) { return false }
        // Retrieve DelimSpec based on input type.
        let spec = retrieveDelimSpec(type, Delimiter.OPEN),
            // Verifiy that the delimiter was valid and gets its length.
            { valid, length: openLen } = validateDelim(state.lineStr, state.offset, spec);
        // Advance along the given delimiter length.
        state.advance(openLen);
        // If it isn't valid, then abort it.
        if (!valid) { return false }
        let token: Token = {
            type,
            level: TokenLevel.BLOCK,
            status: TokenStatus.PENDING,
            from: state.globalOffset - openLen,
            to: state.globalOffset - openLen,
            openLen,
            closeLen: 0,
            tagLen: 0,
            // Block tag doesn't overlapped over the content.
            tagAsContent: false,
            validTag: false,
            closedByBlankLine: false
        };
        // Queue and push the token to the token group.
        state.blockTokens.push(token);
        state.queue.push(token);
        // Currently, block token only has fenced div type. Therefore,
        // the tokenizer parses its tag directly without checking its
        // type.
        fencedDivTag(state, token);
        // Indicate that tokenizing run successfully. 
        return true;
    },
    /** 
     * Used for parsing inline token. Should be executed twice only when the
     * parser state encountered allegedly closing delimiter of the queued token.
     */
    inline(state: ParserState, type: InlineFormat) {
        // Get the token according to the input type, may be null.
        let token = state.queue.getToken(type),
            // Which delimiter is encountered by the state.
            // Determined by the presence of queued token.
            role = state.queue.isQueued(type) ? Delimiter.CLOSE : Delimiter.OPEN,
            // Get delimiter specification according to its type.
            spec = retrieveDelimSpec(type, role),
            // Check whether it's highlight, custom span, or neither.
            isHighlight = type == Format.HIGHLIGHT,
            isCustomSpan = type == Format.CUSTOM_SPAN,
            // Verifiy that the delimiter was valid and gets its length.
            { valid, length } = validateDelim(state.lineStr, state.offset, spec);
        // If it isn't valid, then abort it.
        if (!valid) {
            state.advance(length);
            return false;
        }
        // If there is a queued token with this type, then finalize it.
        if (token) {
            handleClosingDelim(state, token, length);
        // Else, create new token and push it into the queue.
        } else {
            let token: Token = {
                type,
                level: TokenLevel.INLINE,
                status: TokenStatus.PENDING,
                from: state.globalOffset,
                to: state.globalOffset,
                openLen: length,
                closeLen: 0,
                tagLen: 0,
                tagAsContent: isHighlight || isCustomSpan,
                validTag: false,
                closedByBlankLine: false
            };
            state.inlineTokens.push(token);
            state.queue.push(token);
            state.advance(length);
            // If this token can have a tag, then try to parse it.
            if (isHighlight) { colorTag(state, token) }
            else if (isCustomSpan) { customSpanTag(state, token) }
        }
        return true;
    }
}