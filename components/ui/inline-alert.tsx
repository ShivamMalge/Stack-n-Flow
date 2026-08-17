"use client"

import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface InlineAlertProps {
    /** Message to show. Renders nothing when null or empty. */
    message: string | null
    className?: string
}

/**
 * Inline validation message for the visualizers.
 *
 * Replaces `window.alert()`, which blocks the page, cannot be styled or
 * dismissed, is unreadable to screen-reader users in context, and makes the
 * component impossible to assert on in tests.
 */
export default function InlineAlert({ message, className = "" }: InlineAlertProps) {
    if (!message) return null

    return (
        <Alert variant="destructive" className={`py-2 ${className}`.trim()}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
        </Alert>
    )
}
