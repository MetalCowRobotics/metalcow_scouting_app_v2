'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { getUserPermissions, UserPermissions as Perms } from '@/lib/admin'

interface PermissionsContextType {
    permissions: Perms | null
    loading: boolean
    refreshPermissions: () => Promise<void>
}

const defaultPermissions: Perms = {
    role: 'viewer',
    can_scout: false,
    can_view_analytics: true,
    can_manage_data: false,
    can_manage_users: false
}

const PermissionsContext = createContext<PermissionsContextType>({
    permissions: null,
    loading: true,
    refreshPermissions: async () => {}
})

export function PermissionsProvider({ children }: { children: ReactNode }) {
    const [permissions, setPermissions] = useState<Perms | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchPermissions = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
            setPermissions(defaultPermissions)
            setLoading(false)
            return
        }

        const perms = await getUserPermissions(session.user.email || undefined, session.user.id)
        setPermissions(perms)
        setLoading(false)
    }

    useEffect(() => {
        fetchPermissions()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchPermissions()
        })

        return () => subscription.unsubscribe()
    }, [])

    return (
        <PermissionsContext.Provider value={{ permissions, loading, refreshPermissions: fetchPermissions }}>
            {children}
        </PermissionsContext.Provider>
    )
}

export function usePermissions() {
    const context = useContext(PermissionsContext)
    if (context === undefined) {
        throw new Error('usePermissions must be used within a PermissionsProvider')
    }
    return context
}
