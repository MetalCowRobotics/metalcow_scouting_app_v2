import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { ArrowRight, BarChart2, ClipboardList, Database } from 'lucide-react'

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center space-y-8 bg-gradient-to-b from-background to-muted/20">

            <div className="space-y-4 max-w-2xl animate-in slide-in-from-bottom-8 fade-in duration-700">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Metal Cow Scouting
                </h1>
                <p className="text-xl text-muted-foreground">
                    Advanced robotics scouting and analytics platform. Track matches, analyze performance, and dominate the competition.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 w-full max-w-4xl animate-in slide-in-from-bottom-8 fade-in delay-200 duration-700 fill-mode-backwards">

                <Link href="/scout/match" className="group">
                    <div className="h-full p-6 border rounded-xl hover:border-primary hover:shadow-lg transition-all bg-card">
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                            <ClipboardList className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Match Scouting</h3>
                        <p className="text-muted-foreground text-sm">Log match data via multi-step wizard. Track auto, teleop, and endgame.</p>
                    </div>
                </Link>

                <Link href="/scout/pit" className="group">
                    <div className="h-full p-6 border rounded-xl hover:border-orange-500 hover:shadow-lg transition-all bg-card">
                        <div className="h-12 w-12 bg-orange-500/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                            <Database className="h-6 w-6 text-orange-600" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Pit Data</h3>
                        <p className="text-muted-foreground text-sm">View robot specifications, drivetrain types, and capabilities.</p>
                    </div>
                </Link>

                <Link href="/analytics" className="group">
                    <div className="h-full p-6 border rounded-xl hover:border-green-500 hover:shadow-lg transition-all bg-card">
                        <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                            <BarChart2 className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Analytics</h3>
                        <p className="text-muted-foreground text-sm">Analyze team performance, climb rates, and defensive metrics.</p>
                    </div>
                </Link>

            </div>

            <div className="pt-8">
                <Link href="/scout/match" className={buttonVariants({ size: "lg" })}>
                    Start Scouting <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
            </div>

        </div>
    )
}