'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'
import { Logo } from '@/components/Logo'
import { BarChart2, ScrollText, Shield, Settings, User, LogOut, ChevronDown, Trophy, Wrench, Sun, Moon, ClipboardList } from 'lucide-react'
import { useTheme } from 'next-themes'

import { isAdmin } from '@/lib/admin'

export function Navbar() {
    const pathname = usePathname()
    const [user, setUser] = useState<any>(null)
    const [isAdminUser, setIsAdminUser] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const supabase = createClient()
    const { theme, setTheme } = useTheme()

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setUser(session?.user ?? null)
            
            if (session?.user) {
                const adminStatus = await isAdmin(session.user.id)
                setIsAdminUser(adminStatus)
            }
        }
        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                isAdmin(session.user.id).then(setIsAdminUser)
            } else {
                setIsAdminUser(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
    }

    const baseRoutes = [
        { href: '/', label: 'Home' },
        { href: '/scout/match', label: 'Match Scout', icon: Trophy },
        { href: '/scout/pit', label: 'Pit Scout', icon: ClipboardList },
        { href: '/analytics', label: 'Analytics', icon: BarChart2 },
    ]

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container flex h-16 items-center px-4 mx-auto">
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <Logo width={140} height={40} />
                    </Link>
                    <nav className="flex items-center space-x-8 text-sm font-medium">
                        {baseRoutes.map((route) => (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "transition-colors hover:text-foreground/80",
                                    pathname === route.href ? "text-foreground" : "text-foreground/60"
                                )}
                            >
                                {route.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Mobile Nav could be implemented here via Sheet or simpler approach */}
                <div className="flex md:hidden w-full justify-between items-center text-sm">
                    <Link href="/">
                        <Logo width={100} height={28} />
                    </Link>
                    <div className="flex w-48 justify-between">
                        {baseRoutes.map((route) => (
                            <Link key={route.href} href={route.href} className="flex-1 text-center">
                                {route.icon ? <route.icon className={cn("h-5 w-5 mx-auto", pathname === route.href ? "text-primary" : "text-muted-foreground")} /> : null}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex flex-1 items-center justify-end space-x-2 ml-4">
                    {!user && <ModeToggle />}
                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                            >
                                <User className="h-5 w-5" />
                                <ChevronDown className="h-3 w-3" />
                            </button>
                            
                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg py-1 z-50">
                                    <div className="px-3 py-2 border-b text-xs text-muted-foreground truncate">
                                        {user.email}
                                    </div>
                                    <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted" onClick={() => setShowUserMenu(false)}>
                                        <Settings className="h-4 w-4" />
                                        Settings
                                    </Link>
                                    <div className="px-3 py-2 border-t">
                                        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex items-center gap-2 text-sm hover:bg-muted w-full text-left">
                                            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                                        </button>
                                    </div>
                                    {isAdminUser && (
                                        <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted border-t" onClick={() => setShowUserMenu(false)}>
                                            <Shield className="h-4 w-4" />
                                            Admin
                                        </Link>
                                    )}
                                    <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted w-full text-left border-t text-destructive">
                                        <LogOut className="h-4 w-4" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/login">
                            <Button variant="default" size="sm">Login</Button>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    )
}
