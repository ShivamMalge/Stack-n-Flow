import { z } from "zod"

export const onboardingSchema = z.discriminatedUnion("role", [
    z.object({
        role: z.literal("STUDENT"),
        institution: z.string().min(2, "Institution name is required"),
        // `usn` is a unique column, so an unconstrained string lets a user claim
        // arbitrary values. Institution-specific formats belong in config (see
        // fixes_phases.md Phase 2); this is the charset/length floor.
        usn: z
            .string()
            .trim()
            .toUpperCase()
            .regex(
                /^[A-Z0-9]{4,20}$/,
                "USN must be 4–20 letters and digits with no spaces, e.g. 1AT23CD001"
            ),
        department: z.string().min(2, "Department is required"),
        semester: z.coerce.number().min(1, "Semester must be at least 1").max(10, "Invalid semester"),
        branch: z.string().min(2, "Branch is required"),
    }),
    z.object({
        role: z.literal("PROFESSOR"),
        institution: z.string().min(2, "Institution name is required"),
        designation: z.string().min(2, "Designation is required"),
    }),
    z.object({
        role: z.literal("USER"),
    }),
])

export type OnboardingData = z.infer<typeof onboardingSchema>
