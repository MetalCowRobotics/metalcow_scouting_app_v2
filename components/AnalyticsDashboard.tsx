'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { getTBAData, TBATeam } from '@/lib/tba'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart3, Activity, Shield, Trophy, Filter, ArrowUpDown, AlertCircle, MapPin, Loader2, Gauge, Weight, ArrowUpCircle, Zap, Target, ScrollText, CheckCircle2, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface HybridTeamStat {
    team_number: number
    nickname?: string
    state_prov?: string
    is_tba_verified?: boolean

    // Pit Data (Specs)
    robot_weight?: number
    fuel_capacity?: number
    top_speed?: number
    theoretical_fps?: number
    primary_role?: string
    climb_level?: number
    climbs_in_auto?: boolean
    obstacle_handling?: string
    drive_train?: string
    pit_comments?: string

    // Match Data (Performance)
    avg_actual_score: number
    actual_fps: number
    avg_defense: number
    climb_success_rate: number
    match_count: number
}

export default function AnalyticsDashboard() {
    const [stats, setStats] = useState<HybridTeamStat[]>([])
    const [loading, setLoading] = useState(true)
    const [eventKey, setEventKey] = useState('2025ilpe')
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'score' | 'fps' | 'defense'>('score')
    const [activeTab, setActiveTab] = useState<'strategy' | 'profiles'>('strategy')

    const supabase = createClient()

    useEffect(() => {
        async function fetchAllData() {
            setLoading(true)
            try {
                // 1. Fetch Supabase Match Data
                const { data: matchData, error: matchError } = await supabase
                    .from('match_scouting')
                    .select('*')
                    .eq('event_key', eventKey)

                // 2. Fetch Supabase Pit Data
                const { data: pitData, error: pitError } = await supabase
                    .from('pit_scouting')
                    .select('*')
                    .eq('event_key', eventKey)

                // 3. Fetch TBA Teams for Event
                let tbaTeams: TBATeam[] = []
                try {
                    tbaTeams = await getTBAData(`/event/${eventKey}/teams`)
                } catch (e) {
                    console.warn('TBA Event fetch failed')
                }

                if (matchError || pitError) throw new Error('Database fetch failed')

                const teamMap = new Map<number, any>()

                // Initialize with TBA teams
                tbaTeams.forEach(t => {
                    teamMap.set(t.team_number, {
                        team_number: t.team_number,
                        nickname: t.nickname,
                        state_prov: t.state_prov,
                        is_tba_verified: true,
                        totalScore: 0,
                        totalMatches: 0,
                        totalDefense: 0,
                        climbs: 0
                    })
                })

                // Merge Match Stats
                matchData?.forEach((match: any) => {
                    const current = teamMap.get(match.team_number) || {
                        team_number: match.team_number,
                        totalScore: 0, totalMatches: 0, totalDefense: 0, climbs: 0
                    }
                    current.totalScore += (match.auto_fuel_scored || 0) + (match.teleop_fuel_scored || 0)
                    current.totalDefense += match.defense_rating || 0
                    current.climbs += (match.auto_climb || match.teleop_descended_from_auto) ? 1 : 0
                    current.totalMatches += 1
                    teamMap.set(match.team_number, current)
                })

                // Merge Pit Stats
                pitData?.forEach((pit: any) => {
                    const current = teamMap.get(pit.team_number) || {
                        team_number: pit.team_number,
                        totalScore: 0, totalMatches: 0, totalDefense: 0, climbs: 0
                    }
                    current.robot_weight = pit.robot_weight
                    current.fuel_capacity = pit.fuel_capacity
                    current.top_speed = pit.top_speed
                    current.theoretical_fps = pit.fuel_per_second
                    current.primary_role = pit.primary_role
                    current.climb_level = pit.climb_level
                    current.climbs_in_auto = pit.climbs_in_auto
                    current.obstacle_handling = pit.obstacle_handling
                    current.drive_train = pit.drive_train_type
                    current.pit_comments = pit.comments
                    teamMap.set(pit.team_number, current)
                })

                // Finalize Array
                const finalized: HybridTeamStat[] = Array.from(teamMap.values()).map(t => ({
                    ...t,
                    avg_actual_score: t.totalMatches > 0 ? t.totalScore / t.totalMatches : 0,
                    actual_fps: t.totalMatches > 0 ? (t.totalScore / t.totalMatches) / 135 : 0, // Approx teleop time
                    avg_defense: t.totalMatches > 0 ? t.totalDefense / t.totalMatches : 0,
                    climb_success_rate: t.totalMatches > 0 ? (t.climbs / t.totalMatches) * 100 : 0,
                    match_count: t.totalMatches
                }))

                setStats(finalized)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchAllData()
    }, [eventKey, supabase])

    const filteredAndSortedStats = useMemo(() => {
        return stats
            .filter(t =>
                t.team_number.toString().includes(searchQuery) ||
                t.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => {
                if (sortBy === 'score') return b.avg_actual_score - a.avg_actual_score
                if (sortBy === 'fps') return b.actual_fps - a.actual_fps
                if (sortBy === 'defense') return b.avg_defense - a.avg_defense
                return 0
            })
    }, [stats, searchQuery, sortBy])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
            <div className="text-muted-foreground font-medium animate-pulse">Calculating rankings...</div>
        </div>
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-card p-8 rounded-3xl border shadow-xl shadow-primary/5">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        <BarChart3 className="h-10 w-10 text-primary" /> Strategy Analytics
                    </h1>
                    <p className="text-muted-foreground text-lg">Cross-referencing Pit Specs with Match Performance</p>
                </div>

                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    {/* View Toggle */}
                    <div className="flex bg-muted p-1 rounded-xl border-2">
                        <button
                            onClick={() => setActiveTab('strategy')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                activeTab === 'strategy' ? "bg-background shadow-md text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Activity className="h-4 w-4" /> Standings
                        </button>
                        <button
                            onClick={() => setActiveTab('profiles')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                activeTab === 'profiles' ? "bg-background shadow-md text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Shield className="h-4 w-4" /> Robot Profiles
                        </button>
                    </div>

                    <div className="relative flex-1 md:w-64">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Team # or Name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-12 bg-muted/50 border-2"
                        />
                    </div>
                </div>
            </div>

            {activeTab === 'strategy' ? (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Top Standings Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {filteredAndSortedStats.slice(0, 3).map((team, idx) => (
                            <Card key={team.team_number} className="relative overflow-hidden border-2 border-primary/20 shadow-lg hover:border-primary transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Trophy className="h-20 w-20" />
                                </div>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <Badge variant="outline" className="font-mono text-xl py-1 px-4 border-2 border-primary text-primary">#{team.team_number}</Badge>
                                        <div className="text-4xl font-black text-primary/20">#{idx + 1}</div>
                                    </div>
                                    <CardTitle className="text-2xl mt-4 truncate">{team.nickname || `Team ${team.team_number}`}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Avg Scored</div>
                                        <div className="text-3xl font-black">{team.avg_actual_score.toFixed(1)}</div>
                                    </div>
                                    <Progress value={team.avg_actual_score * 2} className="h-2" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Hybrid Table */}
                    <Card className="border-2 shadow-2xl overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary" /> Theoretical vs. Actual Performance
                            </CardTitle>
                            <CardDescription>Comparing Pit metrics to Match reality</CardDescription>
                        </CardHeader>
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[100px]">Team</TableHead>
                                    <TableHead>Static Specs (Pit)</TableHead>
                                    <TableHead>Performance (Match)</TableHead>
                                    <TableHead className="text-right">Efficiency</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedStats.map((team) => {
                                    const efficiency = team.theoretical_fps ? (team.actual_fps / team.theoretical_fps) * 100 : 0
                                    return (
                                        <TableRow key={team.team_number} className="hover:bg-muted/30 transition-colors">
                                            <TableCell>
                                                <div className="font-black text-lg">{team.team_number}</div>
                                                <div className="text-[10px] text-muted-foreground truncate max-w-[80px]">{team.nickname}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-4">
                                                    <div className="flex items-center gap-1.5" title="Weight">
                                                        <Weight className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-xs font-bold">{team.robot_weight || '?'} lb</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5" title="Top Speed">
                                                        <Gauge className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-xs font-bold">{team.top_speed || '?'} ft/s</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5" title="Climb Level">
                                                        <ArrowUpCircle className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-xs font-bold">L{team.climb_level || '?'}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex gap-2">
                                                    <Badge variant="secondary" className="text-[9px] uppercase font-black">{team.drive_train || 'Unk'}</Badge>
                                                    <Badge variant="outline" className="text-[9px] uppercase font-black">{team.primary_role || 'Unk'}</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                    <div className="text-[10px] uppercase font-bold text-muted-foreground">FPS (Match)</div>
                                                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Climb Rate</div>
                                                    <div className="font-black text-primary underline decoration-primary/30 decoration-2 underline-offset-4">{team.actual_fps.toFixed(2)}</div>
                                                    <div className="font-black">{team.climb_success_rate.toFixed(0)}%</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end">
                                                    <div className={`text-sm font-black ${efficiency > 80 ? 'text-emerald-500' : efficiency > 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                        {efficiency.toFixed(0)}% Util
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">vs {team.theoretical_fps?.toFixed(1)} Pit FPS</div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-right-8 duration-500">
                    {filteredAndSortedStats.map((team) => (
                        <Card key={team.team_number} className="overflow-hidden border-2 hover:border-primary transition-all group shadow-lg">
                            <CardHeader className="bg-primary/5 pb-4 border-b">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-3xl font-black">#{team.team_number}</CardTitle>
                                            {team.is_tba_verified && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                        </div>
                                        <p className="text-sm font-bold text-primary italic">
                                            {team.nickname || 'Unknown Team'}
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black tracking-widest uppercase py-1 px-3">
                                        {team.state_prov || 'N/A'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-xl bg-muted/30 border space-y-1">
                                        <div className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2">
                                            <Weight className="h-3 w-3" /> Weight
                                        </div>
                                        <div className="text-lg font-black">{team.robot_weight || '0'} lb</div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-muted/30 border space-y-1">
                                        <div className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2">
                                            <Gauge className="h-3 w-3" /> Top Speed
                                        </div>
                                        <div className="text-lg font-black">{team.top_speed || '0'} <span className="text-[10px]">ft/s</span></div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-muted/30 border space-y-1">
                                        <div className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2">
                                            <Zap className="h-3 w-3" /> Theoretical
                                        </div>
                                        <div className="text-lg font-black">{team.theoretical_fps?.toFixed(1) || '0'} <span className="text-[10px]">f/sec</span></div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-muted/30 border space-y-1">
                                        <div className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2">
                                            <ArrowUpCircle className="h-3 w-3" /> Climb
                                        </div>
                                        <div className="text-lg font-black">{team.climb_level ? `Level ${team.climb_level}` : 'None'}</div>
                                    </div>
                                </div>

                                {/* Secondary Details */}
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-extrabold text-muted-foreground uppercase tracking-widest">Drive Train</span>
                                        <Badge variant="outline" className="font-black border-2">{team.drive_train || 'Unk'}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-extrabold text-muted-foreground uppercase tracking-widest">Primary Role</span>
                                        <Badge className="font-black">{team.primary_role || 'Unk'}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-extrabold text-muted-foreground uppercase tracking-widest">Obstacle Handling</span>
                                        <span className="font-black text-primary italic uppercase">{team.obstacle_handling || 'N/A'}</span>
                                    </div>
                                </div>

                                {team.pit_comments && (
                                    <div className="bg-muted/30 p-4 rounded-xl border border-dashed relative">
                                        <div className="text-[9px] font-black absolute -top-2 left-3 bg-background px-2 border rounded uppercase">Pit Notes</div>
                                        <p className="text-xs italic text-muted-foreground leading-relaxed">
                                            "{team.pit_comments}"
                                        </p>
                                    </div>
                                )}

                                <div className="pt-4 border-t flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                                    <div className="flex gap-2">
                                        <span className={cn("px-2 py-0.5 rounded", team.climbs_in_auto ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground")}>
                                            {team.climbs_in_auto ? "AUTO CLIMB ✓" : "NO AUTO CLIMB"}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 uppercase">
                                            CAP: {team.fuel_capacity || '0'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 group-hover:text-primary transition-colors cursor-pointer">
                                        VIEW DETAILS <ChevronRight className="h-3 w-3" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Bottom Row: Additional Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="text-sm uppercase font-black tracking-widest flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" /> Scoring Potential (Match Avg)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {filteredAndSortedStats.slice(0, 5).map(t => (
                            <div key={t.team_number} className="space-y-1">
                                <div className="flex justify-between text-xs font-bold">
                                    <span>Team {t.team_number}</span>
                                    <span>{t.avg_actual_score.toFixed(1)} pts</span>
                                </div>
                                <Progress value={t.avg_actual_score * 2} className="h-1.5" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="text-sm uppercase font-black tracking-widest flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" /> Top Defenders
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {stats.sort((a, b) => b.avg_defense - a.avg_defense).slice(0, 5).map(t => (
                            <div key={t.team_number} className="flex justify-between items-center p-2 rounded-lg bg-muted/50 border">
                                <span className="font-black">Team {t.team_number}</span>
                                <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className={`h-2 w-4 rounded-full ${i < Math.round(t.avg_defense) ? 'bg-primary' : 'bg-muted border'}`} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
