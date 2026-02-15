'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'
import { Loader2 } from 'lucide-react'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true)
    const [authorized, setAuthorized] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                router.push('/login?redirect=/admin')
                return
            }

            if (!isAdmin(session.user.email)) {
                router.push('/') // Redirect non-admins to home
                return
            }

            setAuthorized(true)
            setLoading(false)
        }

        checkAdmin()
    }, [router, supabase])

    if (loading) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return authorized ? <>{children}</> : null
}
