import { describe, it, expect } from "vitest"
import {
    buildInfixToPostfix,
    buildPostfixEvaluation,
    precedenceOf,
    tokenize,
} from "@/lib/expression"

const postfixOf = (input: string) => buildInfixToPostfix(input).result
const valueOf = (input: string) => buildPostfixEvaluation(input).result

describe("tokenize", () => {
    it("reads multi-digit numbers as one operand", () => {
        const { tokens } = tokenize("12+345")
        expect(tokens.map((t) => t.text)).toEqual(["12", "+", "345"])
    })

    it("reads single letters as operands, for the A*B+C form exams use", () => {
        const { tokens } = tokenize("A*B+C")
        expect(tokens.map((t) => t.kind)).toEqual(["operand", "operator", "operand", "operator", "operand"])
    })

    it("ignores whitespace", () => {
        expect(tokenize("  A  +   B ").tokens.map((t) => t.text)).toEqual(["A", "+", "B"])
    })

    it("rejects an unknown symbol", () => {
        expect(tokenize("A$B").error).toMatch(/not a valid symbol/)
    })

    it("rejects an empty expression", () => {
        expect(tokenize("   ").error).toMatch(/Enter an expression/)
    })

    it("caps length so the animation stays watchable", () => {
        expect(tokenize("1+".repeat(30) + "1").error).toMatch(/keep it to 40/)
    })
})

describe("precedenceOf", () => {
    it("ranks the operators", () => {
        expect(precedenceOf("+")).toBe(1)
        expect(precedenceOf("*")).toBe(2)
        expect(precedenceOf("^")).toBe(3)
    })

    it("gives an unknown symbol the lowest rank", () => {
        expect(precedenceOf("(")).toBe(0)
    })
})

describe("buildInfixToPostfix", () => {
    it("keeps a flat operand sequence in order", () => {
        expect(postfixOf("A+B")).toBe("A B +")
    })

    it("applies multiplication before addition", () => {
        expect(postfixOf("A+B*C")).toBe("A B C * +")
    })

    it("honours parentheses over precedence", () => {
        expect(postfixOf("(A+B)*C")).toBe("A B + C *")
    })

    it("associates equal precedence left", () => {
        expect(postfixOf("A-B-C")).toBe("A B - C -")
    })

    // The classic bug in a hand-rolled shunting yard, and exactly what exams
    // probe: 2^3^2 is 2^(3^2) = 512, not (2^3)^2 = 64.
    it("associates exponentiation right", () => {
        expect(postfixOf("2^3^2")).toBe("2 3 2 ^ ^")
        expect(valueOf("2 3 2 ^ ^")).toBe("512")
    })

    it("handles nested parentheses", () => {
        expect(postfixOf("((A+B)*(C-D))/E")).toBe("A B + C D - * E /")
    })

    it("handles the standard textbook expression", () => {
        expect(postfixOf("A+B*C-D/E")).toBe("A B C * + D E / -")
    })

    it("never emits a parenthesis", () => {
        expect(postfixOf("((A))")).toBe("A")
    })

    it("rejects a closing parenthesis with no opener", () => {
        expect(buildInfixToPostfix("A+B)").error).toMatch(/no matching/)
    })

    it("rejects an opener that is never closed", () => {
        expect(buildInfixToPostfix("(A+B").error).toMatch(/never closed/)
    })

    it("returns no frames when it errors, so nothing half-animates", () => {
        const result = buildInfixToPostfix("(A+B")
        expect(result.frames).toHaveLength(0)
        expect(result.result).toBeNull()
    })

    it("records a frame for every stack movement", () => {
        const { frames } = buildInfixToPostfix("A+B*C")
        expect(frames.length).toBeGreaterThan(5)
        expect(frames[0].snapshot.stack).toHaveLength(0)
        expect(frames[0].snapshot.cursor).toBe(-1)
    })

    it("leaves the stack empty and the answer on the final frame", () => {
        const { frames } = buildInfixToPostfix("A+B*C")
        const last = frames[frames.length - 1].snapshot
        expect(last.stack).toHaveLength(0)
        expect(last.result).toBe("A B C * +")
    })

    it("marks exactly one token as the cursor while scanning", () => {
        const { frames } = buildInfixToPostfix("A+B")
        for (const frame of frames) {
            const comparing = frame.snapshot.tokens.filter((t) => t.state === "comparing")
            expect(comparing.length).toBeLessThanOrEqual(1)
        }
    })

    // During the drain the algorithm reads no token, so highlighting the last
    // one as "being read" would be a lie held on screen for several frames at
    // the most-watched moment of the animation.
    it("marks the input fully consumed once the drain starts", () => {
        const { frames } = buildInfixToPostfix("A+B*C")
        const draining = frames.filter((f) => f.description.startsWith("Input consumed"))
        expect(draining).toHaveLength(1)
        const start = frames.indexOf(draining[0])
        for (const frame of frames.slice(start)) {
            expect(frame.snapshot.cursor).toBe(-1)
            expect(frame.snapshot.tokens.some((t) => t.state === "comparing")).toBe(false)
            expect(frame.snapshot.tokens.every((t) => t.state === "visited" || t.state === "default"))
                .toBe(true)
        }
    })

    it("never lets the output shrink", () => {
        const { frames } = buildInfixToPostfix("((A+B)*(C-D))/E")
        let seen = 0
        for (const frame of frames) {
            expect(frame.snapshot.output.length).toBeGreaterThanOrEqual(seen)
            seen = frame.snapshot.output.length
        }
    })
})

describe("buildPostfixEvaluation", () => {
    it("evaluates a simple expression", () => {
        expect(valueOf("2 3 +")).toBe("5")
    })

    it("respects operand order for non-commutative operators", () => {
        expect(valueOf("5 2 -")).toBe("3")
        expect(valueOf("8 2 /")).toBe("4")
    })

    it("evaluates the conversion of an infix expression", () => {
        expect(valueOf(postfixOf("2+3*4")!)).toBe("14")
    })

    it("truncates division, matching the C used in the labs", () => {
        expect(valueOf("7 2 /")).toBe("3")
    })

    it("rejects division by zero", () => {
        expect(buildPostfixEvaluation("4 0 /").error).toMatch(/Division by zero/)
    })

    it("rejects modulo by zero", () => {
        expect(buildPostfixEvaluation("4 0 %").error).toMatch(/Modulo by zero/)
    })

    it("rejects variables, which have no value", () => {
        expect(buildPostfixEvaluation("A B +").error).toMatch(/no value/)
    })

    it("rejects parentheses, since postfix has none", () => {
        expect(buildPostfixEvaluation("(2 3 +)").error).toMatch(/no parentheses/)
    })

    it("rejects an operator with too few operands", () => {
        expect(buildPostfixEvaluation("2 +").error).toMatch(/needs two operands/)
    })

    it("rejects a leftover operand", () => {
        expect(buildPostfixEvaluation("2 3 4 +").error).toMatch(/ended with 2 values/)
    })

    it("leaves exactly the answer on the stack", () => {
        const { frames } = buildPostfixEvaluation("2 3 + 4 *")
        const last = frames[frames.length - 1].snapshot
        expect(last.stack.map((c) => c.text)).toEqual(["20"])
        expect(last.result).toBe("20")
    })

    it("keeps the output queue empty throughout, since evaluation has none", () => {
        const { frames } = buildPostfixEvaluation("2 3 + 4 *")
        for (const frame of frames) {
            expect(frame.snapshot.output).toHaveLength(0)
        }
    })
})
