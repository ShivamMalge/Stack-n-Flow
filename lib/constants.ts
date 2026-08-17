/**
 * Shared values for the visualizers.
 *
 * These were previously literals repeated across the component tree — the input
 * ceiling appeared in ten files, and two different speed ladders existed for the
 * same control — so changing one meant finding all of them.
 */

/** Largest value a visualizer will accept, chosen so nodes stay readable. */
export const MAX_INPUT_VALUE = 500

/**
 * Negative keys are valid in most of these structures, so the default lower
 * bound mirrors the upper one. Call sites that genuinely need a positive count
 * (array sizes, element counts) pass `{ min: 1 }` explicitly.
 */
export const MIN_INPUT_VALUE = -MAX_INPUT_VALUE

export const MAX_INPUT_MESSAGE = `Please enter a whole number between ${MIN_INPUT_VALUE} and ${MAX_INPUT_VALUE}`

/** Matches Tailwind's `md` breakpoint. */
export const MOBILE_BREAKPOINT = 768

/** Frame delay in milliseconds. Lower is faster. */
export const DEFAULT_SPEED = 800

export const SPEED_PRESETS = [
    { label: "0.5×", value: 1600 },
    { label: "1×", value: DEFAULT_SPEED },
    { label: "1.5×", value: 533 },
    { label: "2×", value: 400 },
    { label: "3×", value: 267 },
] as const

interface ParseBoundedIntOptions {
    min?: number
    max?: number
}

/**
 * Parses user input into an integer within bounds, or returns null.
 *
 * Call sites used to do `Number.parseInt(raw)` and then test `value > MAX`.
 * `NaN > 500` is false, so non-numeric input passed validation and was inserted
 * into the structure. Returning null forces callers to handle that case.
 */
export function parseBoundedInt(
    raw: string,
    { min = MIN_INPUT_VALUE, max = MAX_INPUT_VALUE }: ParseBoundedIntOptions = {}
): number | null {
    const trimmed = raw.trim()
    if (trimmed === "") return null

    const value = Number(trimmed)
    if (!Number.isFinite(value) || !Number.isInteger(value)) return null
    if (value < min || value > max) return null

    return value
}
