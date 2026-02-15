'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getTBAData, TBATeam, TBAEvent, TBAMatch } from '@/lib/tba'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Calendar, MapPin, Users, Trophy } from 'lucide-react'

export default function TBAExplorer() {
    const [searchQuery, setSearchQuery] = useState(process.env.NEXT_PUBLIC_DEFAULT_EVENT_KEY || '2026ilpe') // Default event from env
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'teams' | 'matches'>('teams')
    const [event, setEvent] = useState<TBAEvent | null>(null)
    const [teams, setTeams] = useState<TBATeam[]>([])
    const [matches, setMatches] = useState<TBAMatch[]>([])
    const [error, setError] = useState<string | null>(null)

    const fetchData = async () => {
        if (!searchQuery) return
        setLoading(true)
        setError(null)
        try {
            const [eventData, teamsData, matchesData] = await Promise.all([
                getTBAData(`/event/${searchQuery}`),
                getTBAData(`/event/${searchQuery}/teams`),
                getTBAData(`/event/${searchQuery}/matches`)
            ])
            setEvent(eventData)
            setTeams(teamsData.sort((a: TBATeam, b: TBATeam) => a.team_number - b.team_number))
            setMatches(matchesData.sort((a: TBAMatch, b: TBAMatch) => {
                if (a.comp_level !== b.comp_level) {
                    const order: any = { qm: 1, ef: 2, qf: 3, sf: 4, f: 5 }
                    return (order[a.comp_level] || 9) - (order[b.comp_level] || 9)
                }
                return a.match_number - b.match_number
            }))
        } catch (err: any) {
            console.error(err)
            setError('Failed to fetch TBA data. Check the event key or your API key.')
            setEvent(null)
            setTeams([])
            setMatches([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        fetchData()
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <form onSubmit={handleSearch} className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-muted-foreground ml-1">TBA Event Key</label>
                    <div className="relative">
                        <Input
                            placeholder="e.g. 2024ilch, 2023cmpt..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pr-10 h-11"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-50" />
                    </div>
                </form>
                <Button onClick={fetchData} size="lg" disabled={loading} className="h-11 px-8">
                    {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : 'Fetch Data'}
                </Button>
            </div>

            {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20 text-sm flex items-center gap-2">
                    <Trophy className="h-4 w-4" /> {error}
                </div>
            )}

            {event && (
                <Card className="border-none shadow-md overflow-hidden bg-gradient-to-br from-card to-muted/20">
                    <CardHeader className="bg-primary/5 pb-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <div>
                                <CardTitle className="text-2xl font-bold">{event.name}</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="font-mono">{event.key}</Badge>
                                    <MapPin className="h-3 w-3" /> {event.city}, {event.state_prov}, {event.country}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground whitespace-nowrap bg-background/50 p-2 rounded-lg border">
                                <Calendar className="h-4 w-4" />
                                {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="w-full">
                            <div className="flex w-full justify-start h-14 rounded-none border-b bg-muted/30 px-6 gap-6">
                                <button
                                    onClick={() => setActiveTab('teams')}
                                    className={cn(
                                        "inline-flex items-center justify-center gap-2 px-2 h-full text-sm font-medium transition-all border-b-2",
                                        activeTab === 'teams' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Users className="h-4 w-4" /> Teams ({teams.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('matches')}
                                    className={cn(
                                        "inline-flex items-center justify-center gap-2 px-2 h-full text-sm font-medium transition-all border-b-2",
                                        activeTab === 'matches' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Trophy className="h-4 w-4" /> Matches ({matches.length})
                                </button>
                            </div>

                            {activeTab === 'teams' && (
                                <div className="p-6">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                        {teams.map(team => (
                                            <Link key={team.key} href={`/teams/${team.team_number}`}>
                                                <div className="p-4 border-2 rounded-2xl bg-background hover:border-primary hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group text-center">
                                                    <div className="text-2xl font-black text-primary group-hover:scale-110 transition-transform">#{team.team_number}</div>
                                                    <div className="text-[10px] text-muted-foreground font-black truncate uppercase tracking-widest mt-1" title={team.nickname}>
                                                        {team.nickname}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'matches' && (
                                <div className="p-6">
                                    <div className="space-y-3">
                                        {matches.slice(0, 100).map(match => (
                                            <div key={match.key} className="flex items-center border-2 rounded-2xl overflow-hidden h-14 bg-muted/10">
                                                <div className="w-24 bg-muted flex flex-col items-center justify-center text-[10px] font-black uppercase shrink-0 border-r-2 h-full">
                                                    <span className="text-muted-foreground">{match.comp_level}</span>
                                                    <span className="text-lg leading-none">{match.match_number}</span>
                                                </div>
                                                <div className="flex-1 flex px-6 items-center justify-between gap-4">
                                                    <div className="flex gap-4">
                                                        {match.alliances.red.team_keys.map(tk => {
                                                            const num = tk.replace('frc', '')
                                                            return (
                                                                <Link key={tk} href={`/teams/${num}`} className="text-sm font-black text-rose-600 hover:underline underline-offset-4 decoration-2">
                                                                    {num}
                                                                </Link>
                                                            )
                                                        })}
                                                    </div>
                                                    <div className="flex items-center gap-4 bg-background px-4 py-1 rounded-full border-2">
                                                        <span className={`text-lg font-black ${match.winning_alliance === 'red' ? 'text-rose-600' : ''}`}>
                                                            {match.alliances.red.score}
                                                        </span>
                                                        <span className="text-muted-foreground font-black">—</span>
                                                        <span className={`text-lg font-black ${match.winning_alliance === 'blue' ? 'text-blue-600' : ''}`}>
                                                            {match.alliances.blue.score}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-4 justify-end">
                                                        {match.alliances.blue.team_keys.map(tk => {
                                                            const num = tk.replace('frc', '')
                                                            return (
                                                                <Link key={tk} href={`/teams/${num}`} className="text-sm font-black text-blue-600 hover:underline underline-offset-4 decoration-2">
                                                                    {num}
                                                                </Link>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {matches.length > 100 && (
                                            <div className="pt-6 text-center">
                                                <Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest opacity-50">
                                                    Showing first 100 matches
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
