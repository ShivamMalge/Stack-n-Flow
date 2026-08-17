import type { Metadata } from "next"

// The page itself is a client component and cannot export metadata, so it lives here.
export const metadata: Metadata = {
    title: "Operations | Stack'n'Flow",
    description: "Perform operations on data structures and see the results in real time",
}

export default function OperationsLayout({ children }: { children: React.ReactNode }) {
    return children
}
