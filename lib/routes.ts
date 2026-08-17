/**
 * Route constants shared by the middleware and the NextAuth config.
 *
 * Kept free of imports on purpose: the middleware runs on the Edge runtime and
 * cannot pull in `lib/auth.ts`, which depends on Prisma.
 */

export const SIGN_IN_ROUTE = "/login"
export const ONBOARDING_ROUTE = "/onboarding"

/**
 * Routes reachable without signing in. Access is deny-by-default: anything not
 * listed here requires a session, so a new page is protected unless it is
 * deliberately added.
 */
export const PUBLIC_ROUTES: readonly string[] = ["/", SIGN_IN_ROUTE, "/about"]

export function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.includes(pathname)
}
