'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { getTBAData, TBATeam, TBAEvent, TBAMatch } from '@/lib/tba'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart3, Activity, Shield, Trophy, Filter, ArrowUpDown, AlertCircle, MapPin, Loader2, Gauge, Weight, ArrowUpCircle, Zap, Target, ScrollText, CheckCircle2, ChevronRight, TrendingUp, Radar, GitCompare, Info, Calendar, Users, Globe, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useSettings } from '@/contexts/SettingsContext'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar as RechartsRadar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from 'recharts'

interface TeamStat {
    team_number: number
    nickname?: string
    state_prov?: string
    is_tba_verified?: boolean

    // Pit Data
    robot_weight?: number
    auto_abilities?: string
    start_position?: string
    can_climb?: boolean
    can_descend?: boolean
    collection_speed?: string
    shoot_speed?: string
    drive_train_type?: string
    movement_abilities?: string
    scoring_speed?: string
    ranking_points?: string
    traversal?: boolean
    super_charged?: boolean

    // Match Data
    scout_name?: string
    match_number?: number
    robot_status?: string
    roll_of_robot?: string
    defense_rating?: number
    ferry?: string
    accuracy?: number

    // Calculated
    avg_score?: number
    climb_success_rate?: number
    match_count?: number
}

const ROBOT_STAT_OPTIONS = [
    { value: 'weight', label: 'Weight', icon: Weight },
    { value: 'auto', label: 'Auto', icon: Zap },
    { value: 'start_pos', label: 'Start Position', icon: MapPin },
    { value: 'can_climb', label: 'Can Climb', icon: ArrowUpCircle },
    { value: 'can_descend', label: 'Can Descend', icon: ArrowUpCircle },
    { value: 'collection_speed', label: 'Collection Speed', icon: Gauge },
    { value: 'shoot_speed', label: 'Shoot Speed', icon: Target },
    { value: 'drive_train', label: 'Drive Train', icon: TrendingUp },
    { value: 'movement', label: 'Movement Abilities', icon: Activity },
    { value: 'scoring_speed', label: 'Scoring Speed', icon: Zap },
    { value: 'ranking_points', label: 'Ranking Points', icon: Trophy },
    { value: 'traversal', label: 'Traversal', icon: ArrowUpCircle },
    { value: 'super_charged', label: 'Super Charged', icon: Zap },
    { value: 'team_number', label: 'Team Number', icon: Shield },
    { value: 'scout_name', label: 'Scout Name', icon: Shield },
    { value: 'accuracy', label: 'Accuracy', icon: Target },
]

const FIELD_STAT_OPTIONS = [
    { value: 'match_number', label: 'Match Number', icon: ScrollText },
    { value: 'can_climb', label: 'Can Climb', icon: ArrowUpCircle },
    { value: 'robot_status', label: 'Robot Status', icon: Activity },
    { value: 'roll', label: 'Roll of Robot', icon: TrendingUp },
    { value: 'defense', label: 'Defense', icon: Shield },
    { value: 'ferry', label: 'Ferry', icon: TrendingUp },
    { value: 'accuracy', label: 'Accuracy', icon: Target },
]

export default function AnalyticsDashboard() {
    const { settings } = useSettings()
    const [stats, setStats] = useState<TeamStat[]>([])
    const [loading, setLoading] = useState(true)
    const [eventKey, setEventKey] = useState(settings.event_key)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState<'rankings' | 'graphs' | 'compare' | 'tba'>('rankings')
    const [robotStatFilter, setRobotStatFilter] = useState<string>('weight')
    const [climbFilter, setClimbFilter] = useState<string>('all')
    
    // TBA Data
    const [tbaEvent, setTbaEvent] = useState<TBAEvent | null>(null)
    const [tbaTeams, setTbaTeams] = useState<TBATeam[]>([])
    const [tbaMatches, setTbaMatches] = useState<TBAMatch[]>([])
    const [tbaLoading, setTbaLoading] = useState(false)
    const [tbaSearchKey, setTbaSearchKey] = useState(eventKey)

    const supabase = createClient()

    useEffect(() => {
        setEventKey(settings.event_key)
    }, [settings.event_key])

    useEffect(() => {
        async function fetchAllData() {
            setLoading(true)
            try {
                const { data: matchData, error: matchError } = await supabase
                    .from('match_scouting')
                    .select('*')
                    .eq('event_key', eventKey)

                const { data: pitData, error: pitError } = await supabase
                    .from('pit_scouting')
                    .select('*')
                    .eq('event_key', eventKey)

                let tbaTeams: TBATeam[] = []
                try {
                    tbaTeams = await getTBAData(`/event/${eventKey}/teams`)
                } catch (e) {
                    console.warn('TBA Event fetch failed')
                }

                if (matchError || pitError) throw new Error('Database fetch failed')

                const teamMap = new Map<number, TeamStat>()

                tbaTeams.forEach(t => {
                    teamMap.set(t.team_number, {
                        team_number: t.team_number,
                        nickname: t.nickname,
                        state_prov: t.state_prov,
                        is_tba_verified: true,
                    })
                })

                matchData?.forEach((match: Record<string, unknown>) => {
                    const current = teamMap.get(match.team_number as number) || { team_number: match.team_number as number }
                    current.scout_name = match.scout_name as string
                    current.match_number = match.match_number as number
                    current.robot_status = match.robot_status as string
                    current.roll_of_robot = match.roll_of_robot as string
                    current.defense_rating = (match.defense_rating as number) || 0
                    current.ferry = match.ferry as string
                    current.accuracy = (match.accuracy as number) || 0
                    current.avg_score = ((current.avg_score || 0) + ((match.auto_fuel_scored as number) || 0) + ((match.teleop_fuel_scored as number) || 0))
                    current.match_count = (current.match_count || 0) + 1
                    teamMap.set(match.team_number as number, current)
                })

                pitData?.forEach((pit: Record<string, unknown>) => {
                    const current = teamMap.get(pit.team_number as number) || { team_number: pit.team_number as number }
                    current.robot_weight = pit.robot_weight as number
                    current.auto_abilities = pit.auto_abilities as string
                    current.start_position = pit.start_position as string
                    current.can_climb = pit.can_climb as boolean
                    current.can_descend = pit.can_descend as boolean
                    current.collection_speed = pit.collection_speed as string
                    current.shoot_speed = pit.shoot_speed as string
                    current.drive_train_type = pit.drive_train_type as string
                    current.movement_abilities = pit.movement_abilities as string
                    current.scoring_speed = pit.scoring_speed as string
                    current.ranking_points = pit.ranking_points as string
                    current.traversal = pit.traversal as boolean
                    current.super_charged = pit.super_charged as boolean
                    teamMap.set(pit.team_number as number, current)
                })

                const finalized: TeamStat[] = Array.from(teamMap.values()).map(t => ({
                    ...t,
                    avg_score: t.match_count ? (t.avg_score || 0) / t.match_count : 0,
                    climb_success_rate: t.match_count ? ((t.can_climb ? 80 : 20)) : 0,
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

    // Fetch TBA data when tab is tba
    useEffect(() => {
        if (activeTab !== 'tba') return
        
        async function fetchTBAData() {
            setTbaLoading(true)
            try {
                const [eventData, teamsData, matchesData] = await Promise.all([
                    getTBAData(`/event/${eventKey}`),
                    getTBAData(`/event/${eventKey}/teams`),
                    getTBAData(`/event/${eventKey}/matches`)
                ])
                setTbaEvent(eventData)
                setTbaTeams(teamsData.sort((a: TBATeam, b: TBATeam) => a.team_number - b.team_number))
                setTbaMatches(matchesData.sort((a: TBAMatch, b: TBAMatch) => {
                    if (a.comp_level !== b.comp_level) {
                        const order: Record<string, number> = { qm: 1, ef: 2, qf: 3, sf: 4, f: 5 }
                        return (order[a.comp_level] || 9) - (order[b.comp_level] || 9)
                    }
                    return a.match_number - b.match_number
                }))
            } catch (err) {
                console.error('Failed to fetch TBA data:', err)
                setTbaEvent(null)
                setTbaTeams([])
                setTbaMatches([])
            } finally {
                setTbaLoading(false)
            }
        }
        
        fetchTBAData()
    }, [activeTab, eventKey])

    const handleTBASearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!tbaSearchKey) return
        setTbaLoading(true)
        setEventKey(tbaSearchKey)
        try {
            const [eventData, teamsData, matchesData] = await Promise.all([
                getTBAData(`/event/${tbaSearchKey}`),
                getTBAData(`/event/${tbaSearchKey}/teams`),
                getTBAData(`/event/${tbaSearchKey}/matches`)
            ])
            setTbaEvent(eventData)
            setTbaTeams(teamsData.sort((a: TBATeam, b: TBATeam) => a.team_number - b.team_number))
            setTbaMatches(matchesData.sort((a: TBAMatch, b: TBAMatch) => {
                if (a.comp_level !== b.comp_level) {
                    const order: Record<string, number> = { qm: 1, ef: 2, qf: 3, sf: 4, f: 5 }
                    return (order[a.comp_level] || 9) - (order[b.comp_level] || 9)
                }
                return a.match_number - b.match_number
            }))
        } catch (err) {
            console.error('Failed to fetch TBA data:', err)
            setTbaEvent(null)
            setTbaTeams([])
            setTbaMatches([])
        } finally {
            setTbaLoading(false)
        }
    }

    const filteredStats = useMemo(() => {
        return stats.filter(t =>
            t.team_number.toString().includes(searchQuery) ||
            t.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [stats, searchQuery])

    const rankedByScore = useMemo(() => {
        return [...filteredStats].sort((a, b) => (b.avg_score || 0) - (a.avg_score || 0))
    }, [filteredStats])

    const rankedByClimb = useMemo(() => {
        return [...filteredStats].sort((a, b) => (b.climb_success_rate || 0) - (a.climb_success_rate || 0))
    }, [filteredStats])

    const rankedByDefense = useMemo(() => {
        return [...filteredStats].sort((a, b) => (b.defense_rating || 0) - (a.defense_rating || 0))
    }, [filteredStats])

    const climbData = useMemo(() => {
        const canClimb = filteredStats.filter(t => t.can_climb).length
        const cannotClimb = filteredStats.filter(t => !t.can_climb).length
        const traversal = filteredStats.filter(t => t.traversal).length
        const superCharged = filteredStats.filter(t => t.super_charged).length
        return [
            { name: 'Can Climb', value: canClimb, color: '#A4D65E' },
            { name: 'Cannot Climb', value: cannotClimb, color: '#5C5C5C' },
            { name: 'Traversal', value: traversal, color: '#0066B3' },
            { name: 'Super Charged', value: superCharged, color: '#63AD3F' },
        ]
    }, [filteredStats])

    const driveTrainData = useMemo(() => {
        const counts: Record<string, number> = {}
        filteredStats.forEach(t => {
            const dt = t.drive_train_type || 'Unknown'
            counts[dt] = (counts[dt] || 0) + 1
        })
        return Object.entries(counts).map(([name, value]) => ({ name, value }))
    }, [filteredStats])

    const scoreComparisonData = useMemo(() => {
        return rankedByScore.slice(0, 10).map(t => ({
            team: t.team_number,
            score: Math.round(t.avg_score || 0),
        }))
    }, [rankedByScore])

    const radarData = useMemo(() => {
        return [
            { stat: 'Avg Score', value: Math.round(filteredStats.reduce((sum, t) => sum + (t.avg_score || 0), 0) / filteredStats.length) || 0 },
            { stat: 'Climb Rate', value: Math.round(filteredStats.reduce((sum, t) => sum + (t.can_climb ? 100 : 0), 0) / filteredStats.length) || 0 },
            { stat: 'Defense', value: Math.round(filteredStats.reduce((sum, t) => sum + (t.defense_rating || 0), 0) / filteredStats.length) || 0 },
            { stat: 'Accuracy', value: Math.round(filteredStats.reduce((sum, t) => sum + (t.accuracy || 0), 0) / filteredStats.length) || 0 },
            { stat: 'Weight Avg', value: Math.round(filteredStats.reduce((sum, t) => sum + (t.robot_weight || 0), 0) / filteredStats.length) || 0 },
        ]
    }, [filteredStats])

    const getStatValue = (team: TeamStat, stat: string): string => {
        switch (stat) {
            case 'weight': return team.robot_weight ? `${team.robot_weight} lb` : 'N/A'
            case 'auto': return team.auto_abilities || 'N/A'
            case 'start_pos': return team.start_position || 'N/A'
            case 'can_climb': return team.can_climb ? 'Yes' : 'No'
            case 'can_descend': return team.can_descend ? 'Yes' : 'No'
            case 'collection_speed': return team.collection_speed || 'N/A'
            case 'shoot_speed': return team.shoot_speed || 'N/A'
            case 'drive_train': return team.drive_train_type || 'N/A'
            case 'movement': return team.movement_abilities || 'N/A'
            case 'scoring_speed': return team.scoring_speed || 'N/A'
            case 'ranking_points': return team.ranking_points || 'N/A'
            case 'traversal': return team.traversal ? 'Yes' : 'No'
            case 'super_charged': return team.super_charged ? 'Yes' : 'No'
            case 'team_number': return `#${team.team_number}`
            case 'scout_name': return team.scout_name || 'N/A'
            case 'accuracy': return team.accuracy ? `${team.accuracy}%` : 'N/A'
            default: return 'N/A'
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
            <div className="text-muted-foreground font-medium animate-pulse">Loading analytics...</div>
        </div>
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-card p-8 rounded-3xl border shadow-xl">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        <BarChart3 className="h-10 w-10 text-primary" /> Analytics
                    </h1>
                    <p className="text-muted-foreground text-lg">Team rankings, climb data, and robot stats</p>
                </div>

                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <div className="flex bg-muted p-1 rounded-xl border-2">
                        <button
                            onClick={() => setActiveTab('rankings')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                activeTab === 'rankings' ? "bg-background shadow-md text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Trophy className="h-4 w-4" /> Rankings
                        </button>
                        <button
                            onClick={() => setActiveTab('graphs')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                activeTab === 'graphs' ? "bg-background shadow-md text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <BarChart3 className="h-4 w-4" /> Graphs
                        </button>
                        <button
                            onClick={() => setActiveTab('compare')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                activeTab === 'compare' ? "bg-background shadow-md text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <GitCompare className="h-4 w-4" /> Compare
                        </button>
                        <button
                            onClick={() => setActiveTab('tba')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                activeTab === 'tba' ? "bg-background shadow-md text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Globe className="h-4 w-4" /> TBA
                        </button>
                    </div>

                    <div className="relative flex-1 md:w-64">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search team..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-12 bg-muted/50 border-2"
                        />
                    </div>
                </div>
            </div>

            {activeTab === 'rankings' && (
                <div className="space-y-8">
                    {/* Rankings Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-2 shadow-lg">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm uppercase font-black tracking-widest flex items-center gap-2">
                                    <Trophy className="h-4 w-4 text-primary" /> Top Scoring Teams
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {rankedByScore.slice(0, 5).map((team, idx) => (
                                    <Link key={team.team_number} href={`/teams/${team.team_number}`}>
                                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className={cn("font-black text-lg w-6", idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-amber-600" : "text-muted-foreground")}>
                                                    #{idx + 1}
                                                </span>
                                                <span className="font-bold">{team.team_number}</span>
                                            </div>
                                            <span className="font-black text-primary">{Math.round(team.avg_score || 0)}</span>
                                        </div>
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border-2 shadow-lg">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm uppercase font-black tracking-widest flex items-center gap-2">
                                    <ArrowUpCircle className="h-4 w-4 text-primary" /> Climb Leaders
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {rankedByClimb.slice(0, 5).map((team, idx) => (
                                    <Link key={team.team_number} href={`/teams/${team.team_number}`}>
                                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className={cn("font-black text-lg w-6", idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-amber-600" : "text-muted-foreground")}>
                                                    #{idx + 1}
                                                </span>
                                                <span className="font-bold">{team.team_number}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {team.can_climb && <Badge className="text-[10px] bg-primary/20 text-primary">Climb</Badge>}
                                                {team.traversal && <Badge className="text-[10px] bg-blue-500/20 text-blue-600">Traversal</Badge>}
                                                {team.super_charged && <Badge className="text-[10px] bg-green-500/20 text-green-600">Super</Badge>}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border-2 shadow-lg">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm uppercase font-black tracking-widest flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-primary" /> Top Defenders
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {rankedByDefense.slice(0, 5).map((team, idx) => (
                                    <Link key={team.team_number} href={`/teams/${team.team_number}`}>
                                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className={cn("font-black text-lg w-6", idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-amber-600" : "text-muted-foreground")}>
                                                    #{idx + 1}
                                                </span>
                                                <span className="font-bold">{team.team_number}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <div key={i} className={cn("h-2 w-3 rounded-full", i < Math.round(team.defense_rating || 0) ? "bg-primary" : "bg-muted border")} />
                                                ))}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Robot Stats Dropdown */}
                    <Card className="border-2 shadow-xl">
                        <CardHeader className="border-b pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Radar className="h-5 w-5 text-primary" /> Robot Stats
                                </CardTitle>
                                <Select value={robotStatFilter} onValueChange={(value) => value && setRobotStatFilter(value)}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Select stat" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROBOT_STAT_OPTIONS.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                <div className="flex items-center gap-2">
                                                    <opt.icon className="h-4 w-4" />
                                                    {opt.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <CardDescription>View teams by selected robot statistic</CardDescription>
                        </CardHeader>
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Team</TableHead>
                                    <TableHead>Nickname</TableHead>
                                    <TableHead className="text-right">{ROBOT_STAT_OPTIONS.find(o => o.value === robotStatFilter)?.label}</TableHead>
                                    <TableHead className="text-right">Avg Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStats.map(team => (
                                    <TableRow key={team.team_number} className="hover:bg-muted/30">
                                        <TableCell>
                                            <Link href={`/teams/${team.team_number}`} className="font-black hover:text-primary">
                                                #{team.team_number}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{team.nickname || 'N/A'}</TableCell>
                                        <TableCell className="text-right font-bold">
                                            {getStatValue(team, robotStatFilter)}
                                        </TableCell>
                                        <TableCell className="text-right font-black text-primary">
                                            {Math.round(team.avg_score || 0)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            )}

            {activeTab === 'graphs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-2 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-sm uppercase font-black tracking-widest">Score Rankings</CardTitle>
                        </CardHeader>
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={scoreComparisonData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="team" type="category" width={60} />
                                    <Tooltip />
                                    <Bar dataKey="score" fill="#A4D65E" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="border-2 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-sm uppercase font-black tracking-widest">Climb Capabilities</CardTitle>
                        </CardHeader>
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={climbData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {climbData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="border-2 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-sm uppercase font-black tracking-widest">Drive Train Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={driveTrainData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#A4D65E" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="border-2 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-sm uppercase font-black tracking-widest">Event Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="stat" />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                    <RechartsRadar
                                        name="Value"
                                        dataKey="value"
                                        stroke="#A4D65E"
                                        fill="#A4D65E"
                                        fillOpacity={0.3}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'compare' && (
                <div className="space-y-6">
                    <Card className="border-2 shadow-xl">
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <GitCompare className="h-5 w-5 text-primary" /> Team Comparison
                                </CardTitle>
                                <Select value={climbFilter} onValueChange={(value) => value && setClimbFilter(value)}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Filter by climb" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Teams</SelectItem>
                                        <SelectItem value="can_climb">Can Climb</SelectItem>
                                        <SelectItem value="traversal">Traversal</SelectItem>
                                        <SelectItem value="super_charged">Super Charged</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <CardDescription>Compare teams across all statistics</CardDescription>
                        </CardHeader>
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Team</TableHead>
                                    <TableHead>Weight</TableHead>
                                    <TableHead>Auto</TableHead>
                                    <TableHead>Start Pos</TableHead>
                                    <TableHead>Climb</TableHead>
                                    <TableHead>Descend</TableHead>
                                    <TableHead>Collection</TableHead>
                                    <TableHead>Shoot</TableHead>
                                    <TableHead>Drive Train</TableHead>
                                    <TableHead>Traversal</TableHead>
                                    <TableHead>Super</TableHead>
                                    <TableHead>Avg Score</TableHead>
                                    <TableHead>Defense</TableHead>
                                    <TableHead>Accuracy</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStats
                                    .filter(t => {
                                        if (climbFilter === 'can_climb') return t.can_climb
                                        if (climbFilter === 'traversal') return t.traversal
                                        if (climbFilter === 'super_charged') return t.super_charged
                                        return true
                                    })
                                    .slice(0, 20)
                                    .map(team => (
                                        <TableRow key={team.team_number} className="hover:bg-muted/30">
                                            <TableCell>
                                                <Link href={`/teams/${team.team_number}`} className="font-black hover:text-primary">
                                                    #{team.team_number}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{team.robot_weight ? `${team.robot_weight} lb` : '-'}</TableCell>
                                            <TableCell>{team.auto_abilities || '-'}</TableCell>
                                            <TableCell>{team.start_position || '-'}</TableCell>
                                            <TableCell>
                                                {team.can_climb ? <Badge className="bg-primary/20 text-primary">Yes</Badge> : <span className="text-muted-foreground">No</span>}
                                            </TableCell>
                                            <TableCell>
                                                {team.can_descend ? <Badge className="bg-primary/20 text-primary">Yes</Badge> : <span className="text-muted-foreground">No</span>}
                                            </TableCell>
                                            <TableCell>{team.collection_speed || '-'}</TableCell>
                                            <TableCell>{team.shoot_speed || '-'}</TableCell>
                                            <TableCell className="text-xs">{team.drive_train_type || '-'}</TableCell>
                                            <TableCell>
                                                {team.traversal ? <Badge className="bg-blue-500/20 text-blue-600">Yes</Badge> : <span className="text-muted-foreground">-</span>}
                                            </TableCell>
                                            <TableCell>
                                                {team.super_charged ? <Badge className="bg-green-500/20 text-green-600">Yes</Badge> : <span className="text-muted-foreground">-</span>}
                                            </TableCell>
                                            <TableCell className="font-black text-primary">{Math.round(team.avg_score || 0)}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <div key={i} className={cn("h-1.5 w-2 rounded-full", i < Math.round(team.defense_rating || 0) ? "bg-primary" : "bg-muted")} />
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>{team.accuracy ? `${team.accuracy}%` : '-'}</TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            )}

            {activeTab === 'tba' && (
                <div className="space-y-6">
                    {/* Search Bar */}
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <form onSubmit={handleTBASearch} className="flex-1 space-y-2">
                            <label className="text-sm font-medium text-muted-foreground ml-1">TBA Event Key</label>
                            <div className="relative">
                                <Input
                                    placeholder="e.g. 2024ilch, 2023cmpt..."
                                    value={tbaSearchKey}
                                    onChange={(e) => setTbaSearchKey(e.target.value)}
                                    className="pr-10 h-11"
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-50" />
                            </div>
                        </form>
                        <Button onClick={handleTBASearch} size="lg" disabled={tbaLoading} className="h-11 px-8">
                            {tbaLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                            Fetch Data
                        </Button>
                    </div>

                    {tbaLoading ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                            <div className="text-muted-foreground font-medium animate-pulse">Loading TBA data...</div>
                        </div>
                    ) : tbaEvent ? (
                        <Card className="border-none shadow-md overflow-hidden bg-gradient-to-br from-card to-muted/20">
                            <CardHeader className="bg-primary/5 pb-6">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div>
                                        <CardTitle className="text-2xl font-bold">{tbaEvent.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="font-mono">{tbaEvent.key}</Badge>
                                            <MapPin className="h-3 w-3" /> {tbaEvent.city}, {tbaEvent.state_prov}, {tbaEvent.country}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground whitespace-nowrap bg-background/50 p-2 rounded-lg border">
                                        <Calendar className="h-4 w-4" />
                                        {new Date(tbaEvent.start_date).toLocaleDateString()} - {new Date(tbaEvent.end_date).toLocaleDateString()}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="w-full">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                                        {/* Teams Section */}
                                        <Card className="border-2">
                                            <CardHeader className="pb-4">
                                                <CardTitle className="text-lg font-black flex items-center gap-2">
                                                    <Users className="h-5 w-5 text-primary" /> Teams ({tbaTeams.length})
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                                                    {tbaTeams.map(team => (
                                                        <Link key={team.key} href={`/teams/${team.team_number}`}>
                                                            <div className="p-3 border-2 rounded-xl bg-background hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group text-center">
                                                                <div className="text-xl font-black text-primary group-hover:scale-105 transition-transform">#{team.team_number}</div>
                                                                <div className="text-[9px] text-muted-foreground font-black truncate uppercase tracking-widest" title={team.nickname}>
                                                                    {team.nickname}
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Matches Section */}
                                        <Card className="border-2">
                                            <CardHeader className="pb-4">
                                                <CardTitle className="text-lg font-black flex items-center gap-2">
                                                    <Trophy className="h-5 w-5 text-primary" /> Matches ({tbaMatches.length})
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                                    {tbaMatches.slice(0, 50).map(match => (
                                                        <div key={match.key} className="flex items-center border-2 rounded-xl overflow-hidden h-12 bg-muted/10">
                                                            <div className="w-16 bg-muted flex flex-col items-center justify-center text-[9px] font-black uppercase shrink-0 border-r-2 h-full">
                                                                <span className="text-muted-foreground">{match.comp_level}</span>
                                                                <span className="text-base leading-none">{match.match_number}</span>
                                                            </div>
                                                            <div className="flex-1 flex px-3 items-center justify-between gap-2">
                                                                <div className="flex gap-2">
                                                                    {match.alliances.red.team_keys.map(tk => {
                                                                        const num = tk.replace('frc', '')
                                                                        return (
                                                                            <Link key={tk} href={`/teams/${num}`} className="text-xs font-black text-rose-600 hover:underline">
                                                                                {num}
                                                                            </Link>
                                                                        )
                                                                    })}
                                                                </div>
                                                                <div className="flex items-center gap-2 bg-background px-2 py-0.5 rounded-full border-2">
                                                                    <span className={`text-sm font-black ${match.winning_alliance === 'red' ? 'text-rose-600' : ''}`}>
                                                                        {match.alliances.red.score}
                                                                    </span>
                                                                    <span className="text-muted-foreground font-black">—</span>
                                                                    <span className={`text-sm font-black ${match.winning_alliance === 'blue' ? 'text-blue-600' : ''}`}>
                                                                        {match.alliances.blue.score}
                                                                    </span>
                                                                </div>
                                                                <div className="flex gap-2 justify-end">
                                                                    {match.alliances.blue.team_keys.map(tk => {
                                                                        const num = tk.replace('frc', '')
                                                                        return (
                                                                            <Link key={tk} href={`/teams/${num}`} className="text-xs font-black text-blue-600 hover:underline">
                                                                                {num}
                                                                            </Link>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {tbaMatches.length > 50 && (
                                                        <div className="pt-4 text-center">
                                                            <Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest opacity-50">
                                                                Showing first 50 matches
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <Globe className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No TBA data available for this event</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
