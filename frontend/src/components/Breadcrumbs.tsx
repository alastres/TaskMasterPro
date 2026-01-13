import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Home } from 'lucide-react';
import { getProjectById } from '../api/projects';
import { useTranslation } from 'react-i18next';

const Breadcrumbs = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);
    const [projectName, setProjectName] = useState<string>('');

    // Check if we're on a project details page
    const isProjectDetails = pathnames[0] === 'projects' && pathnames.length === 2;
    const projectId = isProjectDetails ? pathnames[1] : null;

    // Fetch project name if on project details page
    const { data: project } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => getProjectById(projectId!),
        enabled: !!projectId,
    });

    useEffect(() => {
        if (project) {
            setProjectName(project.name);
        }
    }, [project]);

    return (
        <nav className="flex px-4 py-3 text-gray-700 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                    <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-white">
                        <Home className="w-4 h-4 mr-2" />
                        {t('breadcrumbs.dashboard')}
                    </Link>
                </li>
                {pathnames.map((value, index) => {
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;

                    // Determine display name
                    let name = t(`breadcrumbs.${value}`, value.charAt(0).toUpperCase() + value.slice(1));

                    // If this is the project ID segment and we have the project name, use it
                    if (isProjectDetails && index === 1 && projectName) {
                        name = projectName;
                    }

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
