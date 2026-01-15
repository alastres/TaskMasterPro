import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, Folder, Users, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useAuthStore } from '../store/auth.store';

interface SidebarProps {
    isOpen: boolean;
    isMobileOpen: boolean;
    setIsMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, isMobileOpen, setIsMobileOpen }) => {
    const location = useLocation();
    const { t } = useTranslation();
    const user = useAuthStore((state) => state.user);

    const navItems = [
        { name: t('nav.dashboard'), path: '/', icon: Home },
        { name: t('nav.projects'), path: '/projects', icon: Folder },
        { name: t('teams.title'), path: '/team', icon: Users },
        { name: t('nav.profile'), path: '/profile', icon: User },
    ];

    // Add Admin link if user is admin
    if (user?.role === 'ADMIN') {
        navItems.push({ name: 'Admin', path: '/admin', icon: Settings });
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="px-2 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.path === '/'
                            ? location.pathname === '/'
                            : location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                onClick={() => setIsMobileOpen(false)}
                                className={clsx(
                                    "group flex items-center px-2 py-3 text-sm font-medium rounded-md transition-colors",
                                    isActive
                                        ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600 dark:border-indigo-400"
                                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white border-l-4 border-transparent",
                                    !isOpen && "justify-center"
                                )}
                            >
                                <Icon className={clsx("flex-shrink-0 h-6 w-6", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300")} />
                                {isOpen && <span className="ml-3">{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.div
                className="hidden md:flex md:flex-col z-0 bg-white dark:bg-gray-800"
                animate={{ width: isOpen ? 240 : 72 }}
                transition={{ duration: 0.3 }}
            >
                <SidebarContent />
            </motion.div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <div className="fixed inset-0 z-40 flex md:hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-gray-600 bg-opacity-75"
                            onClick={() => setIsMobileOpen(false)}
                        />
                        <motion.div
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800"
                        >
                            <SidebarContent />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;
