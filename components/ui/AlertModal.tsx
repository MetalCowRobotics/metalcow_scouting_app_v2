'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

type ModalVariant = 'success' | 'confirm' | 'info'

interface AlertModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    message: string
    variant?: ModalVariant
    onConfirm?: () => void
    confirmLabel?: string
    cancelLabel?: string
}

const variantStyles = {
    success: {
        icon: CheckCircle2,
        iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-500',
        button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    confirm: {
        icon: XCircle,
        iconBg: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500',
        button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    info: {
        icon: AlertTriangle,
        iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500',
        button: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
}

export function AlertModal({ 
    isOpen, 
    onClose, 
    title, 
    message, 
    variant = 'info',
    onConfirm,
    confirmLabel = 'Got it',
    cancelLabel = 'Cancel',
}: AlertModalProps) {
    const styles = variantStyles[variant]
    const Icon = styles.icon

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogMedia className={styles.iconBg}>
                        <Icon className="h-6 w-6" />
                    </AlertDialogMedia>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {message}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {variant === 'confirm' ? (
                        <>
                            <AlertDialogCancel onClick={onClose}>{cancelLabel}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => { onConfirm?.(); onClose() }} className={styles.button}>
                                {confirmLabel}
                            </AlertDialogAction>
                        </>
                    ) : (
                        <AlertDialogAction onClick={onClose} className={styles.button}>
                            {confirmLabel}
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
