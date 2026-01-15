import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyTeam } from '../api/teams';
import { Users, Loader2, Shield, LayoutGrid } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProjectMembersTable from '../components/teams/ProjectMembersTable';

const TeamManagement: React.FC = () => {
    const { t } = useTranslation();

    const { data: team, isLoading: isLoadingTeam } = useQuery({
        queryKey: ['my-team'],
        queryFn: getMyTeam
    });

    if (isLoadingTeam) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                    <Users className="h-8 w-8 text-indigo-600" />
                    {t('teams.title')}
                </h1>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                    {t('teams.subtitle')}
                </p>
            </div>

            <div className="space-y-6">
                {team?.projects.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-dashed border-gray-200 dark:border-gray-700">
                        <LayoutGrid className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('teams.noProjects')}</h3>
                        <p className="text-gray-500 dark:text-gray-400">{t('teams.createProjectPrompt')}</p>
                    </div>
                ) : (
                    <ProjectMembersTable projects={team?.projects || []} />
                )}
            </div>

            {/* Owner/Team Info (Secondary) */}
            <div className="pt-8 border-t border-gray-100 dark:border-gray-700">
                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <Shield className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{t('teams.myTeam')}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('teams.ownerInfo')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamManagement;
