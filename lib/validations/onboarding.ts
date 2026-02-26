import { z } from "zod"

export const onboardingSchema = z.discriminatedUnion("role", [
    z.object({
        role: z.literal("STUDENT"),
        institution: z.string().min(2, "Institution name is required"),
        usn: z.string().min(4, "USN must be at least 4 characters").max(20, "USN is too long"),
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
