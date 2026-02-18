'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSettings } from '@/contexts/SettingsContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Settings as SettingsIcon, Save, RotateCcw, Loader2, CheckCircle2, AlertCircle, User, Globe, Bell, Eye, Database, Wifi, WifiOff } from 'lucide-react'
import { getTBAData } from '@/lib/tba'
import { Separator } from '@/components/ui/separator'
import { AlertModal } from '@/components/ui/AlertModal'

function EventSearch({ currentEventKey, onSelect }: { currentEventKey: string, onSelect: (key: string) => void }) {
    const [query, setQuery] = useState('')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                const events = await getTBAData(`/events/${year}/simple`)
                const matches = events
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .filter((e: any) =>
                        (e.name?.toLowerCase() || '').includes(query.toLowerCase()) ||
                        (e.city?.toLowerCase() || '').includes(query.toLowerCase()) ||
                        (e.state_prov?.toLowerCase() || '').includes(query.toLowerCase()) ||
                        (e.key?.toLowerCase() || '').includes(query.toLowerCase())
                    )
                    .slice(0, 10)
                setSuggestions(matches)
            } catch {
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
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Search Event</Label>
                    <Input
                        placeholder="Search area or event..."
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
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
            )}
        </div>
    )
}

export default function SettingsPage() {
    const { settings, updateSettings, resetSettings, loading: settingsLoading, user } = useSettings()
    const [localSettings, setLocalSettings] = useState(settings)
    const [saving, setSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [confirmConfig, setConfirmConfig] = useState({ open: false, title: '', message: '' })

    useEffect(() => {
        if (!settingsLoading) {
            setLocalSettings(settings)
        }
    }, [settings, settingsLoading])

    const handleSave = async () => {
        setSaving(true)
        setSaveStatus('idle')
        try {
            await updateSettings(localSettings)
            setSaveStatus('success')
            setTimeout(() => setSaveStatus('idle'), 3000)
        } catch {
            setSaveStatus('error')
        } finally {
            setSaving(false)
        }
    }

    const handleReset = async () => {
        setConfirmConfig({
            open: true,
            title: 'Reset Settings',
            message: 'Are you sure you want to reset all settings to defaults? This action cannot be undone.',
        })
    }

    const handleConfirmReset = async () => {
        await resetSettings()
        setLocalSettings(settings)
    }

    if (settingsLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                <div className="text-muted-foreground font-medium animate-pulse">Loading settings...</div>
            </div>
        )
    }

    return (
        <div className="container py-8 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <SettingsIcon className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Settings</h1>
                        <p className="text-muted-foreground">Configure your scouting preferences</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handleReset} 
                        className="h-10 w-10"
                        title="Reset Settings"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={saving} 
                        className="h-10 w-10 p-0"
                        title="Save Settings"
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>

            {saveStatus === 'success' && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-bold">Settings saved successfully!</span>
                </div>
            )}

            {saveStatus === 'error' && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-bold">Failed to save settings. Please try again.</span>
                </div>
            )}

            {!user && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">
                        Not logged in. Settings will not persist across sessions. <Link href="/login" className="underline font-bold">Login</Link> to save settings to your account.
                    </span>
                </div>
            )}

            <div className="space-y-6">
                <Card className="border-2 shadow-lg">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg font-black">Competition Settings</CardTitle>
                        </div>
                        <CardDescription>Configure event and competition preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="event_key" className="text-sm font-bold">Event Key</Label>
                                <EventSearch
                                    currentEventKey={localSettings.event_key}
                                    onSelect={(key) => setLocalSettings(prev => ({ ...prev, event_key: key }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="default_team_number" className="text-sm font-bold">Default Team Number</Label>
                                <Input
                                    id="default_team_number"
                                    type="number"
                                    value={localSettings.default_team_number || ''}
                                    onChange={(e) => setLocalSettings(prev => ({ 
                                        ...prev, 
                                        default_team_number: e.target.value ? parseInt(e.target.value) : null 
                                    }))}
                                    placeholder="e.g. 254"
                                />
                                <p className="text-xs text-muted-foreground">Pre-fill team number in scouting forms</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-lg">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg font-black">Scout Preferences</CardTitle>
                        </div>
                        <CardDescription>Personalize your scouting experience</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="scout_name" className="text-sm font-bold">Scout Name</Label>
                                <Input
                                    id="scout_name"
                                    value={localSettings.scout_name}
                                    onChange={(e) => setLocalSettings(prev => ({ ...prev, scout_name: e.target.value }))}
                                    placeholder="Enter your scout name"
                                />
                                <p className="text-xs text-muted-foreground">This name will be attached to your scouting entries</p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold">Auto-fill Scout Name</Label>
                                    <p className="text-xs text-muted-foreground">Automatically use your profile name</p>
                                </div>
                                <Switch
                                    checked={localSettings.auto_fill_scout_name}
                                    onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, auto_fill_scout_name: checked }))}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-lg">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                            <Eye className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg font-black">Display Preferences</CardTitle>
                        </div>
                        <CardDescription>Customize how the app looks and behaves</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-bold">Compact View</Label>
                                <p className="text-xs text-muted-foreground">Use smaller UI elements</p>
                            </div>
                            <Switch
                                checked={localSettings.compact_view}
                                onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, compact_view: checked }))}
                            />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-bold">Show TBA Data</Label>
                                <p className="text-xs text-muted-foreground">Display The Blue Alliance information</p>
                            </div>
                            <Switch
                                checked={localSettings.show_tba_data}
                                onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, show_tba_data: checked }))}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-lg">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg font-black">Data & Sync</CardTitle>
                        </div>
                        <CardDescription>Configure data handling and synchronization</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-bold">Auto Sync</Label>
                                <p className="text-xs text-muted-foreground">Automatically sync data when online</p>
                            </div>
                            <Switch
                                checked={localSettings.auto_sync}
                                onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, auto_sync: checked }))}
                            />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-bold">Offline Mode</Label>
                                <p className="text-xs text-muted-foreground">Enable offline data collection</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {localSettings.offline_mode ? (
                                    <WifiOff className="h-4 w-4 text-amber-500" />
                                ) : (
                                    <Wifi className="h-4 w-4 text-muted-foreground" />
                                )}
                                <Switch
                                    checked={localSettings.offline_mode}
                                    onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, offline_mode: checked }))}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-lg">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg font-black">Notifications</CardTitle>
                        </div>
                        <CardDescription>Manage alerts and notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-bold">Enable Notifications</Label>
                                <p className="text-xs text-muted-foreground">Receive push notifications</p>
                            </div>
                            <Switch
                                checked={localSettings.enable_notifications}
                                onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, enable_notifications: checked }))}
                            />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-bold">Notify on Submit</Label>
                                <p className="text-xs text-muted-foreground">Show confirmation after submitting</p>
                            </div>
                            <Switch
                                checked={localSettings.notify_on_submit}
                                onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, notify_on_submit: checked }))}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AlertModal
                isOpen={confirmConfig.open}
                onClose={() => setConfirmConfig(prev => ({ ...prev, open: false }))}
                title={confirmConfig.title}
                message={confirmConfig.message}
                variant="confirm"
                onConfirm={handleConfirmReset}
                confirmLabel="Reset"
            />
        </div>
    )
}
