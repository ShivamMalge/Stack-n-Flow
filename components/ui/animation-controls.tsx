"use client"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
    Play,
    Pause,
    SkipForward,
    SkipBack,
    RotateCcw,
} from "lucide-react"

interface AnimationControlsProps {
    currentFrame: number
    totalFrames: number
    isPlaying: boolean
    isPaused: boolean
    isComplete: boolean
    speed: number
    disabled?: boolean
    onPlay: () => void
    onPause: () => void
    onStepForward: () => void
    onStepBackward: () => void
    onReset: () => void
    onSpeedChange: (speed: number) => void
    onFrameChange?: (frame: number) => void
}

const SPEED_PRESETS = [
    { label: "0.5x", value: 1600 },
    { label: "1x", value: 800 },
    { label: "1.5x", value: 533 },
    { label: "2x", value: 400 },
    { label: "3x", value: 267 },
]

export default function AnimationControls({
    currentFrame,
    totalFrames,
    isPlaying,
    isComplete,
    speed,
    disabled = false,
    onPlay,
    onPause,
    onStepForward,
    onStepBackward,
    onReset,
    onSpeedChange,
    onFrameChange,
}: AnimationControlsProps) {
    const progress = totalFrames > 0 ? ((currentFrame + 1) / totalFrames) * 100 : 0
    const hasFrames = totalFrames > 0
    const canStepForward = hasFrames && currentFrame < totalFrames - 1
    const canStepBackward = hasFrames && currentFrame >= 0
    const currentSpeedPreset = SPEED_PRESETS.findIndex((p) => p.value === speed)

    return (
        <div className="space-y-3">
            {/* Progress bar */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>
                        {hasFrames ? `${Math.max(0, currentFrame + 1)} / ${totalFrames}` : "—"}
                    </span>
                </div>
                <div
                    className="h-2 bg-muted rounded-full overflow-hidden cursor-pointer"
                    onClick={(e) => {
                        if (!hasFrames || !onFrameChange) return
                        const rect = e.currentTarget.getBoundingClientRect()
                        const x = e.clientX - rect.left
                        const pct = x / rect.width
                        const frame = Math.round(pct * (totalFrames - 1))
                        onFrameChange(frame)
                    }}
                >
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-200"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onReset}
                    disabled={disabled || !hasFrames}
                    title="Reset"
                >
                    <RotateCcw className="h-3.5 w-3.5" />
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onStepBackward}
                    disabled={disabled || !canStepBackward}
                    title="Step Back"
                >
                    <SkipBack className="h-3.5 w-3.5" />
                </Button>

                <Button
                    size="icon"
                    className="h-10 w-10"
                    onClick={isPlaying ? onPause : onPlay}
                    disabled={disabled || (!hasFrames)}
                    title={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? (
                        <Pause className="h-4 w-4" />
                    ) : (
                        <Play className="h-4 w-4 ml-0.5" />
                    )}
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onStepForward}
                    disabled={disabled || !canStepForward}
                    title="Step Forward"
                >
                    <SkipForward className="h-3.5 w-3.5" />
                </Button>
            </div>

            {/* Speed control */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Speed</span>
                    <span>{SPEED_PRESETS.find((p) => p.value === speed)?.label || "1x"}</span>
                </div>
                <Slider
                    value={[currentSpeedPreset >= 0 ? currentSpeedPreset : 1]}
                    min={0}
                    max={SPEED_PRESETS.length - 1}
                    step={1}
                    onValueChange={([val]) => onSpeedChange(SPEED_PRESETS[val].value)}
                    disabled={disabled}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                    {SPEED_PRESETS.map((preset) => (
                        <span key={preset.label}>{preset.label}</span>
                    ))}
                </div>
            </div>

            {/* Completion indicator */}
            {isComplete && (
                <div className="text-center text-xs text-green-600 dark:text-green-400 font-medium">
                    ✓ Animation complete
                </div>
            )}
        </div>
    )
}
