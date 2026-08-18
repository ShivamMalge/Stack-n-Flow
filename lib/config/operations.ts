/**
 * Tab ids for /operations.
 *
 * Kept out of the page module because Next.js forbids named exports from a
 * page, and the syllabus map needs these to deep-link at a specific set.
 */
export const OPERATION_TABS = [
    "array",
    "linkedList",
    "stack",
    "queue",
    "tree",
    "graph",
    "polynomial",
] as const

export type OperationTab = (typeof OPERATION_TABS)[number]

export function isOperationTab(value: string): value is OperationTab {
    return (OPERATION_TABS as readonly string[]).includes(value)
}

/** Route that opens /operations at a given set. */
export function operationsHref(tab: OperationTab): string {
    return `/operations?tab=${tab}`
}
