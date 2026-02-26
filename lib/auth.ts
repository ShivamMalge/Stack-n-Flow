import { PrismaAdapter } from "@auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import prisma from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Intial sign in
            if (user) {
                token.id = user.id
                token.role = user.role
                token.onboardingCompleted = user.onboardingCompleted
            }

            // If we manually update the session (e.g. after onboarding)
            if (trigger === "update" && session) {
                token.role = session.role
                token.onboardingCompleted = session.onboardingCompleted
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
        signIn: "/login",
        newUser: "/onboarding",
    },
    secret: process.env.NEXTAUTH_SECRET,
}
