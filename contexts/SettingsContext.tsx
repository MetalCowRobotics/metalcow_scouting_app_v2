'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export interface AppSettings {
    // Event & Competition Settings
    event_key: string
    default_team_number: number | null

    // Scout Preferences
    scout_name: string
    auto_fill_scout_name: boolean

    // Data & Sync Settings
    auto_sync: boolean
    offline_mode: boolean

    // Display Preferences
    compact_view: boolean
    show_tba_data: boolean

    // Notification Settings
    enable_notifications: boolean
    notify_on_submit: boolean
}

interface SettingsContextType {
    settings: AppSettings
    updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>
    resetSettings: () => Promise<void>
    loading: boolean
    user: User | null
}

const defaultSettings: AppSettings = {
    event_key: process.env.NEXT_PUBLIC_DEFAULT_EVENT_KEY || '2026ilpe',
    default_team_number: null,
    scout_name: '',
    auto_fill_scout_name: true,
    auto_sync: true,
    offline_mode: false,
    compact_view: false,
    show_tba_data: true,
    enable_notifications: true,
    notify_on_submit: true,
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<AppSettings>(defaultSettings)
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<User | null>(null)
    const supabase = createClient()

    // Load settings from Supabase
    useEffect(() => {
        const loadSettings = async () => {
            setLoading(true)
            try {
                const { data: { session } } = await supabase.auth.getSession()
                setUser(session?.user ?? null)

                if (session?.user) {
                    // Fetch user settings from Supabase
                    const { data, error } = await supabase
                        .from('user_settings')
                        .select('*')
                        .eq('user_id', session.user.id)
                        .single()

                    if (error) {
                        if (error.code === 'PGRST116') {
                            // No settings found, create default settings
                            const { data: newSettings, error: insertError } = await supabase
                                .from('user_settings')
                                .insert({
                                    user_id: session.user.id,
                                    ...defaultSettings,
                                })
                                .select()
                                .single()

                            if (!insertError && newSettings) {
                                setSettings({
                                    event_key: newSettings.event_key || defaultSettings.event_key,
                                    default_team_number: newSettings.default_team_number,
                                    scout_name: newSettings.scout_name || '',
                                    auto_fill_scout_name: newSettings.auto_fill_scout_name ?? defaultSettings.auto_fill_scout_name,
                                    auto_sync: newSettings.auto_sync ?? defaultSettings.auto_sync,
                                    offline_mode: newSettings.offline_mode ?? defaultSettings.offline_mode,
                                    compact_view: newSettings.compact_view ?? defaultSettings.compact_view,
                                    show_tba_data: newSettings.show_tba_data ?? defaultSettings.show_tba_data,
                                    enable_notifications: newSettings.enable_notifications ?? defaultSettings.enable_notifications,
                                    notify_on_submit: newSettings.notify_on_submit ?? defaultSettings.notify_on_submit,
                                })
                            }
                        }
                    } else if (data) {
                        // Settings found, use them
                        setSettings({
                            event_key: data.event_key || defaultSettings.event_key,
                            default_team_number: data.default_team_number,
                            scout_name: data.scout_name || '',
                            auto_fill_scout_name: data.auto_fill_scout_name ?? defaultSettings.auto_fill_scout_name,
                            auto_sync: data.auto_sync ?? defaultSettings.auto_sync,
                            offline_mode: data.offline_mode ?? defaultSettings.offline_mode,
                            compact_view: data.compact_view ?? defaultSettings.compact_view,
                            show_tba_data: data.show_tba_data ?? defaultSettings.show_tba_data,
                            enable_notifications: data.enable_notifications ?? defaultSettings.enable_notifications,
                            notify_on_submit: data.notify_on_submit ?? defaultSettings.notify_on_submit,
                        })
                    }
                } else {
                    // Not logged in, use default settings
                    setSettings(defaultSettings)
                }
            } catch (err) {
                console.error('Error loading settings:', err)
                setSettings(defaultSettings)
            } finally {
                setLoading(false)
            }
        }

        loadSettings()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                loadSettings()
            } else {
                setSettings(defaultSettings)
            }
        })

        return () => subscription.unsubscribe()
    }, [supabase])

    const updateSettings = async (newSettings: Partial<AppSettings>) => {
        const updatedSettings = { ...settings, ...newSettings }
        setSettings(updatedSettings)

        if (user) {
            try {
                const { error } = await supabase
                    .from('user_settings')
                    .update(newSettings)
                    .eq('user_id', user.id)

                if (error) {
                    console.error('Error updating settings:', error)
                    // Revert on error
                    setSettings(settings)
                }
            } catch (err) {
                console.error('Error updating settings:', err)
                setSettings(settings)
            }
        }
    }

    const resetSettings = async () => {
        setSettings(defaultSettings)

        if (user) {
            try {
                await supabase
                    .from('user_settings')
                    .update(defaultSettings)
                    .eq('user_id', user.id)
            } catch (err) {
                console.error('Error resetting settings:', err)
            }
        }
    }

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, loading, user }}>
            {children}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const context = useContext(SettingsContext)
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider')
    }
    return context
}
