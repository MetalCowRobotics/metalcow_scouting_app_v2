"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { useTheme } from "next-themes"
import { useEffect } from "react"
import { createClient } from "@/lib/supabase"

function ThemeSetter() {
    const { setTheme } = useTheme()

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                setTheme("dark")
            }
        }
        checkAuth()
    }, [setTheme])

    return null
}

export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    return (
        <NextThemesProvider {...props}>
            <ThemeSetter />
            {children}
        </NextThemesProvider>
    )
}
