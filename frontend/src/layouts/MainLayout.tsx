import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Breadcrumbs from '../components/Breadcrumbs';
import { motion } from 'framer-motion';

const MainLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMobileSidebarOpen(false);
                setIsSidebarOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);

        // Initial check
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-hidden"
        >
            <Header toggleSidebar={toggleSidebar} />

            <div className="flex flex-1 overflow-hidden relative">
                <Sidebar
                    isOpen={isSidebarOpen}
                    isMobileOpen={isMobileSidebarOpen}
                    setIsMobileOpen={setIsMobileSidebarOpen}
                />

                <main className="flex-1 flex flex-col overflow-hidden relative w-full">
                    <Breadcrumbs />
                    <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
                        <Outlet />
                    </div>
                </main>
            </div>
        </motion.div>
    );
};

export default MainLayout;
