import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { ArrowRight, BarChart2, ClipboardList, Database, Users, Trophy, Settings } from 'lucide-react'

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center space-y-8 bg-gradient-to-b from-background to-muted/20">

            <div className="space-y-4 max-w-2xl animate-in slide-in-from-bottom-8 fade-in duration-700">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl bg-gradient-to-r from-primary dark:to-white to-black bg-clip-text text-transparent">
                    Metal Cow Scouting
                </h1>
                <p className="text-xl text-muted-foreground">
                    Advanced robotics scouting and analytics platform. Track matches, analyze performance, and dominate the competition.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 w-full max-w-5xl animate-in slide-in-from-bottom-8 fade-in delay-200 duration-700 fill-mode-backwards">

                <Link href="/scout/match" className="group">
                    <div className="h-full p-6 border rounded-xl hover:border-primary hover:shadow-lg transition-all bg-card text-left">
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                            <ClipboardList className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Match Scouting</h3>
                        <p className="text-muted-foreground text-sm mb-3">Log match data via multi-step wizard with real-time validation.</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Autonomous period tracking (mobility, scoring)</li>
                            <li>• Teleoperated scoring (notes, fouls)</li>
                            <li>• Endgame actions (climb, trap)</li>
                            <li>• QR code generation for quick entry</li>
                        </ul>
                    </div>
                </Link>

                <Link href="/scout/pit" className="group">
                    <div className="h-full p-6 border rounded-xl hover:border-orange-500 hover:shadow-lg transition-all bg-card text-left">
                        <div className="h-12 w-12 bg-orange-500/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                            <ClipboardList className="h-6 w-6 text-orange-600" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Pit Scouting</h3>
                        <p className="text-muted-foreground text-sm mb-3">Capture robot specifications and team capabilities.</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Drivetrain type & motor configuration</li>
                            <li>• Sensor suite (vision, encoders)</li>
                            <li>• Scoring mechanism details</li>
                            <li>• Team contacts & notes</li>
                        </ul>
                    </div>
                </Link>

                <Link href="/analytics" className="group">
                    <div className="h-full p-6 border rounded-xl hover:border-green-500 hover:shadow-lg transition-all bg-card text-left">
                        <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                            <BarChart2 className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Analytics</h3>
                        <p className="text-muted-foreground text-sm mb-3">Powerful dashboards to analyze team performance.</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Ranking predictions & OPR calculations</li>
                            <li>• Climb success rates by alliance</li>
                            <li>• Defensive impact scoring</li>
                            <li>• Match timeline visualizations</li>
                        </ul>
                    </div>
                </Link>

                <Link href="/tba" className="group">
                    <div className="h-full p-6 border rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all bg-card text-left">
                        <div className="h-12 w-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                            <Trophy className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">The Blue Alliance</h3>
                        <p className="text-muted-foreground text-sm mb-3">Integration with the premier FMS data provider.</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Official match results sync</li>
                            <li>• Event schedules & rankings</li>
                            <li>• Team event history</li>
                            <li>• Live score updates</li>
                        </ul>
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