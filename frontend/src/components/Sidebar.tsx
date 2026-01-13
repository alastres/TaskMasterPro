import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, LogOut, Menu, X, CheckSquare } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import ThemeToggle from './ThemeToggle';

const Sidebar = () => {
    const { user, logout } = useAuthStore();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const toggleSidebar = () => setIsOpen(!isOpen);
    const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

    const navItems = [
        { name: 'Dashboard', path: '/', icon: Home },
        { name: 'Profile', path: '/profile', icon: User },
    ];

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className={clsx("flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700", isOpen ? "justify-between" : "justify-center")}>
                {isOpen && (
                    <div className="flex items-center">
                        <CheckSquare className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                        <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white truncate">TaskMaster</span>
                    </div>
                )}
                {!isOpen && <CheckSquare className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />}
                <button onClick={toggleSidebar} className="hidden md:block p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                    {isOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="px-2 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                onClick={() => setIsMobileOpen(false)}
                                className={clsx(
                                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                                    isActive
                                        ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white",
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

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className={clsx("flex items-center", isOpen ? "justify-between" : "justify-center flex-col space-y-4")}>
                    <ThemeToggle />
                    {isOpen && <span className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center w-full ml-2">Theme</span>}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={logout}
                        className={clsx(
                            "w-full flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors",
                            !isOpen && "justify-center"
                        )}
                    >
                        <LogOut className="h-6 w-6" />
                        {isOpen && <span className="ml-3">Logout</span>}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-between h-16 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                    <CheckSquare className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">TaskMaster</span>
                </div>
                <button onClick={toggleMobileSidebar} className="p-2 -mr-2 text-gray-400 hover:text-gray-500">
                    {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Desktop Sidebar */}
            <motion.div
                className="hidden md:flex md:flex-col md:fixed md:inset-y-0 z-10 bg-white dark:bg-gray-800"
                animate={{ width: isOpen ? 256 : 80 }}
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
                            onClick={toggleMobileSidebar}
                        />
                        <motion.div
                            initial={{ x: -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: -300 }}
                            className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800"
                        >
                            <SidebarContent />
                            <button onClick={toggleMobileSidebar} className="absolute top-0 right-0 -mr-12 pt-2">
                                <X className="h-10 w-10 text-white" />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;
