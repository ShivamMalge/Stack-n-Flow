"use client"

import { useState, useRef, useCallback, useEffect } from "react"

export interface AnimationFrame<T> {
    snapshot: T
    description: string
}

export interface AnimationPlayerControls<T> {
    currentFrame: number
    totalFrames: number
    isPlaying: boolean
    isPaused: boolean
    isComplete: boolean
    speed: number
    currentSnapshot: T | null
    currentDescription: string
    loadFrames: (frames: AnimationFrame<T>[]) => void
    play: () => void
    pause: () => void
    stepForward: () => void
    stepBackward: () => void
    goToFrame: (frame: number) => void
    reset: () => void
    setSpeed: (ms: number) => void
    clear: () => void
}

const DEFAULT_SPEED = 800

export function useAnimationPlayer<T>(
    onFrameChange?: (snapshot: T, frameIndex: number) => void
): AnimationPlayerControls<T> {
    const [currentFrame, setCurrentFrame] = useState(-1)
    const [isPlaying, setIsPlaying] = useState(false)
    const [speed, setSpeedState] = useState(DEFAULT_SPEED)
    const [totalFrames, setTotalFrames] = useState(0)

    // All mutable state in refs for use inside timers
    const framesRef = useRef<AnimationFrame<T>[]>([])
    const currentFrameRef = useRef(-1)
    const isPlayingRef = useRef(false)
    const speedRef = useRef(DEFAULT_SPEED)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const isMountedRef = useRef(false)  // set true inside effect so Strict Mode re-mounts work correctly
    const onFrameChangeRef = useRef(onFrameChange)

    // Keep onFrameChange ref up-to-date without causing re-renders
    useEffect(() => {
        onFrameChangeRef.current = onFrameChange
    })

    useEffect(() => {
        isMountedRef.current = true          // ← crucial: reset on every (re-)mount
        return () => {
            isMountedRef.current = false
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [])

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }, [])

    // Stable function that applies a frame by index
    const applyFrame = useCallback((frameIndex: number) => {
        const frame = framesRef.current[frameIndex]
        if (frame && onFrameChangeRef.current) {
            onFrameChangeRef.current(frame.snapshot, frameIndex)
        }
    }, [])

    // The actual tick function — uses a ref to avoid stale closures in recursive setTimeout
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const tickRef = useRef<() => void>(() => { })
    tickRef.current = () => {
        if (!isMountedRef.current || !isPlayingRef.current) return
        const nextFrame = currentFrameRef.current + 1
        if (nextFrame < framesRef.current.length) {
            currentFrameRef.current = nextFrame
            setCurrentFrame(nextFrame)
            applyFrame(nextFrame)
            timerRef.current = setTimeout(() => tickRef.current?.(), speedRef.current)
        } else {
            isPlayingRef.current = false
            setIsPlaying(false)
            timerRef.current = null
        }
    }

    const loadFrames = useCallback((newFrames: AnimationFrame<T>[]) => {
        stopTimer()
        framesRef.current = newFrames
        currentFrameRef.current = -1
        isPlayingRef.current = false
        setCurrentFrame(-1)
        setIsPlaying(false)
        setTotalFrames(newFrames.length)
    }, [stopTimer])

    const play = useCallback(() => {
        if (framesRef.current.length === 0) return
        stopTimer()

        // If at end, restart
        if (currentFrameRef.current >= framesRef.current.length - 1) {
            currentFrameRef.current = -1
            setCurrentFrame(-1)
        }

        isPlayingRef.current = true
        setIsPlaying(true)
        // Kick off the first tick
        timerRef.current = setTimeout(() => tickRef.current?.(), speedRef.current)
    }, [stopTimer])

    const pause = useCallback(() => {
        stopTimer()
        isPlayingRef.current = false
        setIsPlaying(false)
    }, [stopTimer])

    const stepForward = useCallback(() => {
        stopTimer()
        isPlayingRef.current = false
        setIsPlaying(false)
        const nextFrame = currentFrameRef.current + 1
        if (nextFrame < framesRef.current.length) {
            currentFrameRef.current = nextFrame
            setCurrentFrame(nextFrame)
            applyFrame(nextFrame)
        }
    }, [stopTimer, applyFrame])

    const stepBackward = useCallback(() => {
        stopTimer()
        isPlayingRef.current = false
        setIsPlaying(false)
        const prevFrame = currentFrameRef.current - 1
        if (prevFrame >= 0) {
            currentFrameRef.current = prevFrame
            setCurrentFrame(prevFrame)
            applyFrame(prevFrame)
        } else {
            currentFrameRef.current = -1
            setCurrentFrame(-1)
        }
    }, [stopTimer, applyFrame])

    const goToFrame = useCallback((frame: number) => {
        stopTimer()
        isPlayingRef.current = false
        setIsPlaying(false)
        const target = Math.max(-1, Math.min(frame, framesRef.current.length - 1))
        currentFrameRef.current = target
        setCurrentFrame(target)
        if (target >= 0) applyFrame(target)
    }, [stopTimer, applyFrame])

    const reset = useCallback(() => {
        stopTimer()
        isPlayingRef.current = false
        setIsPlaying(false)
        currentFrameRef.current = -1
        setCurrentFrame(-1)
    }, [stopTimer])

    const setSpeed = useCallback((ms: number) => {
        speedRef.current = ms
        setSpeedState(ms)
    }, [])

    const clear = useCallback(() => {
        stopTimer()
        framesRef.current = []
        currentFrameRef.current = -1
        isPlayingRef.current = false
        setCurrentFrame(-1)
        setIsPlaying(false)
        setTotalFrames(0)
    }, [stopTimer])

    const isComplete = currentFrame >= totalFrames - 1 && totalFrames > 0
    const isPaused = !isPlaying && currentFrame >= 0 && !isComplete
    const currentSnapshot = currentFrame >= 0 && currentFrame < framesRef.current.length
        ? framesRef.current[currentFrame].snapshot
        : null
    const currentDescription = currentFrame >= 0 && currentFrame < framesRef.current.length
        ? framesRef.current[currentFrame].description
        : ""

    return {
        currentFrame,
        totalFrames,
        isPlaying,
        isPaused,
        isComplete,
        speed,
        currentSnapshot,
        currentDescription,
        loadFrames,
        play,
        pause,
        stepForward,
        stepBackward,
        goToFrame,
        reset,
        setSpeed,
        clear,
    }
}
