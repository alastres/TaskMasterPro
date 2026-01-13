import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    return (
        <nav className="flex px-4 py-3 text-gray-700 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                    <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-white">
                        <Home className="w-4 h-4 mr-2" />
                        Dashboard
                    </Link>
                </li>
                {pathnames.map((value, index) => {
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;
                    const name = value.charAt(0).toUpperCase() + value.slice(1);

                    return (
                        <li key={to}>
                            <div className="flex items-center">
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                {isLast ? (
                                    <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2 dark:text-gray-400">{name}</span>
                                ) : (
                                    <Link to={to} className="ml-1 text-sm font-medium text-gray-700 hover:text-indigo-600 md:ml-2 dark:text-gray-400 dark:hover:text-white">
                                        {name}
                                    </Link>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
