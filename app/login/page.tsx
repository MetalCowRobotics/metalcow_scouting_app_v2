"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { AlertModal } from "@/components/ui/AlertModal"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectPath = searchParams.get('redirect') || '/'
    const supabase = createClient()

    const [alertConfig, setAlertConfig] = useState<{ open: boolean, title: string, message: string }>({
        open: false,
        title: '',
        message: ''
    })

    const showAlert = (title: string, message: string) => {
        setAlertConfig({ open: true, title, message })
    }

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                            full_name: `${firstName} ${lastName}`,
                        }
                    }
                })
                if (error) throw error

                if (data.session) {
                    router.push(redirectPath)
                    router.refresh()
                } else {
                    showAlert("Verification Required", "Check your email for the confirmation link!")
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                router.push(redirectPath)
                router.refresh()
            }
        } catch (error: any) {
            showAlert("Authentication Error", error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
            <Card className="w-full max-w-sm border-2">
                <CardHeader>
                    <CardTitle className="text-2xl font-black">{isSignUp ? "Join the Network" : "Strategic Login"}</CardTitle>
                    <CardDescription className="font-medium">
                        {isSignUp
                            ? "Register your identity to start contributing data."
                            : "Access the scouting command center."}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleAuth}>
                    <CardContent className="space-y-4">
                        {isSignUp && (
                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName" className="font-bold">First Name</Label>
                                        <Input
                                            id="firstName"
                                            placeholder="John"
                                            required
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="h-11 border-2"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName" className="font-bold">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            placeholder="Doe"
                                            required
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="h-11 border-2"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-medium">Your first name will be used to auto-fill scouting reports.</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="font-bold">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-11 border-2"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" title="password" className="font-bold">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-11 border-2"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2 pt-4">
                        <Button className="w-full h-11 font-bold text-lg" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSignUp ? "Sign Up" : "Sign In"}
                        </Button>
                        <Button
                            variant="link"
                            type="button"
                            className="w-full"
                            onClick={() => setIsSignUp(!isSignUp)}
                        >
                            {isSignUp
                                ? "Already have an account? Sign In"
                                : "Don't have an account? Sign Up"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            <AlertModal
                isOpen={alertConfig.open}
                onClose={() => setAlertConfig(prev => ({ ...prev, open: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
            />
        </div>
    )
}
