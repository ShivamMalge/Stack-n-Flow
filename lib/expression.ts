/**
 * Infix-to-postfix conversion and postfix evaluation, as step sequences.
 *
 * BCS304 module 1 names "Evaluation and conversion of Expressions" together,
 * and they are taught as a pair: convert with an operator stack, evaluate with
 * an operand stack. The evaluator already existed on /operations as a
 * one-shot result; neither half showed the stack moving, which is the whole
 * lesson.
 *
 * Kept free of React so the algorithms can be tested directly. Each builder
 * returns frames shaped for `useAnimationPlayer`.
 */

import type { VisualizerState } from "@/lib/visualizer-states"

export type TokenKind = "operand" | "operator" | "lparen" | "rparen"

export interface Token {
    text: string
    kind: TokenKind
}

export interface ExprCell {
    text: string
    state: VisualizerState
}

export interface ExprSnapshot {
    /** The input tokens, with the one under the cursor highlighted. */
    tokens: ExprCell[]
    /** Index of the token being read, or -1 before the scan starts. */
    cursor: number
    /** Operator stack when converting, operand stack when evaluating. */
    stack: ExprCell[]
    /** Output queue. Empty throughout an evaluation. */
    output: ExprCell[]
    /** Line to highlight in the code panel. */
    activeLine: number
    /** Set on the final frame. */
    result: string | null
}

export interface ExprFrame {
    snapshot: ExprSnapshot
    description: string
}

export interface BuildResult {
    frames: ExprFrame[]
    /** Non-null when the input could not be processed; frames will be empty. */
    error: string | null
    /** Postfix string, or the computed value, depending on the builder. */
    result: string | null
}

/**
 * `^` binds tightest and associates right, so `2^3^2` is `2^(3^2)`. The others
 * associate left. Getting this wrong is the classic bug in a hand-rolled
 * shunting yard, and it is exactly what exams probe.
 */
const PRECEDENCE: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2, "^": 3 }
const RIGHT_ASSOCIATIVE = new Set(["^"])

const MAX_TOKENS = 40

export function precedenceOf(operator: string): number {
    return PRECEDENCE[operator] ?? 0
}

/**
 * Splits an expression into tokens.
 *
 * Operands are either multi-digit non-negative integers or single letters, so
 * both the `A*B+C` form used to teach conversion and the numeric form used to
 * teach evaluation parse with one tokenizer.
 */
export function tokenize(input: string): { tokens: Token[]; error: string | null } {
    const tokens: Token[] = []
    let i = 0

    while (i < input.length) {
        const ch = input[i]

        if (/\s/.test(ch)) {
            i++
            continue
        }

        if (/[0-9]/.test(ch)) {
            let digits = ""
            while (i < input.length && /[0-9]/.test(input[i])) {
                digits += input[i]
                i++
            }
            tokens.push({ text: digits, kind: "operand" })
            continue
        }

        if (/[a-zA-Z]/.test(ch)) {
            tokens.push({ text: ch, kind: "operand" })
            i++
            continue
        }

        if (ch in PRECEDENCE) {
            tokens.push({ text: ch, kind: "operator" })
            i++
            continue
        }

        if (ch === "(") {
            tokens.push({ text: ch, kind: "lparen" })
            i++
            continue
        }

        if (ch === ")") {
            tokens.push({ text: ch, kind: "rparen" })
            i++
            continue
        }

        return { tokens: [], error: `"${ch}" is not a valid symbol. Use operands, + - * / % ^ and parentheses.` }
    }

    if (tokens.length === 0) {
        return { tokens: [], error: "Enter an expression first." }
    }

    if (tokens.length > MAX_TOKENS) {
        return { tokens: [], error: `That is ${tokens.length} tokens; keep it to ${MAX_TOKENS} so the animation stays readable.` }
    }

    return { tokens, error: null }
}

/** Cells for the input row, with `cursor` marked as the token being read. */
function tokenCells(tokens: Token[], cursor: number, consumedTo: number): ExprCell[] {
    return tokens.map((token, index) => ({
        text: token.text,
        state: index === cursor ? "comparing" : index < consumedTo ? "visited" : "default",
    }))
}

function plain(cells: readonly ExprCell[]): ExprCell[] {
    return cells.map((cell) => ({ text: cell.text, state: "default" as VisualizerState }))
}

/**
 * Converts infix to postfix with the shunting-yard algorithm, recording a frame
 * at every stack movement.
 */
export function buildInfixToPostfix(input: string): BuildResult {
    const { tokens, error } = tokenize(input)
    if (error) return { frames: [], error, result: null }

    const frames: ExprFrame[] = []
    const stack: ExprCell[] = []
    const output: ExprCell[] = []
    let depth = 0

    const push = (
        description: string,
        cursor: number,
        activeLine: number,
        highlight?: { stack?: number; output?: number; consumedTo?: number },
    ) => {
        const stackCells = plain(stack)
        const outputCells = plain(output)
        if (highlight?.stack !== undefined && stackCells[highlight.stack]) {
            stackCells[highlight.stack].state = "comparing"
        }
        if (highlight?.output !== undefined && outputCells[highlight.output]) {
            outputCells[highlight.output].state = "inserted"
        }
        frames.push({
            snapshot: {
                tokens: tokenCells(tokens, cursor, highlight?.consumedTo ?? (cursor < 0 ? 0 : cursor)),
                cursor,
                stack: stackCells,
                output: outputCells,
                activeLine,
                result: null,
            },
            description,
        })
    }

    push("Start with an empty operator stack and an empty output queue.", -1, 1)

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]

        if (token.kind === "operand") {
            output.push({ text: token.text, state: "default" })
            push(`"${token.text}" is an operand, so it goes straight to the output.`, i, 3, { output: output.length - 1 })
            continue
        }

        if (token.kind === "lparen") {
            depth++
            stack.push({ text: token.text, state: "default" })
            push('"(" is pushed and waits for its match.', i, 4, { stack: stack.length - 1 })
            continue
        }

        if (token.kind === "rparen") {
            if (depth === 0) {
                return { frames: [], error: 'Unbalanced parentheses: a ")" has no matching "(".', result: null }
            }
            depth--
            push('")" closes a group, so pop operators until the matching "(".', i, 5)
            while (stack.length > 0 && stack[stack.length - 1].text !== "(") {
                const popped = stack.pop()!
                output.push({ text: popped.text, state: "default" })
                push(`Pop "${popped.text}" to the output.`, i, 6, { output: output.length - 1 })
            }
            stack.pop()
            push('Discard the matching "(". Parentheses never reach the output.', i, 7)
            continue
        }

        // An operator. Pop everything that must be applied before it.
        const incoming = precedenceOf(token.text)
        push(`"${token.text}" has precedence ${incoming}. Compare it with the stack top.`, i, 9)

        while (stack.length > 0) {
            const top = stack[stack.length - 1]
            if (top.text === "(") break
            const sitting = precedenceOf(top.text)
            const mustPop = RIGHT_ASSOCIATIVE.has(token.text) ? sitting > incoming : sitting >= incoming
            if (!mustPop) break
            stack.pop()
            output.push({ text: top.text, state: "default" })
            push(
                RIGHT_ASSOCIATIVE.has(token.text)
                    ? `"${top.text}" binds tighter than "${token.text}", so it is applied first.`
                    : `"${top.text}" is at least as tight as "${token.text}", so it is applied first.`,
                i,
                10,
                { output: output.length - 1 },
            )
        }

        stack.push({ text: token.text, state: "default" })
        push(`Push "${token.text}" and carry on.`, i, 11, { stack: stack.length - 1 })
    }

    if (depth !== 0) {
        return { frames: [], error: 'Unbalanced parentheses: a "(" was never closed.', result: null }
    }

    // cursor -1 from here on: the drain reads no token, so highlighting the
    // last one as "reading" would be a lie the animation tells for several
    // frames at the most-watched moment.
    push("Input consumed. Drain whatever is left on the stack.", -1, 12, { consumedTo: tokens.length })
    while (stack.length > 0) {
        const popped = stack.pop()!
        output.push({ text: popped.text, state: "default" })
        push(`Pop "${popped.text}" to the output.`, -1, 12, {
            output: output.length - 1,
            consumedTo: tokens.length,
        })
    }

    const postfix = output.map((cell) => cell.text).join(" ")
    frames.push({
        snapshot: {
            tokens: tokenCells(tokens, -1, tokens.length),
            cursor: -1,
            stack: [],
            output: output.map((cell) => ({ text: cell.text, state: "inserted" as VisualizerState })),
            activeLine: 13,
            result: postfix,
        },
        description: `Done. Postfix: ${postfix}`,
    })

    return { frames, error: null, result: postfix }
}

function applyOperator(a: number, operator: string, b: number): { value: number; error: string | null } {
    switch (operator) {
        case "+": return { value: a + b, error: null }
        case "-": return { value: a - b, error: null }
        case "*": return { value: a * b, error: null }
        case "/":
            if (b === 0) return { value: 0, error: "Division by zero." }
            // Integer division, matching the C the lab programs are written in.
            return { value: Math.trunc(a / b), error: null }
        case "%":
            if (b === 0) return { value: 0, error: "Modulo by zero." }
            return { value: a % b, error: null }
        case "^": return { value: a ** b, error: null }
        default: return { value: 0, error: `Unknown operator "${operator}".` }
    }
}

/**
 * Evaluates a postfix expression with an operand stack, recording a frame at
 * every push and pop.
 */
export function buildPostfixEvaluation(input: string): BuildResult {
    const { tokens, error } = tokenize(input)
    if (error) return { frames: [], error, result: null }

    const letter = tokens.find((token) => token.kind === "operand" && /[a-zA-Z]/.test(token.text))
    if (letter) {
        return {
            frames: [],
            error: `"${letter.text}" has no value. Evaluation needs numbers, not variables.`,
            result: null,
        }
    }
    if (tokens.some((token) => token.kind === "lparen" || token.kind === "rparen")) {
        return { frames: [], error: "Postfix has no parentheses — that is the point of it.", result: null }
    }

    const frames: ExprFrame[] = []
    const stack: number[] = []

    const cells = (highlight?: number): ExprCell[] =>
        stack.map((value, index) => ({
            text: String(value),
            state: index === highlight ? "inserted" : "default",
        }))

    const push = (description: string, cursor: number, activeLine: number, highlight?: number) => {
        frames.push({
            snapshot: {
                tokens: tokenCells(tokens, cursor, cursor < 0 ? 0 : cursor),
                cursor,
                stack: cells(highlight),
                output: [],
                activeLine,
                result: null,
            },
            description,
        })
    }

    push("Start with an empty operand stack.", -1, 1)

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]

        if (token.kind === "operand") {
            stack.push(Number(token.text))
            push(`"${token.text}" is an operand, so push it.`, i, 3, stack.length - 1)
            continue
        }

        if (stack.length < 2) {
            return {
                frames: [],
                error: `"${token.text}" needs two operands but the stack holds ${stack.length}. The expression is not valid postfix.`,
                result: null,
            }
        }

        const b = stack.pop()!
        const a = stack.pop()!
        push(`"${token.text}" pops its two operands: ${a} and ${b}.`, i, 5)

        const { value, error: mathError } = applyOperator(a, token.text, b)
        if (mathError) return { frames: [], error: mathError, result: null }

        stack.push(value)
        push(`${a} ${token.text} ${b} = ${value}. Push the result.`, i, 6, stack.length - 1)
    }

    if (stack.length !== 1) {
        return {
            frames: [],
            error: `The stack ended with ${stack.length} values; valid postfix leaves exactly one.`,
            result: null,
        }
    }

    const value = String(stack[0])
    frames.push({
        snapshot: {
            tokens: tokenCells(tokens, -1, tokens.length),
            cursor: -1,
            stack: [{ text: value, state: "inserted" }],
            output: [],
            activeLine: 7,
            result: value,
        },
        description: `Done. The expression evaluates to ${value}.`,
    })

    return { frames, error: null, result: value }
}
