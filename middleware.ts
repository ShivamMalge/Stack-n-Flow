import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { ONBOARDING_ROUTE, SIGN_IN_ROUTE, isPublicRoute } from "@/lib/routes"

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token
        const path = req.nextUrl.pathname

        // If the user is NOT logged in, withAuth will auto-redirect to the login page
        // (configured via the `pages` option below)

        // If the user logs in but has not completed onboarding, lock them to the onboarding page
        if (token && !token.onboardingCompleted && !path.startsWith(ONBOARDING_ROUTE)) {
            return NextResponse.redirect(new URL(ONBOARDING_ROUTE, req.url))
        }

        // If they have completed onboarding, don't let them go back to the onboarding page
        if (token && token.onboardingCompleted && path.startsWith(ONBOARDING_ROUTE)) {
            return NextResponse.redirect(new URL("/", req.url))
        }
    },
    {
        callbacks: {
            // Deny by default: a route is private unless it is listed in PUBLIC_ROUTES.
            // If false, withAuth auto-redirects to the signIn page.
            authorized: ({ token, req }) =>
                isPublicRoute(req.nextUrl.pathname) || !!token,
        },
        pages: {
            signIn: SIGN_IN_ROUTE,
        },
    }
)

export const config = {
    // Run on everything except the auth API, Next internals, and static files.
    // Public pages still pass through here so signed-in users with incomplete
    // onboarding are redirected consistently; the allowlist lives in lib/routes.ts.
    matcher: [
        "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
}
