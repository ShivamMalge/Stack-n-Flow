import NextAuth, { DefaultSession } from "next-auth"

// Extend NextAuth types to include our custom Prisma User fields
declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: "STUDENT" | "PROFESSOR" | "USER" | null
            onboardingCompleted: boolean
        } & DefaultSession["user"]
    }

    interface User {
        id: string
        role: "STUDENT" | "PROFESSOR" | "USER" | null
        onboardingCompleted: boolean
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: "STUDENT" | "PROFESSOR" | "USER" | null
        onboardingCompleted: boolean
    }
}
