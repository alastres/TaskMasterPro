import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { LogOut, CheckSquare } from 'lucide-react';

const MainLayout = () => {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex flex-col">
            <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <CheckSquare className="h-8 w-8 text-indigo-600 dark:text-indigo-500" />
                            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">TaskMaster Pro</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.nickname} className="h-8 w-8 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                                ) : (
                                    <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                        {(user?.nickname || user?.name || '?').substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                                <div className="hidden sm:flex flex-col">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {user?.nickname || user?.name}
                                    </span>
                                    <Link to="/profile" className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                                        View Profile
                                    </Link>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1 w-full mx-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
