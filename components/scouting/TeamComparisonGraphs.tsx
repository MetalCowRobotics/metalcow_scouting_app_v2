'use client'

import { useState, useMemo } from 'react'
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    BarChart,
    Bar,
    Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Activity, BarChart3, Zap, Shield, Target } from 'lucide-react'

interface TeamComparisonGraphsProps {
    stats: any[]
}

const METRICS = [
    { label: 'Avg Match Score', value: 'avg_actual_score', icon: Target },
    { label: 'Defense Rating', value: 'avg_defense', icon: Shield },
    { label: 'Robot Weight', value: 'robot_weight', icon: Zap },
    { label: 'Actual Speed (fps)', value: 'actual_fps', icon: Activity },
    { label: 'Fuel Capacity', value: 'fuel_capacity', icon: BarChart3 },
    { label: 'Top Speed (Pit)', value: 'top_speed', icon: Activity },
]

export default function TeamComparisonGraphs({ stats }: TeamComparisonGraphsProps) {
    const router = useRouter()
    const [chartType, setChartType] = useState<'scatter' | 'bar'>('scatter')
    const [xAxis, setXAxis] = useState('avg_actual_score')
    const [yAxis, setYAxis] = useState('avg_defense')

    const data = useMemo(() => {
        return stats.map(s => ({
            ...s,
            name: `Team ${s.team_number}`,
            x: s[xAxis] || 0,
            y: s[yAxis] || 0,
            z: 100 // Size in scatter
        }))
    }, [stats, xAxis, yAxis])

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const team = payload[0].payload
            return (
                <div className="pointer-events-none bg-background/95 backdrop-blur-md border-2 border-primary/20 p-4 rounded-2xl shadow-2xl space-y-2">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <span className="text-xl font-black text-primary">#{team.team_number}</span>
                        <span className="text-xs font-bold text-muted-foreground truncate max-w-[120px]">{team.nickname}</span>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[10px] font-black uppercase text-muted-foreground">{METRICS.find(m => m.value === xAxis)?.label}</div>
                        <div className="text-lg font-black">{team.x.toFixed(2)}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[10px] font-black uppercase text-muted-foreground">{METRICS.find(m => m.value === yAxis)?.label}</div>
                        <div className="text-lg font-black">{team.y.toFixed(2)}</div>
                    </div>
                    <div className="text-[9px] italic text-primary font-bold animate-pulse pt-1">Click to view profile →</div>
                </div>
            )
        }
        return null
    }

    const handleClick = (point: any) => {
        if (point && point.team_number) {
            router.push(`/teams/${point.team_number}`)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Controls */}
            <Card className="border-2 shadow-xl bg-muted/5">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chart Visualization</label>
                            <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
                                <SelectTrigger className="h-12 border-2 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="scatter">Scatter Comparison (Distro)</SelectItem>
                                    <SelectItem value="bar">Bar Rankings (Leaderboard)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">X-Axis (Horizontal)</label>
                            <Select value={xAxis} onValueChange={(v) => v && setXAxis(v)}>
                                <SelectTrigger className="h-12 border-2 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {METRICS.map(m => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Y-Axis (Vertical)</label>
                            <Select value={yAxis} onValueChange={(v) => v && setYAxis(v)} disabled={chartType === 'bar'}>
                                <SelectTrigger className="h-12 border-2 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {METRICS.map(m => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Chart Area */}
            <Card className="border-2 shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
                <CardHeader className="bg-primary/5 border-b shrink-0 px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-2xl font-black flex items-center gap-2">
                                <Activity className="h-6 w-6 text-primary" />
                                {METRICS.find(m => m.value === xAxis)?.label} vs {METRICS.find(m => m.value === yAxis)?.label}
                            </CardTitle>
                            <CardDescription className="font-bold">Comparative analysis of all scouted teams at the event</CardDescription>
                        </div>
                        <Badge variant="secondary" className="font-black text-[10px] py-1 px-3 uppercase tracking-widest">
                            {data.length} Teams Data Point
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-8 flex-1 flex flex-col items-center justify-center">
                    <div className="w-full h-[450px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'scatter' ? (
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis
                                        type="number"
                                        dataKey="x"
                                        name={xAxis}
                                        unit=""
                                        stroke="#888888"
                                        fontSize={12}
                                        fontWeight="bold"
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="y"
                                        name={yAxis}
                                        unit=""
                                        stroke="#888888"
                                        fontSize={12}
                                        fontWeight="bold"
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <ZAxis type="number" dataKey="z" range={[100, 100]} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'hsl(var(--primary))', strokeWidth: 1 }} />
                                    <Scatter
                                        name="Teams"
                                        data={data}
                                        className="cursor-pointer"
                                        onClick={(e) => handleClick(e)}
                                    >
                                        {data.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={`hsl(${220 + (index * 15) % 100}, 80%, 50%)`}
                                                stroke="white"
                                                strokeWidth={2}
                                                className="hover:scale-125 hover:stroke-primary transition-all duration-200 shadow-xl"
                                            />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            ) : (
                                <BarChart data={[...data].sort((a, b) => b.x - a.x)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis
                                        dataKey="team_number"
                                        stroke="#888888"
                                        fontSize={10}
                                        fontWeight="black"
                                        axisLine={false}
                                        tickLine={false}
                                        angle={-45}
                                        textAnchor="end"
                                        interval={0}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        fontWeight="bold"
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        content={<CustomTooltip />}
                                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    />
                                    <Bar
                                        dataKey="x"
                                        fill="hsl(var(--primary))"
                                        radius={[10, 10, 0, 0]}
                                        className="cursor-pointer"
                                        onClick={(e) => handleClick(e)}
                                    >
                                        {data.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={index < 3 ? 'hsl(var(--primary))' : 'rgba(0,0,0,0.1)'}
                                                className="hover:fill-primary transition-colors"
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                    {chartType === 'scatter' && (
                        <div className="mt-8 flex gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 border-t pt-6 w-full justify-center">
                            <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-primary" /> Individual Teams</div>
                            <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-muted border" /> Low Density</div>
                            <div className="text-primary italic">Click any point to deep-dive team profile</div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
