"use client"

import { useState, useRef, useCallback, useEffect } from "react"

export interface AnimationFrame<T> {
    /** The full state snapshot at this frame */
    snapshot: T
    /** Description of what happened at this step */
    description: string
}

export interface AnimationPlayerState<T> {
    currentFrame: number
    totalFrames: number
    isPlaying: boolean
    isPaused: boolean
    isComplete: boolean
    speed: number
    currentSnapshot: T | null
    currentDescription: string
}

export interface AnimationPlayerControls<T> extends AnimationPlayerState<T> {
    /** Load a new set of animation frames */
    loadFrames: (frames: AnimationFrame<T>[]) => void
    /** Start or resume auto-play */
    play: () => void
    /** Pause auto-play */
    pause: () => void
    /** Advance one frame */
    stepForward: () => void
    /** Go back one frame */
    stepBackward: () => void
    /** Jump to a specific frame */
    goToFrame: (frame: number) => void
    /** Reset to frame 0 */
    reset: () => void
    /** Set playback speed in ms per frame */
    setSpeed: (ms: number) => void
    /** Clear all frames and reset */
    clear: () => void
}

const DEFAULT_SPEED = 800

export function useAnimationPlayer<T>(
    onFrameChange?: (snapshot: T, frameIndex: number) => void
): AnimationPlayerControls<T> {
    const [frames, setFrames] = useState<AnimationFrame<T>[]>([])
    const [currentFrame, setCurrentFrame] = useState(-1)
    const [isPlaying, setIsPlaying] = useState(false)
    const [speed, setSpeedState] = useState(DEFAULT_SPEED)

    const framesRef = useRef<AnimationFrame<T>[]>([])
    const currentFrameRef = useRef(-1)
    const isPlayingRef = useRef(false)
    const speedRef = useRef(DEFAULT_SPEED)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const isMountedRef = useRef(true)

    // Keep refs in sync
    useEffect(() => {
        framesRef.current = frames
    }, [frames])

    useEffect(() => {
        currentFrameRef.current = currentFrame
    }, [currentFrame])

    useEffect(() => {
        isPlayingRef.current = isPlaying
    }, [isPlaying])

    useEffect(() => {
        speedRef.current = speed
    }, [speed])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [])

    const applyFrame = useCallback(
        (frameIndex: number) => {
            const frame = framesRef.current[frameIndex]
            if (frame && onFrameChange) {
                onFrameChange(frame.snapshot, frameIndex)
            }
        },
        [onFrameChange]
    )

    const scheduleNext = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current)

        timerRef.current = setTimeout(() => {
            if (!isMountedRef.current || !isPlayingRef.current) return

            const nextFrame = currentFrameRef.current + 1
            if (nextFrame < framesRef.current.length) {
                setCurrentFrame(nextFrame)
                applyFrame(nextFrame)
                scheduleNext()
            } else {
                // Animation complete
                setIsPlaying(false)
            }
        }, speedRef.current)
    }, [applyFrame])

    const loadFrames = useCallback((newFrames: AnimationFrame<T>[]) => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setFrames(newFrames)
        framesRef.current = newFrames
        setCurrentFrame(-1)
        currentFrameRef.current = -1
        setIsPlaying(false)
        isPlayingRef.current = false
    }, [])

    const play = useCallback(() => {
        if (framesRef.current.length === 0) return

        // If complete, restart from beginning
        if (currentFrameRef.current >= framesRef.current.length - 1) {
            setCurrentFrame(-1)
            currentFrameRef.current = -1
        }

        setIsPlaying(true)
        isPlayingRef.current = true
        scheduleNext()
    }, [scheduleNext])

    const pause = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setIsPlaying(false)
        isPlayingRef.current = false
    }, [])

    const stepForward = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setIsPlaying(false)
        isPlayingRef.current = false

        const nextFrame = currentFrameRef.current + 1
        if (nextFrame < framesRef.current.length) {
            setCurrentFrame(nextFrame)
            currentFrameRef.current = nextFrame
            applyFrame(nextFrame)
        }
    }, [applyFrame])

    const stepBackward = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setIsPlaying(false)
        isPlayingRef.current = false

        const prevFrame = currentFrameRef.current - 1
        if (prevFrame >= 0) {
            setCurrentFrame(prevFrame)
            currentFrameRef.current = prevFrame
            applyFrame(prevFrame)
        } else if (currentFrameRef.current === 0) {
            // Go back to initial state (before any animation)
            setCurrentFrame(-1)
            currentFrameRef.current = -1
            // Apply frame -1 means restore the initial snapshot if available
            if (onFrameChange && framesRef.current.length > 0) {
                // Signal to go back to pre-animation state — we use a special frame index of -1
            }
        }
    }, [applyFrame, onFrameChange])

    const goToFrame = useCallback(
        (frame: number) => {
            if (timerRef.current) clearTimeout(timerRef.current)
            setIsPlaying(false)
            isPlayingRef.current = false

            const targetFrame = Math.max(-1, Math.min(frame, framesRef.current.length - 1))
            setCurrentFrame(targetFrame)
            currentFrameRef.current = targetFrame
            if (targetFrame >= 0) {
                applyFrame(targetFrame)
            }
        },
        [applyFrame]
    )

    const reset = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setIsPlaying(false)
        isPlayingRef.current = false
        setCurrentFrame(-1)
        currentFrameRef.current = -1
    }, [])

    const setSpeed = useCallback((ms: number) => {
        setSpeedState(ms)
        speedRef.current = ms
    }, [])

    const clear = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setFrames([])
        framesRef.current = []
        setCurrentFrame(-1)
        currentFrameRef.current = -1
        setIsPlaying(false)
        isPlayingRef.current = false
    }, [])

    const totalFrames = frames.length
    const isPaused = !isPlaying && currentFrame >= 0 && currentFrame < totalFrames - 1
    const isComplete = currentFrame >= totalFrames - 1 && totalFrames > 0
    const currentSnapshot = currentFrame >= 0 && currentFrame < totalFrames ? frames[currentFrame].snapshot : null
    const currentDescription =
        currentFrame >= 0 && currentFrame < totalFrames ? frames[currentFrame].description : ""

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
