"use client"

import Link from 'next/link'
import { ArrowRight, ChevronDown, ClipboardList, BarChart2, Trophy, Zap, Cpu, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

const floatingIcons = [
    { icon: Zap, delay: '0s', left: '10%', top: '20%' },
    { icon: Cpu, delay: '1s', left: '85%', top: '15%' },
    { icon: Users, delay: '2s', left: '5%', top: '60%' },
    { icon: Trophy, delay: '1.5s', left: '90%', top: '55%' },
]

export default function Home() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <div className="relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/30 via-background to-background" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
            </div>

            {/* Floating icons */}
            {mounted && floatingIcons.map((item, i) => (
                <div
                    key={i}
                    className="absolute text-primary/30 animate-float"
                    style={{
                        left: item.left,
                        top: item.top,
                        animationDelay: item.delay,
                    }}
                >
                    <item.icon className="h-8 w-8 md:h-12 md:w-12" strokeWidth={1.5} />
                </div>
            ))}

            {/* Hero Section */}
            <section className="min-h-[85vh] flex flex-col items-center justify-center px-4 relative">
                {/* Main CTA Button */}
                <div className="relative group mb-8">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary via-green-400 to-primary rounded-full blur-lg opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
                    <Link
                        href="/scout/match"
                        className="relative px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold text-lg flex items-center gap-3 hover:scale-105 transition-transform shadow-lg"
                    >
                        <Zap className="h-5 w-5" />
                        Start Scouting Now
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className={`space-y-6 text-center max-w-3xl transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight">
                        <span className="bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">
                            Metal Cow
                        </span>
                        <br />
                        <span className="text-foreground">Scouting</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                        The ultimate robotics scouting platform. 
                        <span className="text-foreground font-medium"> Capture data. Analyze trends. Win matches.</span>
                    </p>
                </div>

                {/* Stats */}
                <div className={`mt-12 flex flex-wrap justify-center gap-8 md:gap-16 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    {[
                        { label: 'Teams Scouted', value: '500+' },
                        { label: 'Matches Analyzed', value: '10K+' },
                        { label: 'Events Covered', value: '50+' },
                    ].map((stat, i) => (
                        <div key={i} className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <ChevronDown className="h-8 w-8 text-muted-foreground/50" />
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-4 relative">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
                        Everything You Need to <span className="text-primary">Dominate</span>
                    </h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                href: '/scout/match',
                                icon: Trophy,
                                title: 'Match Scouting',
                                desc: 'Log match data with real-time validation and QR quick-entry',
                            },
                            {
                                href: '/scout/pit',
                                icon: ClipboardList,
                                title: 'Pit Scouting',
                                desc: 'Capture robot specs, capabilities, and team contacts',
                            },
                            {
                                href: '/analytics',
                                icon: BarChart2,
                                title: 'Analytics',
                                desc: 'Powerful dashboards with OPR, rankings, and predictions',
                            },
                            {
                                href: '/tba',
                                icon: Trophy,
                                title: 'TBA Integration',
                                desc: 'Official match results and live score updates',
                            },
                        ].map((feature, i) => (
                            <Link
                                key={i}
                                href={feature.href}
                                className="group relative p-6 rounded-2xl border bg-card hover:bg-accent transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                            >
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <feature.icon className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground text-sm">{feature.desc}</p>
                                <ArrowRight className="absolute bottom-4 right-4 h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4 relative">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="relative p-12 rounded-3xl bg-gradient-to-br from-primary/20 via-green-500/10 to-primary/20 border border-primary/30">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Ready to Get Started?
                        </h2>
                        <p className="text-muted-foreground mb-8 text-lg">
                            Join hundreds of teams using Metal Cow Scouting to gain competitive advantage.
                        </p>
                        <Link
                            href="/scout/match"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/30"
                        >
                            Start Scouting
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </section>

            <style jsx global>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
            `}</style>
        </div>
    )
}
