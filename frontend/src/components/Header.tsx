import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { LogOut, CheckSquare, Menu } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import { useTranslation } from 'react-i18next';
import NotificationCenter from './NotificationCenter';

interface HeaderProps {
    toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 z-10 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 -ml-2 mr-2 md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/')}>
                            <CheckSquare className="h-8 w-8 text-indigo-600 dark:text-indigo-500" />
                            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white hidden sm:block">TaskMaster Pro</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <LanguageToggle />
                        <ThemeToggle />
                        <NotificationCenter />

                        <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700">
                            <Link to="/profile" className="flex items-center space-x-2 group">
                                <div className="relative">
                                    {user?.avatarUrl ? (
                                        <img
                                            src={user.avatarUrl}
                                            alt={user.nickname}
                                            className="h-9 w-9 rounded-full object-cover border-2 border-transparent group-hover:border-indigo-500 transition-all"
                                        />
                                    ) : (
                                        <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm border-2 border-transparent group-hover:border-indigo-500 transition-all">
                                            {(user?.nickname || user?.name || '?').substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="hidden md:flex flex-col items-start">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {user?.nickname || user?.name}
                                    </span>
                                </div>
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50"
                                title={t('nav.logout')}
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
