import React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface AlertDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    cancelText?: string;
    confirmText?: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
    isOpen,
    onOpenChange,
    title,
    description,
    cancelText = 'Cancelar',
    confirmText = 'Confirmar',
    onConfirm,
    variant = 'danger',
    isLoading = false
}) => {
    return (
        <AlertDialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
            <AnimatePresence>
                {isOpen && (
                    <AlertDialogPrimitive.Portal forceMount>
                        <AlertDialogPrimitive.Overlay asChild>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                            />
                        </AlertDialogPrimitive.Overlay>
                        <AlertDialogPrimitive.Content asChild>
                            <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] p-4 outline-none">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700"
                                >
                                    <div className="p-6">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className={cn(
                                                "p-3 rounded-2xl shadow-sm",
                                                variant === 'danger' && "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
                                                variant === 'warning' && "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
                                                variant === 'info' && "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                                            )}>
                                                <AlertTriangle size={24} />
                                            </div>
                                            <AlertDialogPrimitive.Title className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                                                {title}
                                            </AlertDialogPrimitive.Title>
                                        </div>

                                        <AlertDialogPrimitive.Description className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
                                            {description}
                                        </AlertDialogPrimitive.Description>

                                        <div className="flex gap-3">
                                            <AlertDialogPrimitive.Cancel asChild>
                                                <button className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-all">
                                                    {cancelText}
                                                </button>
                                            </AlertDialogPrimitive.Cancel>
                                            <AlertDialogPrimitive.Action asChild>
                                                <button
                                                    onClick={onConfirm}
                                                    disabled={isLoading}
                                                    className={cn(
                                                        "flex-1 px-4 py-2.5 font-bold rounded-xl text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                                                        variant === 'danger' && "bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-none",
                                                        variant === 'warning' && "bg-amber-500 hover:bg-amber-600 shadow-amber-200 dark:shadow-none",
                                                        variant === 'info' && "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none"
                                                    )}
                                                >
                                                    {isLoading && <Loader2 size={18} className="animate-spin" />}
                                                    {confirmText}
                                                </button>
                                            </AlertDialogPrimitive.Action>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </AlertDialogPrimitive.Content>
                    </AlertDialogPrimitive.Portal>
                )}
            </AnimatePresence>
        </AlertDialogPrimitive.Root>
    );
};
