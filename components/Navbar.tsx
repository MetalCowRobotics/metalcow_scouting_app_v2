'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'
import { Bot, BarChart2, ScrollText, Users, Globe, Shield } from 'lucide-react'

import { isAdmin } from '@/lib/admin'

export function Navbar() {
    const pathname = usePathname()
    const [user, setUser] = useState<any>(null)
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setUser(session?.user ?? null)
        }
        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
    }

    const baseRoutes = [
        { href: '/', label: 'Home', icon: Users },
        { href: '/scout/match', label: 'Match Scout', icon: ScrollText },
        { href: '/scout/pit', label: 'Pit Scout', icon: Bot },
        { href: '/analytics', label: 'Analytics', icon: BarChart2 },
        { href: '/tba', label: 'TBA Data', icon: Globe },
    ]

    const routes = isAdmin(user?.email)
        ? [...baseRoutes, { href: '/admin', label: 'Admin', icon: Shield }]
        : baseRoutes

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container flex h-16 items-center px-4 mx-auto">
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <Bot className="h-6 w-6" />
                        <span className="hidden font-bold sm:inline-block">
                            Metal Cow Scouting
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        {routes.map((route) => (
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
                    <span className="font-bold">Metal Cow</span>
                    <div className="flex gap-4">
                        {routes.map((route) => (
                            <Link key={route.href} href={route.href}>
                                <route.icon className={cn("h-5 w-5", pathname === route.href ? "text-primary" : "text-muted-foreground")} />
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex flex-1 items-center justify-end space-x-2">
                    <ModeToggle />
                    {user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground hidden md:inline-block">
                                {user.email}
                            </span>
                            <Button variant="ghost" size="sm" onClick={handleLogout}>
                                Logout
                            </Button>
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
