'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { getTBAData } from '@/lib/tba'
import { AlertModal } from '@/components/ui/AlertModal'
import { useSettings } from '@/contexts/SettingsContext'

function TeamNickname({ teamNumber, onNameFetched }: { teamNumber: string, onNameFetched?: (name: string) => void }) {
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
                if (data.nickname && onNameFetched) {
                    onNameFetched(data.nickname)
                }
            } catch (e) {
                setNickname(null)
            } finally {
                setLoading(false)
            }
        }
        const timer = setTimeout(fetchTBA, 500)
        return () => clearTimeout(timer)
    }, [teamNumber, onNameFetched])

    if (loading) return <Loader2 className="h-3 w-3 animate-spin opacity-40 ml-2" />
    if (!nickname) return null
    return <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 animate-in fade-in slide-in-from-right-1 truncate max-w-[200px]" title={nickname}>{nickname}</span>
}

function TeamNameSearch({ query, eventKey, onSelect }: { query: string, eventKey: string, onSelect: (teamNumber: number, teamName: string) => void }) {
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (query.length < 2) {
            setResults([])
            return
        }

        const searchTeams = async () => {
            setLoading(true)
            try {
                const teams = await getTBAData(`/event/${eventKey}/teams`)
                const matches = teams
                    .filter((t: any) =>
                        t.nickname?.toLowerCase().includes(query.toLowerCase()) ||
                        t.team_number?.toString().includes(query)
                    )
                    .slice(0, 8)
                setResults(matches)
            } catch (e) {
                setResults([])
            } finally {
                setLoading(false)
            }
        }

        const timer = setTimeout(searchTeams, 300)
        return () => clearTimeout(timer)
    }, [query, eventKey])

    if (loading) {
        return (
            <div className="absolute z-20 w-full mt-1 bg-popover border rounded-xl shadow-lg p-3 text-center animate-in fade-in zoom-in-95">
                <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
            </div>
        )
    }

    if (results.length === 0) {
        return (
            <div className="absolute z-20 w-full mt-1 bg-popover border rounded-xl shadow-lg p-3 text-center text-xs text-muted-foreground italic animate-in fade-in zoom-in-95">
                No teams found matching "{query}"
            </div>
        )
    }

    return (
        <div className="absolute z-20 w-full mt-1 bg-popover border rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="text-[10px] uppercase font-bold text-muted-foreground px-3 py-2 bg-muted/50 border-b">
                Select Team
            </div>
            {results.map((team) => (
                <button
                    key={team.key}
                    type="button"
                    onClick={() => onSelect(team.team_number, team.nickname)}
                    className="w-full text-left px-3 py-2 hover:bg-accent transition-colors border-b last:border-0"
                >
                    <div className="font-bold text-sm">{team.team_number} - {team.nickname}</div>
                    <div className="text-[10px] text-muted-foreground">{team.city}, {team.state_prov}</div>
                </button>
            ))}
        </div>
    )
}

const STEPS = {
    IDENTITY: 0,
    PHYSICAL: 1,
    SCORING: 2,
    ADVANCED: 3,
}

export default function PitScoutingForm() {
    const searchParams = useSearchParams()
    const teamParam = searchParams.get('team')
    const { settings } = useSettings()

    const [step, setStep] = useState(STEPS.IDENTITY)
    const [loading, setLoading] = useState(false)
    const [increment, setIncrement] = useState(1)
    const [validTeams, setValidTeams] = useState<number[]>([])

    // Alert Modal State
    const [alertConfig, setAlertConfig] = useState<{ open: boolean, title: string, message: string, variant?: 'success' | 'confirm' | 'info' }>({
        open: false,
        title: '',
        message: '',
        variant: 'info',
    })

    const showAlert = (title: string, message: string, variant: 'success' | 'confirm' | 'info' = 'info') => {
        setAlertConfig({ open: true, title, message, variant })
    }

    const supabase = createClient()

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const firstName = session?.user?.user_metadata?.first_name
            const fullName = session?.user?.user_metadata?.full_name
            const email = session?.user?.email

            let nameToUse = ''
            if (settings.auto_fill_scout_name && settings.scout_name) {
                nameToUse = settings.scout_name
            } else if (firstName) {
                nameToUse = firstName
            } else if (fullName) {
                nameToUse = fullName
            } else if (email) {
                nameToUse = email.split('@')[0] || email
            }

            if (nameToUse) {
                setFormData(prev => ({ ...prev, scout_name: nameToUse }))
            }
        }
        fetchUser()
    }, [supabase, settings])

    const [formData, setFormData] = useState({
        team_number: teamParam || (settings.default_team_number ? settings.default_team_number.toString() : ''),
        team_name: '',
        event_key: settings.event_key,
        weight: 80,
        fuel_capacity: 20,
        top_speed: 12,
        fuel_per_second: 10,
        primary_role: 'Offense',
        climb_level: '1',
        climbs_in_auto: false,
        obstacle_handling: 'None',
        drive_train: 'Swerve',
        confidence_drive: 50,
        confidence_shooter: 50,
        confidence_overall: 50,
        scout_name: settings.auto_fill_scout_name ? settings.scout_name : '',
        notes: '',
    })


    // Fetch valid teams for the event
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const teams = await getTBAData(`/event/${formData.event_key}/teams/simple`)
                setValidTeams(teams.map((t: any) => t.team_number).sort((a: number, b: number) => a - b))
            } catch (e) {
                console.error('Failed to fetch teams for event:', e)
                setValidTeams([])
            }
        }
        if (formData.event_key) {
            fetchTeams()
        }
    }, [formData.event_key])

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const validateStep = () => {
        if (step === STEPS.IDENTITY) {
            const isValidTeam = validTeams.includes(parseInt(formData.team_number));
            if (!formData.team_number || !formData.scout_name || !formData.event_key) {
                showAlert('Missing Information', 'Please provide Team #, Event, and Scout Name.');
                return false;
            }
            if (validTeams.length > 0 && !isValidTeam) {
                showAlert('Invalid Team', `Team ${formData.team_number} is not registered for ${formData.event_key}.`);
                return false;
            }
        }
        if (step === STEPS.PHYSICAL) {
            if (formData.weight < 0 || formData.weight > 135) {
                showAlert('Implausible Weight', 'Robot weight must be between 0 and 135 lbs.');
                return false;
            }
            if (formData.top_speed < 0 || formData.top_speed > 30) {
                showAlert('Implausible Speed', 'Top speed must be between 0 and 30 ft/s.');
                return false;
            }
        }
        if (step === STEPS.SCORING) {
            if (formData.fuel_capacity < 0 || formData.fuel_capacity > 500) {
                showAlert('Implausible Capacity', 'Fuel capacity must be between 0 and 500');
                return false;
            }
            if (formData.fuel_per_second < 0 || formData.fuel_per_second > 50) {
                showAlert('Implausible Rate', 'Fuel per second must be between 0 and 50');
                return false;
            }
        }
        return true;
    }

    const nextStep = () => {
        if (validateStep()) {
            setStep((prev) => Math.min(prev + 1, STEPS.ADVANCED));
        }
    }
    const prevStep = () => setStep((prev) => Math.max(prev - 1, STEPS.IDENTITY))

    const handleSubmit = async () => {
        setLoading(true)
        try {
            // Minimal required-fields check (allow registering new teams)
            if (!formData.team_number || !formData.scout_name || !formData.event_key) {
                showAlert('Missing Information', 'Please provide Team #, Event, and Scout Name.');
                setLoading(false)
                return
            }

            // Attempt to register the team in common team tables before inserting pit data.
            // Some deployments enforce a FK from `pit_scouting.team_number` to a teams table.
            try {
                await supabase.from('teams').upsert([
                    { team_number: parseInt(formData.team_number), team_name: formData.team_name }
                ], { onConflict: 'team_number' })
            } catch (e) {
                // ignore if table doesn't exist or upsert fails
            }
            try {
                await supabase.from('event_teams').upsert([
                    { team_number: parseInt(formData.team_number), event_key: formData.event_key }
                ], { onConflict: 'team_number,event_key' })
            } catch (e) {
                // ignore if table doesn't exist or upsert fails
            }
            // First try to delete existing entry, then insert new one
            await supabase.from('pit_scouting').delete().eq('team_number', parseInt(formData.team_number)).eq('event_key', formData.event_key)
            
            const { error } = await supabase.from('pit_scouting').insert([
                {
                    team_number: parseInt(formData.team_number),
                    team_name: formData.team_name,
                    event_key: formData.event_key,
                    robot_weight: formData.weight,
                    fuel_capacity: formData.fuel_capacity,
                    top_speed: formData.top_speed,
                    fuel_per_second: formData.fuel_per_second,
                    primary_role: formData.primary_role,
                    climb_level: parseInt(formData.climb_level),
                    climbs_in_auto: formData.climbs_in_auto,
                    obstacle_handling: formData.obstacle_handling,
                    drive_train_type: formData.drive_train,
                    confidence_drive: formData.confidence_drive,
                    confidence_shooter: formData.confidence_shooter,
                    confidence_overall: formData.confidence_overall,
                    scout_name: formData.scout_name,
                    comments: formData.notes,
                },
            ])

            if (error) {
                // Try to detect FK target table from Postgres message and auto-register
                const fkTableMatch = /is not present in table \"(.+?)\"/i.exec(error.details || error.message || '')
                if (fkTableMatch) {
                    const fkTable = fkTableMatch[1]
                    try {
                        // Build a sensible upsert payload depending on likely table name
                        const teamNum = parseInt(formData.team_number)
                        if (fkTable.toLowerCase().includes('event')) {
                            await supabase.from(fkTable).upsert([
                                { team_number: teamNum, event_key: formData.event_key }
                            ], { onConflict: 'team_number,event_key' })
                        } else {
                            await supabase.from(fkTable).upsert([
                                { team_number: teamNum, team_name: formData.team_name }
                            ], { onConflict: 'team_number' })
                        }

                        // Retry the insert once after attempting to register the missing row
                        const { error: retryErr } = await supabase.from('pit_scouting').insert([
                            {
                                team_number: parseInt(formData.team_number),
                                team_name: formData.team_name,
                                event_key: formData.event_key,
                                robot_weight: formData.weight,
                                fuel_capacity: formData.fuel_capacity,
                                top_speed: formData.top_speed,
                                fuel_per_second: formData.fuel_per_second,
                                primary_role: formData.primary_role,
                                climb_level: parseInt(formData.climb_level),
                                climbs_in_auto: formData.climbs_in_auto,
                                obstacle_handling: formData.obstacle_handling,
                                drive_train_type: formData.drive_train,
                                confidence_drive: formData.confidence_drive,
                                confidence_shooter: formData.confidence_shooter,
                                confidence_overall: formData.confidence_overall,
                                scout_name: formData.scout_name,
                                comments: formData.notes,
                            },
                        ])

                        if (retryErr) {
                            showAlert('Submission Error', retryErr.message)
                        } else {
                            showAlert('Success!', 'Pit data locked in successfully!', 'success')
                            setStep(STEPS.IDENTITY)
                            setFormData({
                                team_number: settings.default_team_number ? settings.default_team_number.toString() : '',
                                team_name: '',
                                event_key: settings.event_key,
                                weight: 0,
                                fuel_capacity: 0,
                                top_speed: 0,
                                fuel_per_second: 0,
                                primary_role: 'Offense',
                                climb_level: '1',
                                climbs_in_auto: false,
                                obstacle_handling: 'None',
                                drive_train: 'Swerve',
                                confidence_drive: 50,
                                confidence_shooter: 50,
                                confidence_overall: 50,
                                scout_name: settings.auto_fill_scout_name ? settings.scout_name : '',
                                notes: '',
                            })
                        }
                        setLoading(false)
                        return
                    } catch (upsertErr) {
                        // Fall through to show original error below
                        console.error('Auto-registration failed:', upsertErr)
                    }
                }

                // Fallback: show original error message
                const msg = /foreign key|violates foreign key/i.test(error.message || '')
                    ? `Submission failed: Team ${formData.team_number} is not registered in the database for this event. Please ensure the team exists in the system before submitting.`
                    : error.message
                showAlert('Submission Error', msg)
            } else {
                showAlert('Success!', 'Pit data locked in successfully!', 'success')
                setStep(STEPS.IDENTITY)
                setFormData({
                    team_number: settings.default_team_number ? settings.default_team_number.toString() : '',
                    team_name: '',
                    event_key: settings.event_key,
                    weight: 0,
                    fuel_capacity: 0,
                    top_speed: 0,
                    fuel_per_second: 0,
                    primary_role: 'Offense',
                    climb_level: '1',
                    climbs_in_auto: false,
                    obstacle_handling: 'None',
                    drive_train: 'Swerve',
                    confidence_drive: 50,
                    confidence_shooter: 50,
                    confidence_overall: 50,
                    scout_name: settings.auto_fill_scout_name ? settings.scout_name : '',
                    notes: '',
                })
            }
        } catch (err) {
            console.error('Unexpected error:', err)
        } finally {
            setLoading(false)
        }
    }

    const filteredTeams = validTeams
        .filter(num => num.toString().startsWith(formData.team_number))
        .slice(0, 5);

    return (
        <div className="max-w-md md:max-w-2xl mx-auto p-4">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Pit Scouting</CardTitle>
                    <CardDescription>Step {step + 1} of 4</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                    {step === STEPS.IDENTITY && (
                        <div className="space-y-4 animate-in slide-in-from-right-8 fade-in-0 duration-300">
                            <h3 className="text-lg font-semibold">Identity</h3>

                            <div className="space-y-4 bg-muted/20 p-4 rounded-2xl border border-dashed">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Competition Setup</h4>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                                    <div>
                                        <div className="text-[10px] uppercase font-bold text-primary tracking-widest leading-none mb-1">Active Competition</div>
                                        <div className="text-sm font-bold">Event Key: {settings.event_key}</div>
                                    </div>
                                    <Link href="/settings" className="text-xs text-primary hover:underline font-bold">
                                        Change
                                    </Link>
                                </div>
                            </div>

                            <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0 pt-2">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center gap-2">
                                        <Label htmlFor="team_number">Team # or Name</Label>
                                        {formData.team_number && (/^\d+$/.test(formData.team_number)) && (
                                            <TeamNickname
                                                teamNumber={formData.team_number}
                                                onNameFetched={(name) => {
                                                    if (!formData.team_name) {
                                                        handleInputChange('team_name', name)
                                                    }
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div className="relative group">
                                        <Input
                                            id="team_number"
                                            type="text"
                                            value={formData.team_number}
                                            onChange={(e) => {
                                                const value = e.target.value
                                                handleInputChange('team_number', value)
                                            }}
                                            placeholder="4213 or 'Metal Cow'"
                                            className={cn(
                                                validTeams.length > 0 && formData.team_number && /^\d+$/.test(formData.team_number) && !validTeams.includes(parseInt(formData.team_number)) ? "border-destructive focus-visible:ring-destructive" : ""
                                            )}
                                        />

                                        {/* Team name search results */}
                                        {formData.team_number && !/^\d+$/.test(formData.team_number) && (
                                            <TeamNameSearch
                                                query={formData.team_number}
                                                eventKey={formData.event_key}
                                                onSelect={(teamNumber, teamName) => {
                                                    handleInputChange('team_number', teamNumber.toString())
                                                    handleInputChange('team_name', teamName)
                                                }}
                                            />
                                        )}

                                        {validTeams.length > 0 && formData.team_number && /^\d+$/.test(formData.team_number) && !validTeams.includes(parseInt(formData.team_number)) && filteredTeams.length > 0 && (
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
                                    {validTeams.length > 0 && formData.team_number && /^\d+$/.test(formData.team_number) && !validTeams.includes(parseInt(formData.team_number)) && (
                                        <p className="text-[10px] text-destructive mt-1 font-medium">This team isn't registered for this event.</p>
                                    )}
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
                        </div>
                    )}

                    {step === STEPS.PHYSICAL && (
                        <div className="space-y-4 animate-in slide-in-from-right-8 fade-in-0 duration-300">
                            <h3 className="text-lg font-semibold text-blue-600">Physical Build</h3>

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
                                    <Label>Weight (lbs)</Label>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleInputChange('weight', Math.max(0, formData.weight - increment))}>-</Button>
                                        <Input
                                            type="number"
                                            className="text-center font-bold text-lg"
                                            min="0"
                                            max="200"
                                            value={formData.weight}
                                            onChange={(e) => handleInputChange('weight', Math.min(135, Math.max(0, parseFloat(e.target.value) || 0)))}
                                        />
                                        <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleInputChange('weight', Math.min(135, formData.weight + increment))}>+</Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Top Speed (ft/s)</Label>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleInputChange('top_speed', Math.max(0, formData.top_speed - increment))}>-</Button>
                                        <Input
                                            type="number"
                                            className="text-center font-bold text-lg"
                                            min="0"
                                            max="30"
                                            value={formData.top_speed}
                                            onChange={(e) => handleInputChange('top_speed', Math.min(30, Math.max(0, parseFloat(e.target.value) || 0)))}
                                        />
                                        <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleInputChange('top_speed', Math.min(30, formData.top_speed + increment))}>+</Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Drive Train Type</Label>
                                <div className="flex gap-2">
                                    {['Tank', 'Swerve'].map(type => (
                                        <Button
                                            key={type}
                                            type="button"
                                            variant={formData.drive_train === type ? 'default' : 'outline'}
                                            className="w-1/2"
                                            onClick={() => handleInputChange('drive_train', type)}
                                        >
                                            {type}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === STEPS.SCORING && (
                        <div className="space-y-4 animate-in slide-in-from-right-8 fade-in-0 duration-300">
                            <h3 className="text-lg font-semibold text-orange-600">Scoring Potential</h3>

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
                                    <Label>Fuel Capacity</Label>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleInputChange('fuel_capacity', Math.max(0, formData.fuel_capacity - increment))}>-</Button>
                                        <Input
                                            type="number"
                                            className="text-center font-bold text-lg"
                                            min="0"
                                            max="500"
                                            value={formData.fuel_capacity}
                                            onChange={(e) => handleInputChange('fuel_capacity', Math.min(500, Math.max(0, parseInt(e.target.value) || 0)))}
                                        />
                                        <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleInputChange('fuel_capacity', Math.min(500, formData.fuel_capacity + increment))}>+</Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Fuel / Sec (Theoretical)</Label>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleInputChange('fuel_per_second', Math.max(0, formData.fuel_per_second - increment))}>-</Button>
                                        <Input
                                            type="number"
                                            className="text-center font-bold text-lg"
                                            min="0"
                                            max={formData.fuel_capacity}
                                            value={formData.fuel_per_second}
                                            onChange={(e) => handleInputChange('fuel_per_second', Math.min(formData.fuel_capacity, Math.max(0, parseFloat(e.target.value) || 0)))}
                                        />
                                        <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleInputChange('fuel_per_second', formData.fuel_per_second + increment)}>+</Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Primary Game Role</Label>
                                <Select onValueChange={(v) => handleInputChange('primary_role', v)} value={formData.primary_role}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Offense">Offense</SelectItem>
                                        <SelectItem value="Defense">Defense</SelectItem>
                                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {step === STEPS.ADVANCED && (
                        <div className="space-y-4 animate-in slide-in-from-right-8 fade-in-0 duration-300">
                            <h3 className="text-lg font-semibold text-purple-600">Advanced Capabilities</h3>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Climb Level Capable</Label>
                                    <Select onValueChange={(v) => handleInputChange('climb_level', v)} value={formData.climb_level}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Level 1 (Lowest Hanging)</SelectItem>
                                            <SelectItem value="2">Level 2 (Mid Bar)</SelectItem>
                                            <SelectItem value="3">Level 3 (Top Bar)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between border p-3 rounded-lg">
                                    <Label>Climb in Auto?</Label>
                                    <input
                                        type="checkbox"
                                        checked={formData.climbs_in_auto}
                                        onChange={(e) => handleInputChange('climbs_in_auto', e.target.checked)}
                                        className="h-5 w-5"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Field Obstacle Handling</Label>
                                    <Select onValueChange={(v) => handleInputChange('obstacle_handling', v)} value={formData.obstacle_handling}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="None">None</SelectItem>
                                            <SelectItem value="Trench">Trench</SelectItem>
                                            <SelectItem value="Bump">Bump</SelectItem>
                                            <SelectItem value="Both">Both</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-4 border-t pt-4">
                                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Confidence Ratings</h4>

                                    <div className="space-y-2">
                                        <Label>Drive Confidence</Label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={formData.confidence_drive}
                                            onChange={(e) => handleInputChange('confidence_drive', parseInt(e.target.value))}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>No Confidence</span>
                                            <span className="font-bold text-primary">{formData.confidence_drive}%</span>
                                            <span>Very Confident</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Shooter Confidence</Label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={formData.confidence_shooter}
                                            onChange={(e) => handleInputChange('confidence_shooter', parseInt(e.target.value))}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>No Confidence</span>
                                            <span className="font-bold text-primary">{formData.confidence_shooter}%</span>
                                            <span>Very Confident</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Overall Robot Confidence</Label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={formData.confidence_overall}
                                            onChange={(e) => handleInputChange('confidence_overall', parseInt(e.target.value))}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>No Confidence</span>
                                            <span className="font-bold text-primary">{formData.confidence_overall}%</span>
                                            <span>Very Confident</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="notes">Scouter Observations</Label>
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-wider",
                                            formData.notes.length >= 180 ? "text-destructive" : "text-muted-foreground"
                                        )}>
                                            {formData.notes.length}/200
                                        </span>
                                    </div>
                                    <Textarea
                                        id="notes"
                                        placeholder="Any additional notes..."
                                        value={formData.notes}
                                        onChange={(e) => handleInputChange('notes', e.target.value)}
                                        maxLength={200}
                                        className="resize-none h-24"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={prevStep}
                        disabled={step === STEPS.IDENTITY}
                    >
                        Back
                    </Button>

                    {step < STEPS.ADVANCED ? (
                        <Button onClick={nextStep}>Next</Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Lock In Specs
                        </Button>
                    )}
                </CardFooter>
            </Card>

            <div className="flex justify-center mt-4 gap-2">
                {Object.values(STEPS).map((s) => (
                    <div
                        key={s}
                        className={`h-2 w-2 rounded-full transition-colors duration-150 ${s === step ? 'bg-primary ring-1 ring-primary/30' : 'bg-muted-foreground/40 dark:bg-muted-foreground/30 border border-muted-foreground/15'}`}
                        aria-hidden
                    />
                ))}
            </div>

            <AlertModal
                isOpen={alertConfig.open}
                onClose={() => setAlertConfig(prev => ({ ...prev, open: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                variant={alertConfig.variant}
            />
        </div>
    )
}
