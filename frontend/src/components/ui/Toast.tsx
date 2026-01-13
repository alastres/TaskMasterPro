import React, { createContext, useContext, useState, useCallback } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type ToastType = 'success' | 'error' | 'info' | 'loading';

interface Toast {
    id: string;
    title?: string;
    description?: string;
    type?: ToastType;
}

interface ToastContextType {
    toast: (props: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback(({ title, description, type = 'info' }: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, title, description, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
                {children}
                <AnimatePresence>
                    {toasts.map((t) => (
                        <ToastPrimitive.Root
                            key={t.id}
                            className={cn(
                                "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-2xl border p-4 pr-8 shadow-lg transition-all",
                                "bg-white dark:bg-gray-800",
                                t.type === 'success' && "border-green-100 dark:border-green-900/30",
                                t.type === 'error' && "border-red-100 dark:border-red-900/30",
                                t.type === 'info' && "border-indigo-100 dark:border-indigo-900/30",
                                t.type === 'loading' && "border-gray-100 dark:border-gray-700"
                            )}
                            onOpenChange={(open) => !open && removeToast(t.id)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-xl",
                                    t.type === 'success' && "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
                                    t.type === 'error' && "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
                                    t.type === 'info' && "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
                                    t.type === 'loading' && "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                )}>
                                    {t.type === 'success' && <CheckCircle2 size={18} />}
                                    {t.type === 'error' && <AlertCircle size={18} />}
                                    {t.type === 'info' && <Info size={18} />}
                                    {t.type === 'loading' && <Loader2 size={18} className="animate-spin" />}
                                </div>
                                <div className="grid gap-1">
                                    {t.title && <ToastPrimitive.Title className="text-sm font-bold text-gray-900 dark:text-white">{t.title}</ToastPrimitive.Title>}
                                    {t.description && (
                                        <ToastPrimitive.Description className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                            {t.description}
                                        </ToastPrimitive.Description>
                                    )}
                                </div>
                            </div>
                            <ToastPrimitive.Close className="absolute right-2 top-2 rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:text-gray-900 group-hover:opacity-100 dark:hover:text-white">
                                <X size={14} />
                            </ToastPrimitive.Close>
                        </ToastPrimitive.Root>
                    ))}
                </AnimatePresence>
                <ToastPrimitive.Viewport className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]" />
            </ToastPrimitive.Provider>
        </ToastContext.Provider>
    );
};
