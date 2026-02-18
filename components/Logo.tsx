import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface LogoProps {
    className?: string
    width?: number
    height?: number
}

export function Logo({ className = "", width = 120, height = 40 }: LogoProps) {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className={className} style={{ width, height }} />
    }

    const isDark = resolvedTheme === 'dark'

    // Use horizontal logo - green for both modes, or switch between black/white
    const logoSrc = isDark 
        ? '/2024 MCR Logo PNG Package/2024 MCR Horizontal Logo Green.png'
        : '/2024 MCR Logo PNG Package/2024 MCR Horizontal Logo Green.png'

    return (
        <Image
            src={logoSrc}
            alt="Metal Cow Robotics"
            width={width}
            height={height}
            className={className}
            priority
        />
    )
}

export function LogoIcon({ className = "", size = 32 }: { className?: string, size?: number }) {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className={className} style={{ width: size, height: size }} />
    }

    const isDark = resolvedTheme === 'dark'

    const logoSrc = isDark
        ? '/2024 MCR Logo PNG Package/2024 MCR Logo Icon Green.png'
        : '/2024 MCR Logo PNG Package/2024 MCR Logo Icon Green.png'

    return (
        <Image
            src={logoSrc}
            alt="Metal Cow Robotics"
            width={size}
            height={size}
            className={className}
            priority
        />
    )
}
