'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
    children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const [loading, setLoading] = useState(true)
    const [authenticated, setAuthenticated] = useState(false)
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                router.push(`/login?redirect=${pathname}`)
                return
            }

            setAuthenticated(true)
            setLoading(false)
        }

        checkUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                router.push(`/login?redirect=${pathname}`)
            } else {
                setAuthenticated(true)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [router, pathname, supabase])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                <div className="text-muted-foreground font-bold animate-pulse text-lg uppercase tracking-widest">
                    Securing Access...
                </div>
            </div>
        )
    }

    if (!authenticated) return null

    return <>{children}</>
}
