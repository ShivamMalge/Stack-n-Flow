import { z } from "zod"

/**
 * Server-side environment contract.
 *
 * These values were previously read with non-null assertions (`process.env.X!`),
 * so a missing variable started the app with `undefined` credentials and failed
 * later with an opaque OAuth or database error. Validating here turns that into
 * a single readable failure at startup.
 *
 * Set SKIP_ENV_VALIDATION=1 for builds that run without secrets (CI, Docker
 * image builds); runtime still validates.
 */
const serverEnvSchema = z.object({
    DATABASE_URL: z.string().min(1, "required — PostgreSQL connection string"),
    GOOGLE_CLIENT_ID: z.string().min(1, "required — from Google Cloud Console"),
    GOOGLE_CLIENT_SECRET: z.string().min(1, "required — from Google Cloud Console"),
    NEXTAUTH_SECRET: z.string().min(1, "required — generate with `openssl rand -base64 32`"),
    // Optional: Vercel and other hosts infer the deployment URL automatically.
    NEXTAUTH_URL: z.string().url("must be a full URL, e.g. http://localhost:3000").optional(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

function loadEnv(): ServerEnv {
    if (process.env.SKIP_ENV_VALIDATION) {
        return process.env as unknown as ServerEnv
    }

    const parsed = serverEnvSchema.safeParse(process.env)

    if (!parsed.success) {
        const details = parsed.error.issues
            .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
            .join("\n")

        throw new Error(
            `Invalid environment configuration:\n${details}\n\n` +
            `Copy .env.example to .env.local and fill in the missing values.`
        )
    }

    return parsed.data
}

export const env = loadEnv()
