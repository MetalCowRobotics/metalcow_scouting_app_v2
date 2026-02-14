'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, AlertTriangle } from 'lucide-react'
import { getTBAData } from '@/lib/tba'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function AlertModal({ isOpen, onClose, title, message }: { isOpen: boolean, onClose: () => void, title: string, message: string }) {
    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogMedia className="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500">
                        <AlertTriangle className="h-6 w-6" />
                    </AlertDialogMedia>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {message}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={onClose} className="bg-amber-600 hover:bg-amber-700 text-white">
                        Got it
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

function TeamNickname({ teamNumber }: { teamNumber: string }) {
    const [nickname, setNickname] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!teamNumber) {
            setNickname(null)
            return
        }
        const fetchTBA = async () => {
            setLoading(true)
            try {
                const data = await getTBAData(`/team/frc${teamNumber}`)
                setNickname(data.nickname)
            } catch (e) {
                setNickname(null)
            } finally {
                setLoading(false)
            }
        }
        const timer = setTimeout(fetchTBA, 500)
        return () => clearTimeout(timer)
    }, [teamNumber])

    if (loading) return <Loader2 className="h-3 w-3 animate-spin opacity-40 ml-2" />
    if (!nickname) return null
    return <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 animate-in fade-in slide-in-from-right-1 truncate max-w-[200px]" title={nickname}>{nickname}</span>
}

function EventSearch({ currentEventKey, onSelect }: { currentEventKey: string, onSelect: (key: string) => void }) {
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [year, setYear] = useState(new Date().getFullYear().toString())

    useEffect(() => {
        if (query.length < 3) {
            setSuggestions([])
            return
        }
        const searchEvents = async () => {
            setLoading(true)
            try {
                // Fetch all events for the year and filter locally (TBA search is limited)
                const events = await getTBAData(`/events/${year}/simple`)
                const matches = events
                    .filter((e: any) =>
                        e.name.toLowerCase().includes(query.toLowerCase()) ||
                        e.city.toLowerCase().includes(query.toLowerCase()) ||
                        e.state_prov?.toLowerCase().includes(query.toLowerCase())
                    )
                    .slice(0, 5)
                setSuggestions(matches)
            } catch (e) {
                setSuggestions([])
            } finally {
                setLoading(false)
            }
        }
        const timer = setTimeout(searchEvents, 500)
        return () => clearTimeout(timer)
    }, [query, year])

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <div className="w-24">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Year</Label>
                    <Input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="h-10"
                    />
                </div>
                <div className="flex-1 relative">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Search Event (e.g. "Chicago" or "Midwest")</Label>
                    <Input
                        placeholder="Search area or event name..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="h-10 pr-8"
                    />
                    {loading && <Loader2 className="absolute right-3 top-[34px] -translate-y-1/2 h-4 w-4 animate-spin opacity-40" />}

                    {suggestions.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-popover border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                            {suggestions.map(e => (
                                <button
                                    key={e.key}
                                    type="button"
                                    onClick={() => {
                                        onSelect(e.key)
                                        setQuery('')
                                        setSuggestions([])
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-0"
                                >
                                    <div className="font-bold text-sm">{e.name}</div>
                                    <div className="text-[10px] text-muted-foreground flex justify-between">
                                        <span>{e.city}, {e.state_prov}</span>
                                        <span className="font-mono bg-muted px-1 rounded">{e.key}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {currentEventKey && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20 animate-in zoom-in-95">
                    <div>
                        <div className="text-[10px] uppercase font-bold text-primary tracking-widest leading-none mb-1">Active Competition</div>
                        <div className="text-sm font-bold truncate max-w-[200px]">Event Key: {currentEventKey}</div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Define the steps
const STEPS = {
    PREMATCH: 0,
    AUTO: 1,
    TELEOP: 2,
    ENDGAME: 3,
    SUBMIT: 4,
}

export default function MatchScoutingForm() {
    const [step, setStep] = useState(STEPS.PREMATCH)
    const [loading, setLoading] = useState(false)
    const [increment, setIncrement] = useState(1)
    const [validTeams, setValidTeams] = useState<number[]>([])

    // Alert Modal State
    const [alertConfig, setAlertConfig] = useState<{ open: boolean, title: string, message: string }>({
        open: false,
        title: '',
        message: ''
    })

    const showAlert = (title: string, message: string) => {
        setAlertConfig({ open: true, title, message })
    }

    const [formData, setFormData] = useState({
        // Meta
        match_number: '',
        team_number: '',
        event_key: '2025ilpe',
        alliance: '',
        scout_name: '',
        is_practice_match: false,

        // Auto
        auto_preloaded: false,
        auto_active: false,
        auto_fuel_scored: 0,
        auto_fuel_pickup_location: 'None',
        auto_climb: false,
        auto_climb_location: 'None',
        start_position: '',

        // Teleop
        teleop_fuel_scored: 0,
        teleop_zone_control: 'Neutral',
        teleop_descended_from_auto: false,
        teleop_fuel_shuttled_start: '', // Simplified for MVP
        teleop_fuel_shuttled_end: '',   // Simplified for MVP
        teleop_pickup_locations: [] as string[],    // TODO: Multi-select implementation

        // Endgame
        defense_rating: 3,
        accuracy_rating: 3,
        ranking_points_contributed: 0,
        robot_status: 'Functional',
        comments: '',
    })

    // Fetch valid teams for the event
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const teams = await getTBAData(`/event/${formData.event_key}/teams/simple`)
                setValidTeams(teams.map((t: any) => t.team_number).sort((a: number, b: number) => a - b))
                // Clear team number if it's not in the new list (optional, but safer)
                setFormData(prev => ({ ...prev, team_number: '' }))
            } catch (e) {
                console.error('Failed to fetch teams for event:', e)
                setValidTeams([])
            }
        }
        if (formData.event_key) {
            fetchTeams()
        }
    }, [formData.event_key])

    const supabase = createClient()

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const { error } = await supabase.from('match_scouting').insert([
                {
                    ...formData, // Spread the form data
                    match_number: parseInt(formData.match_number),
                    team_number: parseInt(formData.team_number),
                    // Ensure other fields are parsed if necessary or matches schema types
                },
            ])

            if (error) {
                console.error('Error submitting match data:', error)
                alert('Error submitting data: ' + error.message)
            } else {
                alert('Match data submitted successfully!')
                // Reset form or redirect
                setStep(STEPS.PREMATCH)
                setFormData({
                    match_number: '',
                    team_number: '',
                    event_key: '2025ilpe',
                    alliance: '',
                    scout_name: '',
                    is_practice_match: false,
                    auto_preloaded: false,
                    auto_active: false,
                    auto_fuel_scored: 0,
                    auto_fuel_pickup_location: 'None',
                    auto_climb: false,
                    auto_climb_location: 'None',
                    start_position: '',
                    teleop_fuel_scored: 0,
                    teleop_zone_control: 'Neutral',
                    teleop_descended_from_auto: false,
                    teleop_fuel_shuttled_start: '',
                    teleop_fuel_shuttled_end: '',
                    teleop_pickup_locations: [],
                    defense_rating: 3,
                    accuracy_rating: 3,
                    ranking_points_contributed: 0,
                    robot_status: 'Functional',
                    comments: '',
                })
            }
        } catch (err) {
            console.error('Unexpected error:', err)
            alert('Unexpected error occurred.')
        } finally {
            setLoading(false)
        }
    }

    // Auto-detect current event by location and time
    useEffect(() => {
        const detectEvent = async (lat: number, lon: number) => {
            try {
                const year = 2025 // Using the user's requested season
                const events = await getTBAData(`/events/${year}`)
                const now = new Date()

                // Find events happening now (within start/end dates)
                const activeEvents = events.filter((e: any) => {
                    const start = new Date(e.start_date)
                    const end = new Date(e.end_date)
                    // Extend end date by 1 day for travel/cleanup
                    end.setDate(end.getDate() + 1)
                    return now >= start && now <= end
                })

                if (activeEvents.length > 0) {
                    // Find the closest one if multiple are active
                    let closest = activeEvents[0]
                    let minDistance = Infinity

                    activeEvents.forEach((e: any) => {
                        if (e.lat && e.lng) {
                            const d = Math.sqrt(Math.pow(e.lat - lat, 2) + Math.pow(e.lng - lon, 2))
                            if (d < minDistance) {
                                minDistance = d
                                closest = e
                            }
                        }
                    })

                    // If it's reasonably close (within ~1 degree), auto-set it
                    if (minDistance < 2) {
                        handleInputChange('event_key', closest.key)
                    }
                }
            } catch (e) {
                console.error('Failed to auto-detect event:', e)
            }
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => detectEvent(pos.coords.latitude, pos.coords.longitude),
                (err) => console.log('Geolocation declined or failed:', err.message)
            )
        }
    }, [])

    const validateStep = () => {
        if (step === STEPS.PREMATCH) {
            const isValidTeam = validTeams.includes(parseInt(formData.team_number));
            if (!formData.match_number || !formData.team_number || !formData.alliance || !formData.scout_name) {
                showAlert('Missing Information', 'Please fill out all fields (Match #, Team #, Alliance, Scout Name) before moving forward.');
                return false;
            }
            if (validTeams.length > 0 && !isValidTeam) {
                showAlert('Invalid Team', `Team ${formData.team_number} is not registered for the selected event. Please check the competition roster.`);
                return false;
            }
        }
        if (step === STEPS.AUTO) {
            if (!formData.start_position) {
                showAlert('Position Required', 'You must select a starting position for the robot before entering the Teleop phase.');
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep()) {
            setStep((prev) => Math.min(prev + 1, STEPS.SUBMIT));
        }
    }
    const prevStep = () => setStep((prev) => Math.max(prev - 1, STEPS.PREMATCH))

    const filteredTeams = validTeams
        .filter(num => num.toString().startsWith(formData.team_number))
        .slice(0, 5); // Show top 5 matches

    return (
        <div className="max-w-md md:max-w-2xl mx-auto p-4">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Match Scouting</CardTitle>
                    <CardDescription>Step {step + 1} of 4</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                    {step === STEPS.PREMATCH && (
                        <div className="space-y-4 animate-in slide-in-from-right-8 fade-in-0 duration-300">
                            <h3 className="text-lg font-semibold">Pre-Match Info</h3>

                            <div className="space-y-4 bg-muted/20 p-4 rounded-2xl border border-dashed">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Competition Setup</h4>
                                <EventSearch
                                    currentEventKey={formData.event_key}
                                    onSelect={(key) => handleInputChange('event_key', key)}
                                />
                            </div>

                            <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="match_number">Match #</Label>
                                    <Input
                                        id="match_number"
                                        type="number"
                                        value={formData.match_number}
                                        onChange={(e) => handleInputChange('match_number', e.target.value)}
                                        placeholder="1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center gap-2">
                                        <Label htmlFor="team_number">Team #</Label>
                                        {formData.team_number && (
                                            <TeamNickname teamNumber={formData.team_number} />
                                        )}
                                    </div>
                                    <div className="relative group">
                                        <Input
                                            id="team_number"
                                            type="number"
                                            value={formData.team_number}
                                            onChange={(e) => handleInputChange('team_number', e.target.value)}
                                            placeholder="254"
                                            className={cn(
                                                validTeams.length > 0 && formData.team_number && !validTeams.includes(parseInt(formData.team_number)) ? "border-destructive focus-visible:ring-destructive" : ""
                                            )}
                                        />

                                        {/* Smart Search Results */}
                                        {validTeams.length > 0 && formData.team_number && !validTeams.includes(parseInt(formData.team_number)) && filteredTeams.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-popover border rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95">
                                                <div className="text-[10px] uppercase font-bold text-muted-foreground px-3 py-2 bg-muted/50 border-b">Suggested Teams</div>
                                                {filteredTeams.map(num => (
                                                    <button
                                                        key={num}
                                                        type="button"
                                                        onClick={() => handleInputChange('team_number', num.toString())}
                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors border-b last:border-0"
                                                    >
                                                        Team {num}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {validTeams.length > 0 && formData.team_number && !validTeams.includes(parseInt(formData.team_number)) && (
                                        <p className="text-[10px] text-destructive mt-1 font-medium">This team isn't registered for this event.</p>
                                    )}
                                </div>
                            </div>

                            <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
                                <div className="space-y-2">
                                    <Label>Alliance</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={formData.alliance === 'Red' ? 'destructive' : 'outline'}
                                            className="w-1/2"
                                            onClick={() => handleInputChange('alliance', 'Red')}
                                        >Red</Button>
                                        <Button
                                            type="button"
                                            variant={formData.alliance === 'Blue' ? 'default' : 'outline'}
                                            className={`w-1/2 ${formData.alliance === 'Blue' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                                            onClick={() => handleInputChange('alliance', 'Blue')}
                                        >Blue</Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="scout_name">Scout Name</Label>
                                    <Input
                                        id="scout_name"
                                        value={formData.scout_name}
                                        onChange={(e) => handleInputChange('scout_name', e.target.value)}
                                        placeholder="Enter your name"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="practice"
                                    checked={formData.is_practice_match}
                                    onChange={(e) => handleInputChange('is_practice_match', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="practice" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Practice Match?
                                </Label>
                            </div>
                        </div>
                    )}

                    {step === STEPS.AUTO && (
                        <div className="space-y-4 animate-in slide-in-from-right-8 fade-in-0 duration-300">
                            <h3 className="text-lg font-semibold text-purple-600">Autonomous Phase</h3>

                            <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
                                <div className="flex items-center justify-between border p-3 rounded-lg">
                                    <Label>Preloaded?</Label>
                                    <input
                                        type="checkbox"
                                        checked={formData.auto_preloaded}
                                        onChange={(e) => handleInputChange('auto_preloaded', e.target.checked)}
                                        className="h-5 w-5"
                                    />
                                </div>

                                <div className="flex items-center justify-between border p-3 rounded-lg">
                                    <Label>Robot Active?</Label>
                                    <input
                                        type="checkbox"
                                        checked={formData.auto_active}
                                        onChange={(e) => handleInputChange('auto_active', e.target.checked)}
                                        className="h-5 w-5"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg">
                                <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Increment Step</Label>
                                <div className="flex bg-background rounded-md p-1 border">
                                    {[1, 5, 10].map(val => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setIncrement(val)}
                                            className={`px-3 py-1 text-xs font-bold rounded ${increment === val ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                                        >
                                            +{val}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
                                <div className="space-y-2">
                                    <Label>Fuel Scored</Label>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleInputChange('auto_fuel_scored', Math.max(0, formData.auto_fuel_scored - increment))}>-</Button>
                                        <Input
                                            type="number"
                                            className="text-center font-bold text-lg"
                                            value={formData.auto_fuel_scored}
                                            onChange={(e) => handleInputChange('auto_fuel_scored', parseInt(e.target.value) || 0)}
                                        />
                                        <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleInputChange('auto_fuel_scored', formData.auto_fuel_scored + increment)}>+</Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Start Position</Label>
                                    <Select onValueChange={(val) => handleInputChange('start_position', val || '')} value={formData.start_position || ''}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Position" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Left">Left</SelectItem>
                                            <SelectItem value="Center">Center</SelectItem>
                                            <SelectItem value="Right">Right</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Auto Climb?</Label>
                                <div className="flex gap-2">
                                    <Button
                                        variant={formData.auto_climb ? 'default' : 'outline'}
                                        onClick={() => handleInputChange('auto_climb', !formData.auto_climb)}
                                        className="w-full"
                                    >
                                        {formData.auto_climb ? 'Yes' : 'No'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === STEPS.TELEOP && (
                        <div className="space-y-4 animate-in slide-in-from-right-8 fade-in-0 duration-300">
                            <h3 className="text-lg font-semibold text-orange-600">Teleop Phase</h3>

                            <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg text-orange-600">
                                <Label className="text-xs uppercase font-bold opacity-70 tracking-wider">Increment Step</Label>
                                <div className="flex bg-background rounded-md p-1 border border-orange-200">
                                    {[1, 5, 10].map(val => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setIncrement(val)}
                                            className={`px-3 py-1 text-xs font-bold rounded ${increment === val ? 'bg-orange-600 text-white' : 'hover:bg-orange-50'}`}
                                        >
                                            +{val}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
                                <div className="space-y-2">
                                    <Label>Fuel Scored (Estimate)</Label>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleInputChange('teleop_fuel_scored', Math.max(0, formData.teleop_fuel_scored - increment))}>-</Button>
                                        <Input
                                            type="number"
                                            className="text-center font-bold text-lg"
                                            value={formData.teleop_fuel_scored}
                                            onChange={(e) => handleInputChange('teleop_fuel_scored', parseInt(e.target.value) || 0)}
                                        />
                                        <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleInputChange('teleop_fuel_scored', formData.teleop_fuel_scored + increment)}>+</Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Zone Control</Label>
                                    <Select onValueChange={(val) => handleInputChange('teleop_zone_control', val || '')} value={formData.teleop_zone_control || ''}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Zone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Alliance">Alliance</SelectItem>
                                            <SelectItem value="Neutral">Neutral</SelectItem>
                                            <SelectItem value="Opposing">Opposing</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border p-3 rounded-lg">
                                <Label>Descended from Auto?</Label>
                                <input
                                    type="checkbox"
                                    checked={formData.teleop_descended_from_auto}
                                    onChange={(e) => handleInputChange('teleop_descended_from_auto', e.target.checked)}
                                    className="h-5 w-5"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Shuttle Start</Label>
                                    <Select onValueChange={(val) => handleInputChange('teleop_fuel_shuttled_start', val)} value={formData.teleop_fuel_shuttled_start}>
                                        <SelectTrigger><SelectValue placeholder="Loc" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Source">Source</SelectItem>
                                            <SelectItem value="Ground">Ground</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Shuttle End</Label>
                                    <Select onValueChange={(val) => handleInputChange('teleop_fuel_shuttled_end', val)} value={formData.teleop_fuel_shuttled_end}>
                                        <SelectTrigger><SelectValue placeholder="Loc" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Amp">Amp</SelectItem>
                                            <SelectItem value="Speaker">Speaker</SelectItem>
                                            <SelectItem value="Trap">Trap</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Pickup Locations</Label>
                                <div className="flex flex-wrap gap-2">
                                    {['Floor', 'Depot', 'Outpost'].map((loc) => (
                                        <Button
                                            key={loc}
                                            type="button"
                                            variant={formData.teleop_pickup_locations.includes(loc) ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => {
                                                const current = formData.teleop_pickup_locations as string[];
                                                const newLocs = current.includes(loc)
                                                    ? current.filter(l => l !== loc)
                                                    : [...current, loc];
                                                handleInputChange('teleop_pickup_locations', newLocs);
                                            }}
                                        >
                                            {loc}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === STEPS.ENDGAME && (
                        <div className="space-y-4 animate-in slide-in-from-right-8 fade-in-0 duration-300">
                            <h3 className="text-lg font-semibold text-green-600">Endgame & Post-Match</h3>

                            <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
                                <div className="space-y-2">
                                    <Label>Defense Rating (1-5)</Label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="5"
                                        value={formData.defense_rating}
                                        onChange={(e) => handleInputChange('defense_rating', parseInt(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Poor</span>
                                        <span>Average</span>
                                        <span>Excellent</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Accuracy Rating (1-5)</Label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="5"
                                        value={formData.accuracy_rating}
                                        onChange={(e) => handleInputChange('accuracy_rating', parseInt(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Robot Status</Label>
                                <Select onValueChange={(val) => handleInputChange('robot_status', val || '')} value={formData.robot_status || ''}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Functional">Functional</SelectItem>
                                        <SelectItem value="Partially Functional">Partially Functional</SelectItem>
                                        <SelectItem value="Broken">Broken</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Comments</Label>
                                <Textarea
                                    placeholder="Any observations..."
                                    value={formData.comments}
                                    onChange={(e) => handleInputChange('comments', e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={prevStep}
                        disabled={step === STEPS.PREMATCH}
                    >
                        Back
                    </Button>

                    {step < STEPS.ENDGAME ? (
                        <Button onClick={nextStep}>Next</Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Match
                        </Button>
                    )}
                </CardFooter>
            </Card>

            {/* Simple Step Indicator */}
            <div className="flex justify-center mt-4 gap-2">
                {Object.values(STEPS).filter(s => typeof s === 'number' && s < 4).map((s) => (
                    <div
                        key={s}
                        className={`h-2 w-2 rounded-full ${s === step ? 'bg-primary' : 'bg-muted'}`}
                    />
                ))}
            </div>

            <AlertModal
                isOpen={alertConfig.open}
                onClose={() => setAlertConfig(prev => ({ ...prev, open: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
            />
        </div>
    )
}
