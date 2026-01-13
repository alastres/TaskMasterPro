import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Breadcrumbs from '../components/Breadcrumbs';

const MainLayout = () => {
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col shadow-xl z-0 overflow-hidden relative">
                <Breadcrumbs />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
