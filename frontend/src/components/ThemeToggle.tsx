import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '../store/theme.store';
import { motion, AnimatePresence } from 'framer-motion';

const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useThemeStore();

    const variants = {
        initial: { opacity: 0, scale: 0.5 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.5 },
    };

    return (
        <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-1 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
            {(['light', 'system', 'dark'] as const).map((t) => (
                <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`p-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme === t
                            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    aria-label={`Switch to ${t} theme`}
                >
                    <AnimatePresence mode="wait">
                        {t === 'light' && (
                            <motion.div key="light" {...variants}>
                                <Sun className="w-4 h-4" />
                            </motion.div>
                        )}
                        {t === 'system' && (
                            <motion.div key="system" {...variants}>
                                <Monitor className="w-4 h-4" />
                            </motion.div>
                        )}
                        {t === 'dark' && (
                            <motion.div key="dark" {...variants}>
                                <Moon className="w-4 h-4" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>
            ))}
        </div>
    );
};

export default ThemeToggle;
