'use client'

import { useState, useEffect } from 'react'
import AdminRoute from '@/components/auth/AdminRoute'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Users, Database, Settings, Trash2, RefreshCw, AlertCircle, Check, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { AlertModal } from '@/components/ui/AlertModal'
import { useSettings } from '@/contexts/SettingsContext'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { setUserRole, getAllUserRoles, getDefaultPermissions, UserRole, UserPermissions } from '@/lib/admin'

export default function AdminPage() {
    const { settings, user: currentUser } = useSettings()
    const [activeSection, setActiveSection] = useState<'overview' | 'data' | 'users'>('overview')
    const [eventKey, setEventKey] = useState(settings.event_key)
    const [scouters, setScouters] = useState<{ name: string, isRegistered: boolean, email?: string }[]>([])
    const [loading, setLoading] = useState(false)
    const [stats, setStats] = useState({ matchCount: 0, pitCount: 0 })
    const [searchTeam, setSearchTeam] = useState('')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [matches, setMatches] = useState<any[]>([])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [pits, setPits] = useState<any[]>([])
    const supabase = createClient()

    // User roles management
    const [userRoles, setUserRoles] = useState<Array<UserPermissions & { email: string }>>([])
    const [newUserEmail, setNewUserEmail] = useState('')
    const [newUserRole, setNewUserRole] = useState<UserRole>('scout')
    const [roleModal, setRoleModal] = useState<{ open: boolean, email: string, currentRole: UserRole, currentPerms: UserPermissions }>({
        open: false, email: '', currentRole: 'scout', currentPerms: { role: 'scout', can_scout: true, can_view_analytics: false, can_manage_data: false, can_manage_users: false }
    })

    const [alertConfig, setAlertConfig] = useState({ open: false, title: '', message: '', variant: 'info' as 'success' | 'confirm' | 'info' })
    const [deleteModal, setDeleteModal] = useState<{ open: boolean, scouterName: string, scouterEmail?: string }>({ open: false, scouterName: '' })
    const showAlert = (title: string, message: string, variant: 'success' | 'confirm' | 'info' = 'info') => setAlertConfig({ open: true, title, message, variant })

    useEffect(() => {
        fetchStats()
        fetchScouters()
        fetchUserRoles()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Sync event key from settings
    useEffect(() => {
        setEventKey(settings.event_key)
    }, [settings.event_key])

    const fetchStats = async () => {
        const { count: mCount } = await supabase.from('match_scouting').select('*', { count: 'exact', head: true })
        const { count: pCount } = await supabase.from('pit_scouting').select('*', { count: 'exact', head: true })
        setStats({ matchCount: mCount || 0, pitCount: pCount || 0 })
    }

    const fetchScouters = async () => {
        setLoading(true)
        // 1. Fetch Registered Profiles
        const { data: profiles } = await supabase.from('profiles').select('full_name, email')

        // 2. Fetch unique names from scouting data
        const { data: matchData } = await supabase.from('match_scouting').select('scout_name')
        const { data: pitData } = await supabase.from('pit_scouting').select('scout_name')

        const dataNames = new Set<string>([
            ...(matchData?.map(d => d.scout_name) || []),
            ...(pitData?.map(d => d.scout_name) || [])
        ].filter(Boolean) as string[])

        const merged: { name: string; email?: string; isRegistered: boolean }[] = []

        // Priority: Registered Profiles
        profiles?.forEach(p => {
            merged.push({
                name: p.full_name || 'Unnamed User',
                email: p.email,
                isRegistered: true
            })
            // Remove from set to avoid duplicates
            dataNames.delete(p.full_name)
        })

        // Remaining names in data tables are "Legacy" or "Guest" scouters
        dataNames.forEach(name => {
            merged.push({
                name,
                isRegistered: false
            })
        })

        setScouters(merged)
        setLoading(false)
    }

    const fetchUserRoles = async () => {
        const roles = await getAllUserRoles()
        setUserRoles(roles)
    }

    const handleAddUserRole = async () => {
        if (!newUserEmail || !newUserRole) return
        
        const defaultPerms = getDefaultPermissions(newUserRole)
        
        const result = await setUserRole(
            currentUser?.id || '',
            newUserEmail,
            newUserRole,
            defaultPerms
        )
        
        if (result.success) {
            showAlert('Success', `User ${newUserEmail} assigned role: ${newUserRole}`, 'success')
            setNewUserEmail('')
            setNewUserRole('scout')
            fetchUserRoles()
        } else {
            showAlert('Error', result.error || 'Failed to assign role')
        }
    }

    const handleUpdateUserRole = async (role: UserRole, perms: UserPermissions) => {
        const result = await setUserRole(
            currentUser?.id || '',
            roleModal.email,
            role,
            perms
        )
        
        if (result.success) {
            showAlert('Success', `Updated role for ${roleModal.email}`, 'success')
            setRoleModal({ open: false, email: '', currentRole: 'scout', currentPerms: { role: 'scout', can_scout: true, can_view_analytics: false, can_manage_data: false, can_manage_users: false } })
            fetchUserRoles()
        } else {
            showAlert('Error', result.error || 'Failed to update role')
        }
    }

    const deleteMatchData = async () => {
        const check = prompt(`Type "confirm" to wipe ALL match data for event ${eventKey}:`)
        if (check?.toLowerCase() !== 'confirm') return

        setLoading(true)
        const { error } = await supabase
            .from('match_scouting')
            .delete()
            .eq('event_key', eventKey)

        setLoading(false)
        if (error) showAlert('Cleanup Failed', error.message)
        else {
            showAlert('Success', `All match data for ${eventKey} has been purged.`)
            fetchStats()
            fetchScouters()
            if (searchTeam) searchSpecificData()
        }
    }

    const deletePitData = async () => {
        const check = prompt(`Type "confirm" to wipe ALL pit scouting data for event ${eventKey}:`)
        if (check?.toLowerCase() !== 'confirm') return

        setLoading(true)
        const { error } = await supabase
            .from('pit_scouting')
            .delete()
            .eq('event_key', eventKey)

        setLoading(false)
        if (error) showAlert('Cleanup Failed', error.message)
        else {
            showAlert('Success', `All pit data for ${eventKey} has been purged.`)
            fetchStats()
            fetchScouters()
            if (searchTeam) searchSpecificData()
        }
    }

    const wipeAllIdentities = async () => {
        const check = prompt(`⚠️ NUCLEAR OPTION: This wipes EVERYTHING. Type "confirm" to proceed:`)
        if (check?.toLowerCase() !== 'confirm') return

        setLoading(true)
        try {
            const { error: mError } = await supabase.from('match_scouting').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
            const { error: pError } = await supabase.from('pit_scouting').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
            const { error: profError } = await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

            if (mError || pError || profError) throw new Error(mError?.message || pError?.message || profError?.message)

            showAlert('System Reset', 'The database has been purged. Go to Supabase > Auth > Users to manually delete the login accounts.')
            fetchScouters()
            fetchStats()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            showAlert('Wipe Error', message)
        } finally {
            setLoading(false)
        }
    }

    const performDeletion = async (type: 'data' | 'account' | 'both') => {
        const name = deleteModal.scouterName
        const email = deleteModal.scouterEmail
        setLoading(true)
        setDeleteModal({ open: false, scouterName: '' })

        try {
            if (type === 'data' || type === 'both') {
                const { error: mError } = await supabase.from('match_scouting').delete().eq('scout_name', name)
                const { error: pError } = await supabase.from('pit_scouting').delete().eq('scout_name', name)
                if (mError || pError) throw new Error(mError?.message || pError?.message)
            }

            if (type === 'account' || type === 'both') {
                let profError;
                if (email) {
                    const { error } = await supabase.from('profiles').delete().eq('email', email)
                    profError = error
                } else {
                    const { error } = await supabase.from('profiles').delete().eq('full_name', name)
                    profError = error
                }

                if (profError && profError.code !== '42P01') throw profError
            }

            showAlert('Action Complete', `Selected purge for ${name} has been executed.`)
            fetchScouters()
            fetchStats()
            if (searchTeam) searchSpecificData()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            showAlert('Deletion Error', message)
        } finally {
            setLoading(false)
        }
    }

    const searchSpecificData = async () => {
        if (!searchTeam) return
        setLoading(true)

        // Fetch matches for this team
        const { data: mData } = await supabase
            .from('match_scouting')
            .select('*')
            .eq('team_number', parseInt(searchTeam))
            .eq('event_key', eventKey)
            .order('match_number', { ascending: false })

        // Fetch pit entries for this team
        const { data: pData } = await supabase
            .from('pit_scouting')
            .select('*')
            .eq('team_number', parseInt(searchTeam))
            .eq('event_key', eventKey)

        setMatches(mData || [])
        setPits(pData || [])
        setLoading(false)
    }

    const deleteIndividualMatch = async (id: string) => {
        const check = prompt('Type "confirm" to delete this match entry:')
        if (check?.toLowerCase() !== 'confirm') return
        const { error } = await supabase.from('match_scouting').delete().eq('id', id)
        if (error) showAlert('Error', error.message)
        else {
            setMatches(matches.filter(m => m.id !== id))
            fetchStats()
        }
    }

    const deleteIndividualPit = async (teamNum: number, eventK: string) => {
        const check = prompt('Type "confirm" to delete this pit profile:')
        if (check?.toLowerCase() !== 'confirm') return
        const { error } = await supabase
            .from('pit_scouting')
            .delete()
            .eq('team_number', teamNum)
            .eq('event_key', eventK)

        if (error) showAlert('Error', error.message)
        else {
            setPits(pits.filter(p => p.team_number !== teamNum || p.event_key !== eventK))
            fetchStats()
        }
    }

    return (
        <AdminRoute>
            <div className="container py-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                            <Shield className="h-10 w-10 text-primary" />
                            Admin Command Center
                        </h1>
                        <p className="text-muted-foreground font-medium">Strategic control and system management for Metal Cow Robotics.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant={activeSection === 'overview' ? 'default' : 'outline'} onClick={() => setActiveSection('overview')}>Overview</Button>
                        <Button variant={activeSection === 'data' ? 'default' : 'outline'} onClick={() => setActiveSection('data')}>Data Management</Button>
                        <Button variant={activeSection === 'users' ? 'default' : 'outline'} onClick={() => setActiveSection('users')}>Users</Button>
                    </div>
                </div>

                {activeSection === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-2 bg-primary/5">
                            <CardHeader className="pb-2">
                                <CardDescription className="font-bold text-primary flex items-center gap-2 italic">
                                    <Database className="h-4 w-4" /> Total match entries
                                </CardDescription>
                                <CardTitle className="text-5xl font-black">{stats.matchCount}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-muted-foreground font-medium">Entries across all synced events</CardContent>
                        </Card>
                        <Card className="border-2 bg-blue-500/5">
                            <CardHeader className="pb-2">
                                <CardDescription className="font-bold text-blue-500 flex items-center gap-2 italic">
                                    <RefreshCw className="h-4 w-4" /> Pit profiles locked
                                </CardDescription>
                                <CardTitle className="text-5xl font-black text-blue-500">{stats.pitCount}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-muted-foreground font-medium">Unique robot specs captured</CardContent>
                        </Card>
                        <Card className="border-2 bg-orange-500/5">
                            <CardHeader className="pb-2">
                                <CardDescription className="font-bold text-orange-500 flex items-center gap-2 italic">
                                    <Users className="h-4 w-4" /> Active scouters
                                </CardDescription>
                                <CardTitle className="text-5xl font-black text-orange-500">{scouters.length}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-muted-foreground font-medium">Unique scouters in the system</CardContent>
                        </Card>
                    </div>
                )}

                {activeSection === 'data' && (
                    <div className="space-y-6">
                        <Card className="border-2">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Database className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-black">Entry Navigator</CardTitle>
                                        <CardDescription className="font-bold">Locate and remove specific match reports or pit profiles.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="flex gap-4 items-end">
                                    <div className="space-y-2 flex-1 max-w-xs">
                                        <Label className="font-black text-xs uppercase tracking-widest text-muted-foreground">Team Number</Label>
                                        <Input
                                            type="number"
                                            value={searchTeam}
                                            onChange={(e) => setSearchTeam(e.target.value)}
                                            placeholder="e.g. 4213"
                                            className="h-12 border-2"
                                        />
                                    </div>
                                    <Button onClick={searchSpecificData} className="h-12 px-8 font-black" disabled={loading}>
                                        {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Settings className="h-4 w-4 mr-2" />}
                                        Analyze Entries
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Match Results */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                            Matches Found ({matches.length})
                                        </h4>
                                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {matches.map(m => (
                                                <div key={m.id} className="p-3 border-2 rounded-xl flex items-center justify-between bg-muted/30 hover:border-primary/50 transition-colors group">
                                                    <div>
                                                        <div className="text-sm font-black">Match #{m.match_number}</div>
                                                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Event: {m.event_key} • Scout: {m.scout_name}</div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                        onClick={() => deleteIndividualMatch(m.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {matches.length === 0 && searchTeam && !loading && (
                                                <div className="py-8 text-center text-xs text-muted-foreground italic border-2 border-dashed rounded-xl">No match reports for this team.</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Pit Results */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-blue-500">
                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                                            Pit Profiles ({pits.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {pits.map(p => (
                                                <div key={`${p.team_number}-${p.event_key}`} className="p-3 border-2 rounded-xl flex items-center justify-between bg-muted/30 hover:border-blue-500/50 transition-colors">
                                                    <div>
                                                        <div className="text-sm font-black">Robot Blueprint • {p.drive_train_type}</div>
                                                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Event: {p.event_key} • Weight: {p.robot_weight}lbs</div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                        onClick={() => deleteIndividualPit(p.team_number, p.event_key)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {pits.length === 0 && searchTeam && !loading && (
                                                <div className="py-8 text-center text-xs text-muted-foreground italic border-2 border-dashed rounded-xl">No pit profile for this team.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-destructive/20 overflow-hidden">
                            <CardHeader className="bg-destructive/5 border-b">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-destructive/10 rounded-lg">
                                        <Trash2 className="h-6 w-6 text-destructive" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-black">Dangerous Actions</CardTitle>
                                        <CardDescription className="font-bold">Cleanup tools for purging event data. Use with extreme caution.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <Label className="font-black text-xs uppercase tracking-widest text-muted-foreground">Target Event Key</Label>
                                    <Input
                                        value={eventKey}
                                        onChange={(e) => setEventKey(e.target.value)}
                                        placeholder="e.g. 2026ilpe"
                                        className="max-w-xs h-12 border-2 font-mono"
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">Operation will only affect data matching this key.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    <div className="p-4 border-2 rounded-xl flex flex-col gap-4">
                                        <div>
                                            <h4 className="font-bold">Purge Match Scouting</h4>
                                            <p className="text-xs text-muted-foreground">Delete all match scouting entries for {eventKey}. Recommended before official matches if test data exists.</p>
                                        </div>
                                        <Button variant="destructive" className="w-fit" onClick={deleteMatchData} disabled={loading}>
                                            {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                            Wipe {eventKey} Match Data
                                        </Button>
                                    </div>
                                    <div className="p-4 border-2 rounded-xl flex flex-col gap-4">
                                        <div>
                                            <h4 className="font-bold">Purge Pit Scouting</h4>
                                            <p className="text-xs text-muted-foreground">Delete all pit scouting entries for {eventKey}. Warning: This removes robot specs, drive types, etc.</p>
                                        </div>
                                        <Button variant="destructive" className="w-fit" onClick={deletePitData} disabled={loading}>
                                            {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                            Wipe {eventKey} Pit Data
                                        </Button>
                                    </div>
                                </div>

                                <div className="pt-6 border-t flex flex-col gap-4">
                                    <div className="flex items-center gap-2 text-destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <h4 className="font-black uppercase text-sm tracking-wider">System Nuclear Reset</h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground max-w-xl">This will scrub EVERY scouting entry and EVERY user profile from the database tables. Use this for a complete multi-year or multi-event fresh start. <strong>Auth accounts must be cleared separately in Supabase.</strong></p>
                                    <Button
                                        variant="destructive"
                                        className="w-fit bg-red-600 hover:bg-red-700 font-black shadow-lg shadow-red-900/20 h-12 px-8"
                                        onClick={wipeAllIdentities}
                                        disabled={loading}
                                    >
                                        <Trash2 className="h-5 w-5 mr-3" />
                                        Purge Entire System
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeSection === 'users' && (
                    <Card className="border-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-6 w-6 text-primary" />
                                User Management
                            </CardTitle>
                            <CardDescription className="font-bold italic">Manage users and their permissions. Click on a user to edit access.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    type="email"
                                    placeholder="user@email.com"
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                    className="flex-1"
                                />
                                <select
                                    value={newUserRole}
                                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                                    className="h-10 px-3 rounded-md border bg-background text-sm"
                                >
<option value="viewer">Viewer</option>
                                            <option value="scout">Scout</option>
                                            <option value="admin">Admin</option>
                                </select>
                                <Button onClick={handleAddUserRole} className="font-bold">
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {userRoles.map(user => (
                                    <div 
                                        key={user.email} 
                                        className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-dashed hover:border-primary cursor-pointer transition-colors group"
                                        onClick={() => setRoleModal({ 
                                            open: true, 
                                            email: user.email, 
                                            currentRole: user.role,
                                            currentPerms: {
                                                role: user.role,
                                                can_scout: user.can_scout,
                                                can_view_analytics: user.can_view_analytics,
                                                can_manage_data: user.can_manage_data,
                                                can_manage_users: user.can_manage_users
                                            }
                                        })}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black uppercase ${
                                                user.role === 'admin' ? 'bg-destructive/20 text-destructive' :
                                                user.role === 'scout' ? 'bg-green-500/20 text-green-500' :
                                                'bg-muted text-muted-foreground'
                                            }`}>
                                                {user.email.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-sm flex items-center gap-2">
                                                    {user.email}
                                                    <Check className="h-3 w-3 text-primary" />
                                                </span>
                                                <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                                    user.role === 'admin' ? 'text-destructive' :
                                                    user.role === 'scout' ? 'text-green-500' :
                                                    'text-muted-foreground'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            {user.can_scout && <span className="text-[8px] px-1.5 py-0.5 bg-green-500/20 text-green-600 rounded">Scout</span>}
                                            {user.can_view_analytics && <span className="text-[8px] px-1.5 py-0.5 bg-blue-500/20 text-blue-600 rounded">Analytics</span>}
                                            <Shield className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                ))}
                                {userRoles.length === 0 && (
                                    <div className="col-span-full py-12 text-center text-muted-foreground italic">No users found.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}



                <DeleteUserModal
                    isOpen={deleteModal.open}
                    onClose={() => setDeleteModal({ open: false, scouterName: '' })}
                    scouterName={deleteModal.scouterName}
                    onConfirm={performDeletion}
                />

                <RoleModal
                    key={roleModal.email}
                    isOpen={roleModal.open}
                    onClose={() => setRoleModal({ open: false, email: '', currentRole: 'scout', currentPerms: { role: 'scout', can_scout: true, can_view_analytics: false, can_manage_data: false, can_manage_users: false } })}
                    email={roleModal.email}
                    currentRole={roleModal.currentRole}
                    currentPerms={roleModal.currentPerms}
                    onSave={(role, perms) => {
                        setRoleModal(prev => ({ ...prev, currentRole: role, currentPerms: { ...perms, role } }))
                        handleUpdateUserRole(role, { ...perms, role })
                    }}
                />

                <AlertModal
                    isOpen={alertConfig.open}
                    onClose={() => setAlertConfig(prev => ({ ...prev, open: false }))}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    variant={alertConfig.variant}
                />
            </div>
        </AdminRoute >
    )
}

function DeleteUserModal({ isOpen, onClose, scouterName, onConfirm }: {
    isOpen: boolean,
    onClose: () => void,
    scouterName: string,
    onConfirm: (type: 'data' | 'account' | 'both') => void
}) {
    const [confirmText, setConfirmText] = useState('')

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                setConfirmText('')
                onClose()
            }
        }}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-black flex items-center gap-2">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                        Purge User: {scouterName}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-medium">
                        You are about to remove <span className="text-primary font-black">{scouterName}</span> from the strategic network. Choose the scope of this operation.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Type &quot;confirm&quot; to authorize</Label>
                        <Input
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder='type "confirm" here'
                            className="border-2 h-11"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <Button
                            variant="outline"
                            onClick={() => onConfirm('data')}
                            disabled={confirmText.toLowerCase() !== 'confirm'}
                            className="h-14 justify-start gap-4 rounded-xl border-2 hover:border-orange-500 hover:bg-orange-500/5 transition-all text-left px-4 group"
                        >
                            <Database className="h-5 w-5 text-orange-500" />
                            <div>
                                <div className="font-black text-sm">Delete Scouting Data Only</div>
                                <div className="text-[10px] text-muted-foreground font-bold">Wipes their match and pit reports. Keeps account active.</div>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => onConfirm('account')}
                            disabled={confirmText.toLowerCase() !== 'confirm'}
                            className="h-14 justify-start gap-4 rounded-xl border-2 hover:border-blue-500 hover:bg-blue-500/5 transition-all text-left px-4"
                        >
                            <Users className="h-5 w-5 text-blue-500" />
                            <div>
                                <div className="font-black text-sm">Delete Account Only</div>
                                <div className="text-[10px] text-muted-foreground font-bold">Removes their application profile. Data remains in database.</div>
                            </div>
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={() => onConfirm('both')}
                            disabled={confirmText.toLowerCase() !== 'confirm'}
                            className="h-20 justify-start gap-4 rounded-xl shadow-lg shadow-destructive/20 text-left px-4"
                        >
                            <Trash2 className="h-8 w-8 text-white/50" />
                            <div>
                                <div className="font-black text-lg">Total Purge</div>
                                <div className="text-xs font-bold opacity-80">Wipes ALL data and the application profile. Absolute cleanup.</div>
                            </div>
                        </Button>
                    </div>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl font-bold">Cancel Operation</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

function RoleModal({ 
    isOpen, 
    onClose, 
    email, 
    currentRole, 
    currentPerms, 
    onSave 
}: {
    isOpen: boolean
    onClose: () => void
    email: string
    currentRole: UserRole
    currentPerms: UserPermissions
    onSave: (role: UserRole, perms: Omit<UserPermissions, 'role'>) => void
}) {
    const [role, setRole] = useState<UserRole>(currentRole)
    const [perms, setPerms] = useState<UserPermissions>(currentPerms)

    const handleSave = () => {
        onSave(role, { can_scout: perms.can_scout, can_view_analytics: perms.can_view_analytics, can_manage_data: perms.can_manage_data, can_manage_users: perms.can_manage_users })
    }

    const handleRoleChange = (newRole: UserRole) => {
        setRole(newRole)
        setPerms(getDefaultPermissions(newRole))
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => {
            if (!open) onClose()
        }}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-black flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Edit Role: {email}
                    </AlertDialogTitle>
                </AlertDialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Role</Label>
                        <select
                            value={role}
                            onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                            className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                        >
                            <option value="viewer">Viewer</option>
                            <option value="scout">Scout</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Permissions</Label>
                        
                        <label className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                            <span className="font-medium text-sm">Can Scout</span>
                            <input 
                                type="checkbox" 
                                checked={perms.can_scout}
                                onChange={(e) => setPerms(p => ({ ...p, role: role, can_scout: e.target.checked }))}
                                className="h-5 w-5"
                            />
                        </label>
                        
                        <label className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                            <span className="font-medium text-sm">View Analytics</span>
                            <input 
                                type="checkbox" 
                                checked={perms.can_view_analytics}
                                onChange={(e) => setPerms(p => ({ ...p, role: role, can_view_analytics: e.target.checked }))}
                                className="h-5 w-5"
                            />
                        </label>
                        
                        <label className="flex items-center justify-between p-3 rounded-lg border cursor-lg hover:bg-muted/50">
                            <span className="font-medium text-sm">Manage Data</span>
                            <input 
                                type="checkbox" 
                                checked={perms.can_manage_data}
                                onChange={(e) => setPerms(p => ({ ...p, role: role, can_manage_data: e.target.checked }))}
                                className="h-5 w-5"
                            />
                        </label>
                        
                        <label className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                            <span className="font-medium text-sm">Manage Users</span>
                            <input 
                                type="checkbox" 
                                checked={perms.can_manage_users}
                                onChange={(e) => setPerms(p => ({ ...p, role: role, can_manage_users: e.target.checked }))}
                                className="h-5 w-5"
                            />
                        </label>
                    </div>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSave} className="rounded-xl font-bold">
                        Save Changes
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
