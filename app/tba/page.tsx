'use client'

import TBAExplorer from '@/components/tba/TBAExplorer'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function TBAPage() {
    return (
        <div className="container py-8 max-w-6xl mx-auto">
            <div className="mb-10 text-center">
                <h1 className="text-5xl font-black tracking-tighter mb-2">TBA Data Discovery</h1>
                <p className="text-muted-foreground font-bold">Search official competition intel from The Blue Alliance</p>
            </div>
            <TBAExplorer />
        </div>
    )
}
