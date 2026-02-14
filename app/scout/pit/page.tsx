'use client'

import PitScoutingForm from '@/components/scouting/PitScoutingForm'

export default function PitScoutingPage() {
    return (
        <div className="container py-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center">Pit Scouting</h1>
            <PitScoutingForm />
        </div>
    )
}
