"use server"

import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { onboardingSchema, type OnboardingData } from "@/lib/validations/onboarding"

export async function completeOnboarding(data: OnboardingData) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || !session.user || !session.user.id) {
            return { error: "You must be logged in to complete onboarding." }
        }

        if (session.user.onboardingCompleted) {
            return { error: "You have already completed onboarding." }
        }

        // Validate the incoming data against the strict Zod schema on the backend
        const validatedData = onboardingSchema.parse(data)

        // Begin a Prisma transaction to ensure both operations succeed or fail together
        await prisma.$transaction(async (tx: any) => {

            // 1. Create the specific role profile
            if (validatedData.role === "STUDENT") {
                // Check if USN already exists to avoid Prisma unique constraint crashes
                const existingStudent = await tx.studentProfile.findUnique({
                    where: { usn: validatedData.usn },
                })

                if (existingStudent) {
                    throw new Error("This USN is already registered to an account.")
                }

                await tx.studentProfile.create({
                    data: {
                        userId: session.user.id,
                        institution: validatedData.institution,
                        usn: validatedData.usn,
                        department: validatedData.department,
                        semester: validatedData.semester,
                        branch: validatedData.branch,
                    }
                })
            } else if (validatedData.role === "PROFESSOR") {
                await tx.professorProfile.create({
                    data: {
                        userId: session.user.id,
                        institution: validatedData.institution,
                        designation: validatedData.designation,
                    }
                })
            } // If 'USER', we don't need a specific profile row, just update the main User table

            // 2. Update the core User table with their Role and flip the onboarding flag
            await tx.user.update({
                where: { id: session.user.id },
                data: {
                    role: validatedData.role,
                    onboardingCompleted: true
                }
            })
        })

        return { success: true }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { error: "Invalid form data provided." }
        }
        if (error instanceof Error && error.message === "This USN is already registered to an account.") {
            return { error: error.message }
        }
        console.error("Onboarding Error:", error)
        return { error: "An unexpected error occurred during onboarding." }
    }
}
