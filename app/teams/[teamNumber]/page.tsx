'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getTBAData } from '@/lib/tba'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { useSettings } from '@/contexts/SettingsContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import {
    ArrowLeft,
    Bot,
    Trophy,
    Zap,
    Shield,
    Activity,
    Target,
    BarChart3,
    Globe,
    ChevronRight,
    Loader2,
    Calendar,
    MapPin,
    AlertCircle,
    CheckCircle2,
    Weight,
    Gauge,
    ArrowUpCircle,
    Info,
    User,
    Timer,
    Flame,
    Navigation,
    X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function MatchDetailModal({ isOpen, onClose, match }: { isOpen: boolean, onClose: () => void, match: any }) {
    if (!match) return null

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <AlertDialogHeader className="border-b pb-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <AlertDialogTitle className="text-3xl font-black">Match #{match.match_number}</AlertDialogTitle>
                            <AlertDialogDescription className="font-bold flex items-center gap-2">
                                <Badge className={cn(match.alliance === 'Red' ? 'bg-rose-500' : 'bg-blue-500')}>
                                    {match.alliance} Alliance
                                </Badge>
                                <span>Scouted by {match.scout_name}</span>
                            </AlertDialogDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                            <X className="h-6 w-6" />
                        </Button>
                    </div>
                </AlertDialogHeader>

                <div className="py-6 space-y-8 text-foreground">
                    {/* Auto Phase */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
                            <Zap className="h-4 w-4" /> Autonomous Phase
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-2xl bg-muted/50 border space-y-1">
                                <div className="text-[10px] font-black text-muted-foreground uppercase leading-none">Scored</div>
                                <div className="text-xl font-black">{match.auto_fuel_scored} units</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/50 border space-y-1">
                                <div className="text-[10px] font-black text-muted-foreground uppercase leading-none">Preloaded</div>
                                <div className="text-xl font-black">{match.auto_preloaded ? 'YES' : 'NO'}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/50 border space-y-1">
                                <div className="text-[10px] font-black text-muted-foreground uppercase leading-none">Auto Climb</div>
                                <div className="text-xl font-black">{match.auto_climb ? 'SUCCESS' : 'NO'}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/50 border space-y-1 col-span-full">
                                <div className="text-[10px] font-black text-muted-foreground uppercase leading-none">Start Position</div>
                                <div className="text-lg font-black">{match.start_position || 'Not Recorded'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Teleop Phase */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-500 font-black uppercase tracking-widest text-xs">
                            <Flame className="h-4 w-4" /> Teleop & Endgame
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-2xl bg-muted/50 border space-y-1">
                                <div className="text-[10px] font-black text-muted-foreground uppercase leading-none">Scored</div>
                                <div className="text-xl font-black">{match.teleop_fuel_scored} units</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/50 border space-y-1">
                                <div className="text-[10px] font-black text-muted-foreground uppercase leading-none">Endgame Climb</div>
                                <div className="text-xl font-black">{match.teleop_descended_from_auto ? 'SUCCESS' : 'NO'}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/50 border space-y-1">
                                <div className="text-[10px] font-black text-muted-foreground uppercase leading-none">Zone Control</div>
                                <div className="text-xl font-black">{match.teleop_zone_control}</div>
                            </div>
                        </div>
                    </div>

                    {/* Efficiency & Notes */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-500 font-black uppercase tracking-widest text-xs">
                            <Target className="h-4 w-4" /> Performance Metrics
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="p-4 border-2">
                                <div className="text-[10px] font-black text-muted-foreground uppercase mb-2">Defense Rating</div>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <div key={s} className={cn("h-2 flex-1 rounded-full", s <= match.defense_rating ? "bg-emerald-500" : "bg-muted")} />
                                    ))}
                                </div>
                                <div className="text-right text-sm font-black mt-1">{match.defense_rating}/5</div>
                            </Card>
                            <Card className="p-4 border-2">
                                <div className="text-[10px] font-black text-muted-foreground uppercase mb-2">Accuracy Rating</div>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <div key={s} className={cn("h-2 flex-1 rounded-full", s <= match.accuracy_rating ? "bg-primary" : "bg-muted")} />
                                    ))}
                                </div>
                                <div className="text-right text-sm font-black mt-1">{match.accuracy_rating}/5</div>
                            </Card>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Scout Observations</Label>
                            <div className="p-4 rounded-2xl bg-muted/30 border-2 italic text-sm leading-relaxed">
                                "{match.comments || 'No specific observations recorded for this match.'}"
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl border-2 border-dashed flex justify-between items-center">
                            <span className="text-xs font-bold text-muted-foreground">RPs Contributed</span>
                            <span className="text-2xl font-black text-primary">{match.ranking_points_contributed}</span>
                        </div>
                    </div>
                </div>

                <AlertDialogFooter>
                    <AlertDialogAction onClick={onClose} className="w-full h-12 rounded-2xl font-black">Dismiss Details</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

interface TeamProfileData {
    pit?: any
    matches: any[]
    tbaInfo?: any
    tbaEvents?: any[]
    tbaAwards?: any[]
}

export default function TeamProfilePage() {
    const params = useParams()
    const router = useRouter()
    const { settings } = useSettings()
    const teamNumber = params.teamNumber as string
    const [data, setData] = useState<TeamProfileData | null>(null)
    const [loading, setLoading] = useState(true)
    const [eventKey, setEventKey] = useState(settings.event_key)
    const [tempEventKey, setTempEventKey] = useState(eventKey)
    const [viewAll, setViewAll] = useState(false)
    const [selectedMatch, setSelectedMatch] = useState<any>(null)

    const supabase = createClient()

    // Sync event key from settings
    useEffect(() => {
        setEventKey(settings.event_key)
        setTempEventKey(settings.event_key)
    }, [settings.event_key])

    useEffect(() => {
        async function fetchTeamData() {
            setLoading(true)
            try {
                // 1. Fetch our Pit Data
                let pitQuery = supabase
                    .from('pit_scouting')
                    .select('*')
                    .eq('team_number', teamNumber)

                if (!viewAll) {
                    pitQuery = pitQuery.eq('event_key', eventKey)
                }

                const { data: pitData } = await pitQuery.limit(1).single()

                // 2. Fetch our Match Data
                let matchQuery = supabase
                    .from('match_scouting')
                    .select('*')
                    .eq('team_number', teamNumber)

                if (!viewAll) {
                    matchQuery = matchQuery.eq('event_key', eventKey)
                }

                const { data: matchData } = await matchQuery

                // 3. Fetch TBA Info
                const tbaInfo = await getTBAData(`/team/frc${teamNumber}`)
                const tbaEvents = await getTBAData(`/team/frc${teamNumber}/events/2025/simple`)
                const tbaAwards = await getTBAData(`/team/frc${teamNumber}/awards/2025`)

                // 4. Fetch status for specific event if it exists in their list
                let tbaEventStatus = null
                let tbaOPR = null
                if (!viewAll) {
                    try {
                        tbaEventStatus = await getTBAData(`/team/frc${teamNumber}/event/${eventKey}/status`)
                        const oprsData = await getTBAData(`/event/${eventKey}/oprs`)
                        tbaOPR = oprsData.oprs?.[`frc${teamNumber}`]
                    } catch (e) {
                        console.warn('No TBA status/oprs for this event')
                    }
                }

                setData({
                    pit: pitData,
                    matches: matchData || [],
                    tbaInfo: { ...tbaInfo, status: tbaEventStatus, opr: tbaOPR },
                    tbaEvents,
                    tbaAwards
                })
            } catch (err) {
                console.error('Error fetching team profile:', err)
            } finally {
                setLoading(false)
            }
        }

        if (teamNumber) fetchTeamData()
    }, [teamNumber, eventKey, viewAll, supabase])

    const matchStats = useMemo(() => {
        if (!data?.matches.length) return null
        const m = data.matches
        const totalScore = m.reduce((acc, curr) => acc + (curr.auto_fuel_scored || 0) + (curr.teleop_fuel_scored || 0), 0)
        const totalDefense = m.reduce((acc, curr) => acc + (curr.defense_rating || 0), 0)
        const totalClimbs = m.reduce((acc, curr) => acc + ((curr.auto_climb || curr.teleop_descended_from_auto) ? 1 : 0), 0)

        return {
            avgScore: totalScore / m.length,
            avgDefense: totalDefense / m.length,
            climbRate: (totalClimbs / m.length) * 100,
            matchCount: m.length
        }
    }, [data])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
            <div className="text-muted-foreground font-medium animate-pulse text-lg">Gathering Intel on #{teamNumber}...</div>
        </div>
    )

    if (!data?.tbaInfo) return (
        <div className="container py-12 text-center">
            <h1 className="text-4xl font-black mb-4">Team Not Found</h1>
            <Button onClick={() => router.back()}>Go Back</Button>
        </div>
    )

    return (
        <div className="container py-8 space-y-8 animate-in fade-in duration-700 max-w-6xl mx-auto">
            {/* Header Navigation */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()} className="rounded-full h-12 w-12 p-0">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-5xl font-black tracking-tighter">Team {teamNumber}</h1>
                        {data.pit && <Badge className="bg-emerald-500 hover:bg-emerald-600">Scouted ✓</Badge>}
                        {viewAll && <Badge variant="outline" className="border-primary border-2 text-primary font-black uppercase">Historical View</Badge>}
                    </div>
                    <p className="text-xl text-muted-foreground font-bold italic">{data.tbaInfo.nickname}</p>
                </div>
            </div>

            {/* Strategic Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-muted/30 p-4 rounded-3xl border-2">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Input
                            value={tempEventKey}
                            onChange={(e) => setTempEventKey(e.target.value.toLowerCase())}
                            placeholder="Event Key (2025ilpe)"
                            className="w-48 h-10 rounded-2xl border-2 font-mono uppercase text-xs"
                            disabled={viewAll}
                        />
                    </div>
                    <Button
                        onClick={() => {
                            setEventKey(tempEventKey)
                            setViewAll(false)
                        }}
                        disabled={viewAll || tempEventKey === eventKey}
                        className="rounded-2xl h-10 font-black"
                    >
                        Sync Event
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-muted-foreground mr-2">Season Scope:</span>
                    <Button
                        variant={!viewAll ? "default" : "outline"}
                        onClick={() => setViewAll(false)}
                        className="rounded-2xl h-10 font-black text-xs"
                    >
                        Specific Event
                    </Button>
                    <Button
                        variant={viewAll ? "default" : "outline"}
                        onClick={() => setViewAll(true)}
                        className="rounded-2xl h-10 font-black text-xs"
                    >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Combine All Data
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Core Info & TBA Comparison */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-2 shadow-xl overflow-hidden">
                        <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5 flex items-end px-6 pb-4">
                            <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
                                <Globe className="h-4 w-4" /> The Blue Alliance Meta
                            </div>
                        </div>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold">
                                        <MapPin className="h-4 w-4" /> Origin
                                    </div>
                                    <div className="font-black text-right">{data.tbaInfo.city}, {data.tbaInfo.state_prov}</div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold">
                                        <Calendar className="h-4 w-4" /> Rookie Year
                                    </div>
                                    <div className="font-black">{data.tbaInfo.rookie_year}</div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold">
                                        <Trophy className="h-4 w-4" /> TBA Rank (Event)
                                    </div>
                                    <div className="text-2xl font-black text-primary">
                                        #{data.tbaInfo.status?.qual?.ranking?.rank || 'N/A'}
                                    </div>
                                </div>
                                {data.tbaInfo.status?.qual?.ranking?.record && (
                                    <div className="flex items-center justify-between">
                                        <div className="text-muted-foreground text-sm font-bold">W-L-T Record</div>
                                        <Badge variant="outline" className="font-mono text-lg border-2">
                                            {data.tbaInfo.status.qual.ranking.record.wins} - {data.tbaInfo.status.qual.ranking.record.losses} - {data.tbaInfo.status.qual.ranking.record.ties}
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 border-t">
                                <h4 className="text-[10px] font-black uppercase text-muted-foreground mb-4 tracking-[0.2em]">Our Performance Benchmarks</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-muted/50 border text-center space-y-1">
                                        <div className="text-[10px] font-black text-muted-foreground uppercase">Avg Scored</div>
                                        <div className="text-2xl font-black">{matchStats?.avgScore.toFixed(1) || '0.0'}</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-muted/50 border text-center space-y-1">
                                        <div className="text-[10px] font-black text-muted-foreground uppercase">TBA OPR</div>
                                        <div className="text-2xl font-black text-blue-600">{data.tbaInfo.opr?.toFixed(1) || 'N/A'}</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-muted/50 border text-center space-y-1 col-span-2">
                                        <div className="text-[10px] font-black text-muted-foreground uppercase">Defense Profile</div>
                                        <div className="text-2xl font-black">{matchStats?.avgDefense.toFixed(1) || '0.0'}<span className="text-xs text-muted-foreground ml-1">/ 5.0</span></div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* TBA Awards for Year */}
                    <Card className="border-2 shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-amber-500" /> Recent Accolades
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {data.tbaAwards?.length ? data.tbaAwards.map((award, i) => (
                                <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-amber-50/10 border border-amber-200/20">
                                    <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                    <div>
                                        <div className="text-xs font-black">{award.name}</div>
                                        <div className="text-[10px] text-muted-foreground">{award.event_key}</div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-xs italic text-muted-foreground py-4 text-center">No awards recorded for 2025 yet.</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Center/Right Column: In-depth Scouting & Specs */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Pit Data - Specs View */}
                    {data.pit ? (
                        <Card className="border-2 shadow-2xl overflow-hidden">
                            <CardHeader className="bg-primary text-primary-foreground">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-2xl font-black">Mechanical Blueprint</CardTitle>
                                        <CardDescription className="text-primary-foreground/70 font-bold">Pit Scouted Data by {data.pit.scout_name}</CardDescription>
                                    </div>
                                    <Bot className="h-10 w-10 opacity-20" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1 p-4 rounded-3xl bg-muted/30 border-2">
                                            <Label className="text-[10px] uppercase font-black text-muted-foreground flex items-center gap-2">
                                                <Weight className="h-3 w-3" /> Weight
                                            </Label>
                                            <div className="text-2xl font-black">{data.pit.robot_weight} <span className="text-sm">lbs</span></div>
                                        </div>
                                        <div className="space-y-1 p-4 rounded-3xl bg-muted/30 border-2">
                                            <Label className="text-[10px] uppercase font-black text-muted-foreground flex items-center gap-2">
                                                <Gauge className="h-3 w-3" /> Top Speed
                                            </Label>
                                            <div className="text-2xl font-black">{data.pit.top_speed} <span className="text-sm">fps</span></div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-xs uppercase font-black text-muted-foreground mb-2 block">Drive Train Effectiveness</Label>
                                            <div className="flex items-center gap-4">
                                                <Badge className="px-6 py-2 rounded-full text-lg font-black">{data.pit.drive_train_type}</Badge>
                                                <div className="text-sm font-bold text-emerald-500 flex items-center gap-1">
                                                    <CheckCircle2 className="h-4 w-4" /> Validated
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl border-2 border-dashed space-y-2">
                                            <Label className="text-xs uppercase font-black text-muted-foreground">Observed Strategy Role</Label>
                                            <div className="text-lg font-black flex items-center gap-2">
                                                <Target className="h-5 w-5 text-primary" /> {data.pit.primary_role}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4 p-6 rounded-3xl bg-primary/5 border-2 border-primary/20">
                                        <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-primary" /> Mechanism Details
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold">Fuel Capacity</span>
                                                <span className="font-black text-xl">{data.pit.fuel_capacity} units</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold">Cycle Speed</span>
                                                <span className="font-black text-xl">{data.pit.fuel_per_second} <span className="text-xs text-muted-foreground">f/sec</span></span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold">Max Climb Bar</span>
                                                <Badge variant="outline" className="border-2 font-black">Level {data.pit.climb_level}</Badge>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold">Auto Climb?</span>
                                                <Badge className={cn("font-black", data.pit.climbs_in_auto ? "bg-emerald-500" : "bg-muted text-muted-foreground")}>
                                                    {data.pit.climbs_in_auto ? "YES" : "NO"}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold">Obstacle Handling</span>
                                                <Badge variant="secondary" className="font-black">{data.pit.obstacle_handling}</Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-black text-muted-foreground">Scout Notes</Label>
                                        <div className="italic text-sm bg-muted/30 p-4 rounded-2xl border leading-relaxed">
                                            "{data.pit.comments || 'No specific notes recorded yet.'}"
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-2 border-dashed p-12 text-center space-y-4">
                            <Bot className="h-16 w-16 mx-auto opacity-10" />
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black">No Pit Scouting Data</h3>
                                <p className="text-muted-foreground">We haven't interviewed this team in the pits yet.</p>
                            </div>
                            <Button onClick={() => router.push(`/scout/pit?team=${teamNumber}`)} className="rounded-full px-8">Dispatch Scouter</Button>
                        </Card>
                    )}

                    {/* Match History / Scatter View? (Could be simple list for now) */}
                    <Card className="border-2 shadow-lg">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-primary" /> Match Scouting History
                                    </CardTitle>
                                    <CardDescription>Performance recorded across {data.matches.length} matches at this event</CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    className="rounded-full font-black gap-2"
                                    onClick={() => router.push(`/scout/match?team=${teamNumber}`)}
                                >
                                    <Target className="h-4 w-4" /> Add Match
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {data.matches.length > 0 ? (
                                <div className="space-y-4">
                                    {data.matches.sort((a, b) => b.match_number - a.match_number).map((m, i) => (
                                        <div
                                            key={i}
                                            className="flex flex-wrap items-center justify-between p-4 rounded-2xl bg-muted/20 border-2 hover:bg-muted/40 hover:border-primary/50 transition-all cursor-pointer group"
                                            onClick={() => setSelectedMatch(m)}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="text-center">
                                                    <div className="text-[10px] font-black text-muted-foreground uppercase">Match</div>
                                                    <div className="text-xl font-black">#{m.match_number}</div>
                                                </div>
                                                <Badge className={cn(m.alliance === 'Red' ? 'bg-rose-500' : 'bg-blue-500')}>
                                                    {m.alliance} Alliance
                                                </Badge>
                                            </div>

                                            <div className="flex gap-8 items-center">
                                                <div className="text-center hidden sm:block">
                                                    <div className="text-[10px] font-black text-muted-foreground uppercase">Scored</div>
                                                    <div className="font-black">{(m.auto_fuel_scored || 0) + (m.teleop_fuel_scored || 0)} pts</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-[10px] font-black text-muted-foreground uppercase">Climb</div>
                                                    <div className="font-black text-primary">{m.auto_climb || m.teleop_descended_from_auto ? 'YES' : 'NO'}</div>
                                                </div>
                                                <div className="text-center pr-4">
                                                    <div className="text-[10px] font-black text-muted-foreground uppercase">Defense</div>
                                                    <div className="font-black">{m.defense_rating}/5</div>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-muted-foreground italic font-medium">
                                    No live match data captured yet for this team.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            {/* Match Detail Modal */}
            <MatchDetailModal
                isOpen={!!selectedMatch}
                onClose={() => setSelectedMatch(null)}
                match={selectedMatch}
            />
        </div>
    )
}
