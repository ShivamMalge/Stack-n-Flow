/**
 * Institution registry.
 *
 * The onboarding form used to special-case one college inline: its name variants
 * were compared in a `useEffect`, and its USN prefix, field length and format
 * hint were literals repeated across the JSX. Adding a second college meant
 * editing the component. Each entry here is now pure data.
 */

export interface UsnFormat {
    /** Fixed leading segment every USN at this institution shares, e.g. "1AT". */
    prefix: string
    /** Maximum characters the user types after the prefix. */
    suffixLength: number
    /** Example suffix, shown as the input placeholder. */
    suffixPlaceholder: string
    /** Human-readable format description shown under the field. */
    hint: string
}

export interface Institution {
    id: string
    name: string
    /** Full normalised names or abbreviations that identify this institution exactly. */
    aliases: string[]
    /** Substrings that identify it within a longer name the user typed. */
    matchPhrases: string[]
    usn: UsnFormat
}

export const INSTITUTIONS: Institution[] = [
    {
        id: "ait",
        name: "Atria Institute of Technology",
        aliases: ["ait", "atria", "atria institute of technology"],
        matchPhrases: ["atria institute"],
        usn: {
            prefix: "1AT",
            suffixLength: 7,
            suffixPlaceholder: "23CD048",
            hint: "Format: 1AT + Year(23/24/25) + Branch(CD/CS/IS) + Number(001-999)",
        },
    },
]

/** Generic placeholder for institutions with no registered USN format. */
export const DEFAULT_USN_PLACEHOLDER = "e.g. 1RV21CS001"

/**
 * Resolves free-text institution input to a registered institution, or null when
 * it is not one we know a USN format for.
 */
export function findInstitution(input: string | undefined | null): Institution | null {
    if (!input) return null

    const normalized = input.trim().toLowerCase()
    if (normalized === "") return null

    return (
        INSTITUTIONS.find(
            (institution) =>
                institution.aliases.includes(normalized) ||
                institution.matchPhrases.some((phrase) => normalized.includes(phrase))
        ) ?? null
    )
}
