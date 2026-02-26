"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, Briefcase, User } from "lucide-react"
import { onboardingSchema, type OnboardingData } from "@/lib/validations/onboarding"
import { completeOnboarding } from "@/app/actions/onboarding"

type Role = "STUDENT" | "PROFESSOR" | "USER"

export default function OnboardingPage() {
    const router = useRouter()
    const { update } = useSession() // Call this after onboarding to refresh the local NextAuth token

    const [step, setStep] = useState<1 | 2>(1)
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isAIT, setIsAIT] = useState(false)

    const form = useForm<OnboardingData>({
        resolver: zodResolver(onboardingSchema) as any,
        defaultValues: { role: "STUDENT", semester: 1 } as any,
    })

    // When step 1 is completed
    const handleRoleSelection = (role: Role) => {
        setSelectedRole(role)
        form.setValue("role", role as any)

        // If they just selected 'USER', they don't have a profile form. Finish immediately.
        if (role === "USER") {
            submitForm({ role: "USER" })
        } else {
            setStep(2)
        }
    }

    const submitForm = async (data: any) => {
        setIsSubmitting(true)
        setError(null)

        const result = await completeOnboarding(data)

        if (result.error) {
            setError(result.error)
            setIsSubmitting(false)
            return
        }

        // Force NextAuth to pull the new 'onboardingCompleted' token from the server
        await update()

        // Redirect to the dashboard
        router.push("/")
        router.refresh()
    }

    const errors = form.formState.errors as any

    // Watch institution field to detect AIT
    const institutionValue = form.watch("institution" as any) as string | undefined
    useEffect(() => {
        if (!institutionValue) { setIsAIT(false); return }
        const normalized = institutionValue.trim().toLowerCase()
        const isAitMatch = normalized === "ait" ||
            normalized === "atria institute of technology" ||
            normalized === "atria" ||
            normalized.includes("atria institute")
        setIsAIT(isAitMatch)

        if (isAitMatch) {
            const currentUsn = (form.getValues("usn" as any) || "") as string
            // If the USN doesn't already start with 1AT, set it
            if (!currentUsn.toUpperCase().startsWith("1AT")) {
                form.setValue("usn" as any, "1AT")
            }
        }
    }, [institutionValue, form])

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-xl shadow-xl">
                <CardHeader className="text-center space-y-2 pb-6">
                    <CardTitle className="text-3xl font-bold tracking-tight">Complete your profile</CardTitle>
                    <CardDescription className="text-base">
                        {step === 1 ? "How do you plan to use Stack'n'Flow?" : "Tell us a bit more about yourself"}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {error && (
                        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-6 border border-destructive/20 text-center">
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={() => handleRoleSelection("STUDENT")}
                                className="flex flex-col items-center justify-center p-6 border-2 border-muted rounded-xl hover:border-primary hover:bg-primary/5 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                    <GraduationCap className="h-6 w-6" />
                                </div>
                                <h3 className="font-semibold text-lg">Student</h3>
                                <p className="text-sm text-muted-foreground text-center mt-2">I am learning algorithms and data structures.</p>
                            </button>

                            <button
                                onClick={() => handleRoleSelection("PROFESSOR")}
                                className="flex flex-col items-center justify-center p-6 border-2 border-muted rounded-xl hover:border-primary hover:bg-primary/5 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                    <Briefcase className="h-6 w-6" />
                                </div>
                                <h3 className="font-semibold text-lg">Professor</h3>
                                <p className="text-sm text-muted-foreground text-center mt-2">I am teaching using interactive visualizers.</p>
                            </button>

                            <button
                                onClick={() => handleRoleSelection("USER")}
                                className="flex flex-col items-center justify-center p-6 border-2 border-muted rounded-xl hover:border-primary hover:bg-primary/5 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                    <User className="h-6 w-6" />
                                </div>
                                <h3 className="font-semibold text-lg">General</h3>
                                <p className="text-sm text-muted-foreground text-center mt-2">I am just exploring the application.</p>
                            </button>
                        </div>
                    )}

                    {step === 2 && selectedRole && (
                        <form onSubmit={form.handleSubmit(submitForm)} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-4 rounded-lg bg-card border p-6">
                                <div className="flex items-center space-x-2 border-b pb-4 mb-4">
                                    {selectedRole === "STUDENT" ? <GraduationCap className="h-5 w-5 text-primary" /> : <Briefcase className="h-5 w-5 text-primary" />}
                                    <h3 className="font-medium text-lg leading-none">
                                        {selectedRole === "STUDENT" ? "Student Profile" : "Professor Profile"}
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="institution">Institution Name</Label>
                                        <Input id="institution" placeholder="e.g. MIT, Stanford, Your University" {...form.register("institution" as any)} />
                                        {errors.institution && <p className="text-xs text-destructive">{errors.institution.message as string}</p>}
                                    </div>

                                    {selectedRole === "STUDENT" && (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="usn">USN (Roll Number)</Label>
                                                    {isAIT ? (
                                                        <div className="flex">
                                                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-muted-foreground text-sm font-mono font-semibold select-none">
                                                                1AT
                                                            </span>
                                                            <Input
                                                                id="usn"
                                                                className="rounded-l-none font-mono uppercase"
                                                                placeholder="23CD048"
                                                                maxLength={7}
                                                                {...form.register("usn" as any, {
                                                                    onChange: (e: any) => {
                                                                        const suffix = e.target.value.replace(/^1AT/i, "").toUpperCase()
                                                                        form.setValue("usn" as any, "1AT" + suffix)
                                                                    }
                                                                })}
                                                                value={((form.watch("usn" as any) || "") as string).replace(/^1AT/i, "")}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <Input id="usn" placeholder="e.g. 1RV21CS001" className="font-mono uppercase" {...form.register("usn" as any)} />
                                                    )}
                                                    {errors.usn && <p className="text-xs text-destructive">{errors.usn.message as string}</p>}
                                                    {isAIT && <p className="text-xs text-muted-foreground">Format: 1AT + Year(23/24/25) + Branch(CD/CS/IS) + Number(001-999)</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="semester">Semester</Label>
                                                    <Input id="semester" type="number" min="1" max="10" placeholder="e.g. 3" {...form.register("semester" as any)} />
                                                    {errors.semester && <p className="text-xs text-destructive">{errors.semester.message as string}</p>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="branch">Branch</Label>
                                                    <Input id="branch" placeholder="e.g. Computer Science" {...form.register("branch" as any)} />
                                                    {errors.branch && <p className="text-xs text-destructive">{errors.branch.message as string}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="department">Department</Label>
                                                    <Input id="department" placeholder="e.g. Engineering" {...form.register("department" as any)} />
                                                    {errors.department && <p className="text-xs text-destructive">{errors.department.message as string}</p>}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {selectedRole === "PROFESSOR" && (
                                        <div className="space-y-2">
                                            <Label htmlFor="designation">Designation</Label>
                                            <Input id="designation" placeholder="e.g. Assistant Professor, Head of Department" {...form.register("designation" as any)} />
                                            {errors.designation && <p className="text-xs text-destructive">{errors.designation.message as string}</p>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex space-x-4 pt-4">
                                <Button type="button" variant="outline" className="w-full" onClick={() => setStep(1)} disabled={isSubmitting}>
                                    Back
                                </Button>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? "Saving..." : "Complete Profile"}
                                </Button>
                            </div>
                        </form>
                    )}

                </CardContent>
            </Card>
        </div>
    )
}
