"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDown, Play } from "lucide-react"
import AnimationControls from "@/components/ui/animation-controls"
import CodePanel from "@/components/ui/code-panel"
import InlineAlert from "@/components/ui/inline-alert"
import VisualizerLayout from "@/components/visualizers/visualizer-layout"
import { useAnimationPlayer } from "@/hooks/useAnimationPlayer"
import { resolveState, STATE_BOX } from "@/lib/visualizer-states"
import {
    buildInfixToPostfix,
    buildPostfixEvaluation,
    type ExprCell,
    type ExprSnapshot,
} from "@/lib/expression"

type Mode = "convert" | "evaluate"

// Line indices here are what lib/expression.ts sets as `activeLine`.
const CONVERT_CODE = [
    "def infix_to_postfix(tokens):",
    "    stack, output = [], []",
    "    for tok in tokens:",
    "        if is_operand(tok): output.append(tok)",
    "        elif tok == '(':    stack.push(tok)",
    "        elif tok == ')':",
    "            while stack.top() != '(': output.append(stack.pop())",
    "            stack.pop()              # discard the '('",
    "        else:",
    "            # an operator: compare precedence with the stack top",
    "            while must_pop(stack.top(), tok): output.append(stack.pop())",
    "            stack.push(tok)",
    "    while stack: output.append(stack.pop())",
    "    return output",
]

const EVALUATE_CODE = [
    "def evaluate_postfix(tokens):",
    "    stack = []",
    "    for tok in tokens:",
    "        if is_operand(tok): stack.push(int(tok))",
    "        else:",
    "            b = stack.pop(); a = stack.pop()",
    "            stack.push(apply(a, tok, b))",
    "    return stack.pop()",
]

const PRESETS: Record<Mode, { label: string; value: string }[]> = {
    convert: [
        { label: "A+B*C", value: "A+B*C" },
        { label: "(A+B)*C", value: "(A+B)*C" },
        { label: "A+B*C-D/E", value: "A+B*C-D/E" },
        { label: "2^3^2", value: "2^3^2" },
        { label: "((A+B)*(C-D))/E", value: "((A+B)*(C-D))/E" },
    ],
    evaluate: [
        { label: "2 3 + 4 *", value: "2 3 + 4 *" },
        { label: "5 1 2 + 4 * + 3 -", value: "5 1 2 + 4 * + 3 -" },
        { label: "2 3 2 ^ ^", value: "2 3 2 ^ ^" },
    ],
}

const EMPTY: ExprSnapshot = {
    tokens: [],
    cursor: -1,
    stack: [],
    output: [],
    activeLine: 0,
    result: null,
}

function Cell({ cell, className = "" }: { cell: ExprCell; className?: string }) {
    return (
        <div
            className={`flex items-center justify-center rounded-md border-2 font-mono font-bold shadow-sm transition-all duration-300 ${STATE_BOX[cell.state]} ${className}`}
        >
            {cell.text}
        </div>
    )
}

export default function ExpressionVisualizer() {
    const [mode, setMode] = useState<Mode>("convert")
    const [expression, setExpression] = useState("A+B*C")
    const [error, setError] = useState<string | null>(null)
    const [snapshot, setSnapshot] = useState<ExprSnapshot>(EMPTY)

    const onFrameChange = useCallback((snap: ExprSnapshot) => setSnapshot(snap), [])
    const player = useAnimationPlayer<ExprSnapshot>(onFrameChange)

    const changeMode = (next: string) => {
        const target = next as Mode
        setMode(target)
        setExpression(PRESETS[target][0].value)
        setError(null)
        setSnapshot(EMPTY)
        player.clear()
    }

    const run = (value = expression) => {
        const build = mode === "convert" ? buildInfixToPostfix : buildPostfixEvaluation
        const { frames, error: buildError } = build(value)
        if (buildError) {
            setError(buildError)
            setSnapshot(EMPTY)
            player.clear()
            return
        }
        setError(null)
        player.loadFrames(frames)
        setTimeout(() => player.play(), 50)
    }

    const applyPreset = (value: string) => {
        setExpression(value)
        run(value)
    }

    const view = player.currentSnapshot ?? snapshot
    const isConvert = mode === "convert"

    return (
        <VisualizerLayout
            controls={
                <Card>
                    <CardHeader>
                        <CardTitle>Expression Operations</CardTitle>
                        <CardDescription>
                            Convert infix to postfix with an operator stack, then evaluate the result
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Tabs value={mode} onValueChange={changeMode}>
                            <TabsList className="grid grid-cols-2 w-full">
                                <TabsTrigger value="convert">Infix → Postfix</TabsTrigger>
                                <TabsTrigger value="evaluate">Evaluate Postfix</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex gap-2">
                            <Input
                                value={expression}
                                onChange={(e) => setExpression(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && run()}
                                placeholder={isConvert ? "e.g. A+B*C" : "e.g. 2 3 + 4 *"}
                                className="font-mono"
                                aria-label={isConvert ? "Infix expression" : "Postfix expression"}
                            />
                            <Button onClick={() => run()} disabled={player.isPlaying}>
                                <Play className="mr-2 h-4 w-4" />
                                Run
                            </Button>
                        </div>

                        <InlineAlert message={error} />

                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Examples</p>
                            <div className="flex flex-wrap gap-2">
                                {PRESETS[mode].map((preset) => (
                                    <Button
                                        key={preset.value}
                                        variant="outline"
                                        size="sm"
                                        className="font-mono text-xs"
                                        disabled={player.isPlaying}
                                        onClick={() => applyPreset(preset.value)}
                                    >
                                        {preset.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <AnimationControls
                                currentFrame={player.currentFrame}
                                totalFrames={player.totalFrames}
                                isPlaying={player.isPlaying}
                                isPaused={player.isPaused}
                                isComplete={player.isComplete}
                                speed={player.speed}
                                onPlay={player.play}
                                onPause={player.pause}
                                onStepForward={player.stepForward}
                                onStepBackward={player.stepBackward}
                                onReset={player.reset}
                                onSpeedChange={player.setSpeed}
                                onFrameChange={player.goToFrame}
                            />
                        </div>

                        {view.result && (
                            <div className="rounded-md border bg-muted/30 p-3">
                                <p className="text-xs text-muted-foreground">
                                    {isConvert ? "Postfix" : "Value"}
                                </p>
                                <p className="font-mono text-lg font-bold break-all">{view.result}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            }
            visualization={
                <Card className="flex flex-col h-full">
                    <CardHeader className="shrink-0">
                        <CardTitle>Visualization</CardTitle>
                        <CardDescription>
                            {isConvert
                                ? "The operator stack holds what is waiting; the output queue is the answer being built"
                                : "The operand stack holds partial results"}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-1 min-h-0 gap-5 border-t pt-5 pb-4 bg-muted/5">
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Input
                            </p>
                            {view.tokens.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Run an expression to begin.</p>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {view.tokens.map((cell, index) => (
                                        <Cell key={index} cell={cell} className="h-9 w-9 text-sm" />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-1 min-h-0 gap-6">
                            <div className="flex flex-col">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    {isConvert ? "Operator stack" : "Operand stack"}
                                </p>
                                {/* Top of the stack at the top, matching the stack visualizer. */}
                                <div className="flex flex-col items-center gap-1 min-w-[4.5rem]">
                                    {view.stack.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">empty</p>
                                    ) : (
                                        <>
                                            <div className="flex flex-col items-center text-muted-foreground">
                                                <span className="text-[10px] uppercase tracking-wider font-semibold">Top</span>
                                                <ArrowDown className="h-3 w-3" />
                                            </div>
                                            {[...view.stack].reverse().map((cell, index) => (
                                                <Cell key={index} cell={cell} className="h-9 w-16 text-sm" />
                                            ))}
                                            <div className="mt-1 w-16 rounded-full border-t-4 border-primary/30" />
                                        </>
                                    )}
                                </div>
                            </div>

                            {isConvert && (
                                <div className="flex-1 min-w-0">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Output queue
                                    </p>
                                    {view.output.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">empty</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-1.5">
                                            {view.output.map((cell, index) => (
                                                <Cell key={index} cell={cell} className="h-9 w-9 text-sm" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {player.currentDescription && (
                            <p className="shrink-0 rounded-md border bg-muted/30 px-3 py-2 text-center text-xs md:text-sm font-medium text-primary">
                                {player.currentDescription}
                            </p>
                        )}

                        <div className="shrink-0 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t pt-3 text-xs">
                            {[
                                ["default", "Waiting"],
                                ["comparing", "Reading"],
                                ["inserted", "Just moved"],
                                ["visited", "Consumed"],
                            ].map(([state, label]) => (
                                <div
                                    key={label}
                                    className="flex items-center gap-1.5 rounded border border-border bg-background px-2 py-0.5"
                                >
                                    <div
                                        className={`h-2.5 w-2.5 rounded-sm border ${STATE_BOX[resolveState({ [state]: true })]}`}
                                    />
                                    <span className="whitespace-nowrap text-muted-foreground">{label}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            }
            code={
                <CodePanel
                    code={isConvert ? CONVERT_CODE : EVALUATE_CODE}
                    activeLine={player.currentSnapshot ? view.activeLine : null}
                    title={isConvert ? "Infix to Postfix" : "Postfix Evaluation"}
                />
            }
            docs={
                <Card>
                    <CardHeader>
                        <CardTitle>Learning</CardTitle>
                        <CardDescription>Why postfix exists</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <p>
                            Infix needs precedence rules and parentheses to be unambiguous.{" "}
                            <strong>Postfix</strong> needs neither: operands come first and each operator
                            applies to the two values before it, so a single left-to-right pass with one
                            stack evaluates it.
                        </p>
                        <div>
                            <p className="mb-1 font-medium">Precedence, tightest first</p>
                            <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
                                <li>
                                    <code className="font-mono">^</code> — exponentiation,{" "}
                                    <strong>right</strong>-associative
                                </li>
                                <li>
                                    <code className="font-mono">* / %</code> — left-associative
                                </li>
                                <li>
                                    <code className="font-mono">+ -</code> — left-associative
                                </li>
                            </ul>
                        </div>
                        <p>
                            Associativity is the part that catches people out.{" "}
                            <code className="font-mono">2^3^2</code> is{" "}
                            <code className="font-mono">2^(3^2)</code> = 512, not{" "}
                            <code className="font-mono">(2^3)^2</code> = 64, so an equal-precedence{" "}
                            <code className="font-mono">^</code> on the stack is <em>not</em> popped.
                            Every other operator is.
                        </p>
                        <p>
                            <strong>Complexity:</strong> each token is pushed and popped at most once, so
                            both conversion and evaluation run in O(n) time and O(n) space.
                        </p>
                    </CardContent>
                </Card>
            }
        />
    )
}
