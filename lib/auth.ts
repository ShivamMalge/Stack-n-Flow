import { PrismaAdapter } from "@auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import prisma from "@/lib/prisma"
import { env } from "@/lib/env"
import { ONBOARDING_ROUTE, SIGN_IN_ROUTE } from "@/lib/routes"

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user, trigger }) {
            // Intial sign in
            if (user) {
                token.id = user.id
                token.role = user.role
                token.onboardingCompleted = user.onboardingCompleted
            }

            // On a manual session update (e.g. after onboarding) the client sends an
            // arbitrary payload, so it is never trusted here — a caller could otherwise
            // grant itself any role. Re-read the authoritative values from the database.
            if (trigger === "update" && token.id) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { role: true, onboardingCompleted: true },
                })

                if (dbUser) {
                    token.role = dbUser.role
                    token.onboardingCompleted = dbUser.onboardingCompleted
                }
            }

            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string
                session.user.role = token.role as "STUDENT" | "PROFESSOR" | "USER" | null
                session.user.onboardingCompleted = token.onboardingCompleted as boolean
            }
            return session
        },
    },
    pages: {
        signIn: SIGN_IN_ROUTE,
        newUser: ONBOARDING_ROUTE,
    },
    secret: env.NEXTAUTH_SECRET,
}
