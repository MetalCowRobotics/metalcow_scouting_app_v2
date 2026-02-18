'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { usePermissions } from '@/contexts/PermissionsContext'
import { Loader2, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ScoutLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { permissions, loading } = usePermissions()
    const router = useRouter()
    const [sessionLoading, setSessionLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
            } else {
                setSessionLoading(false)
            }
        }
        checkSession()
    }, [router, supabase])

    if (loading || sessionLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!permissions?.can_scout) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] space-y-4">
                <Lock className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground font-medium">You don&apos;t have permission to access scouting forms.</p>
            </div>
        )
    }

    return <ProtectedRoute>{children}</ProtectedRoute>
}
