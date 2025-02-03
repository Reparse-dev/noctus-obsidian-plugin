import { Format, TokenRole, TokenStatus } from "src/enums";
import { ParserState } from "src/editor-mode/parser";
import { MainFormat, Token } from "src/types";
import { retrieveDelimSpec, validateDelim } from "src/editor-mode/parser/utils";
import { COLOR_TAG_RE } from "src/editor-mode/parser/regexps";

export const Tokenizer = {
    align(state: ParserState) {
        let str = state.lineStr, type: Format, length = 0;
        // If offset isn't zero or the line isn't started with "!!", then it fails
        if (state.offset || !str.startsWith("!!")) { return false }
        // Because the line was preceded by "!!", the offset incrased by 2
        length += 2;
        switch (true) {
            case str.startsWith("left", length):
                type = Format.ALIGN_LEFT;
                break;
            case str.startsWith("right", length):
                type = Format.ALIGN_RIGHT;
                break;
            case str.startsWith("center", length):
                type = Format.ALIGN_CENTER;
                break;
            case str.startsWith("justify", length):
                type = Format.ALIGN_JUSTIFY;
                break;
            default:
                state.advance(length);
                return false;
        }
        length += type + 3;
        if (!str.startsWith("!!", length)) {
            state.advance(length);
            return false;
        }
        let lineFrom = state.line.from;
        length += 2;
        state.advance(length);
        state.tokens.push({
            type,
            status: TokenStatus.ACTIVE,
            role: TokenRole.SINGLE,
            from: lineFrom,
            to: lineFrom + length,
            pointer: state.tokens.length,
            size: 1
        });
        return true;
    },
    delim(state: ParserState, type: MainFormat) {
        if (type == Format.HIGHLIGHT) {
            throw TypeError("");
        }
        let role = state.queue.isQueued(type) ? TokenRole.CLOSE : TokenRole.OPEN,
            spec = retrieveDelimSpec(type, role),
            { valid, length } = validateDelim(state.lineStr, state.offset, spec);
        if (valid) {
            let token: Token = {
                type,
                status: TokenStatus.PENDING,
                role,
                from: state.gOffset,
                to: state.gOffset + length,
                pointer: state.queue.getOpen(type)?.pointer ?? state.tokens.length,
                size: 2
            };
            state.tokens.push(token);
            state.queue.push(token);
            state.advance(length);
            if (role == TokenRole.OPEN) { Tokenizer.content(state, type) }
            return true;
        } else {
            state.advance(length);
            return false;
        }
    },
    highlightDelim(state: ParserState) {
        let { from, to } = state.cursor!,
            length = to - from,
            type = Format.HIGHLIGHT,
            role = state.queue.isQueued(type) ? TokenRole.CLOSE : TokenRole.OPEN,
            token: Token = {
                type,
                status: TokenStatus.ACTIVE,
                role,
                from,
                to,
                pointer: state.queue.getOpen(type)?.pointer ?? state.tokens.length,
                size: 2
            };
        state.tokens.push(token);
        state.queue.push(token);
        state.advance(length);
        if (role == TokenRole.OPEN) { Tokenizer.content(state, type) }
        return true;
    },
    content(state: ParserState, type: MainFormat) {
        // content should be indexed right after its opening delimiter
        let from = state.gOffset;
        let token: Token = {
            type,
            status: TokenStatus.PENDING,
            role: TokenRole.CONTENT,
            from,
            to: from,
            pointer: state.tokens.length - 1,
            size: 2
        };
        state.tokens.push(token);
        state.queue.push(token);
        if (type == Format.HIGHLIGHT) {
            token.status = TokenStatus.ACTIVE;
            Tokenizer.colorTag(state);
        }
        return true;
    },
    colorTag(state: ParserState) {
        // color tag should be indexed right after mark content,
        // therefore its index should be plus two of mark opening
        // index
        COLOR_TAG_RE.lastIndex = state.offset;
        let match = state.lineStr.match(COLOR_TAG_RE);
        if (match) {
            let tagLen = match[0].length,
                token: Token = {
                    type: Format.HIGHLIGHT_COLOR_TAG,
                    status: TokenStatus.ACTIVE,
                    role: TokenRole.TAG,
                    from: state.gOffset,
                    to: state.gOffset + tagLen,
                    pointer: state.tokens.length,
                    size: 1
                };
            state.tokens.push(token);
            state.advance(tagLen);
            return true;
        }
        return false;
    }
}