'use client'

import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import { usePermissions } from '@/contexts/PermissionsContext'
import { Loader2, Lock } from 'lucide-react'

export default function AnalyticsPage() {
    const { permissions, loading } = usePermissions()

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!permissions?.can_view_analytics) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] space-y-4">
                <Lock className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground font-medium">You don&apos;t have permission to view analytics.</p>
            </div>
        )
    }

    return (
        <div className="container py-8 mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center">Analytics Dashboard</h1>
            <AnalyticsDashboard />
        </div>
    )
}
