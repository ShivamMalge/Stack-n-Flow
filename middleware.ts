import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token
        const path = req.nextUrl.pathname

        // If the user is NOT logged in, withAuth will auto-redirect to the login page
        // (configured via the `pages` option below)

        // If the user logs in but has not completed onboarding, lock them to the onboarding page
        if (token && !token.onboardingCompleted && !path.startsWith("/onboarding")) {
            return NextResponse.redirect(new URL("/onboarding", req.url))
        }

        // If they have completed onboarding, don't let them go back to the onboarding page
        if (token && token.onboardingCompleted && path.startsWith("/onboarding")) {
            return NextResponse.redirect(new URL("/", req.url))
        }
    },
    {
        callbacks: {
            // Return true only if the user has a valid token (is logged in)
            // If false, withAuth auto-redirects to the signIn page
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/login",
        },
    }
)

export const config = {
    // Protect ALL feature routes — unauthenticated users are redirected to /login
    matcher: [
        "/visualize/:path*",
        "/learn/:path*",
        "/operations/:path*",
        "/onboarding",
    ],
}
