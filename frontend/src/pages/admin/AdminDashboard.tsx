import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCronConfig, updateCronConfig, triggerCronJob } from '../../api/admin';
import { Settings, Play, Loader2, Save, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { useTranslation } from 'react-i18next';

const AdminDashboard: React.FC = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { t } = useTranslation();

    const [schedule, setSchedule] = useState('0 0 * * *');
    const [enabled, setEnabled] = useState(true);

    const { data: config, isLoading } = useQuery({
        queryKey: ['cron-config'],
        queryFn: getCronConfig
    });

    useEffect(() => {
        if (config) {
            setSchedule(config.schedule || '0 0 * * *');
            setEnabled(config.enabled !== false);
        }
    }, [config]);

    const updateMutation = useMutation({
        mutationFn: updateCronConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cron-config'] });
            toast({
                title: t('admin.configSaved'),
                description: t('admin.configSavedDesc'),
                type: 'success'
            });
        },
        onError: (error: any) => {
            toast({
                title: t('common.error'),
                description: error.response?.data?.message || t('admin.configError'),
                type: 'error'
            });
        }
    });

    const triggerMutation = useMutation({
        mutationFn: triggerCronJob,
        onSuccess: () => {
            toast({
                title: t('admin.tasksExecuted'),
                description: t('admin.tasksExecutedDesc'),
                type: 'success'
            });
        },
        onError: (error: any) => {
            toast({
                title: t('common.error'),
                description: error.response?.data?.message || t('admin.tasksError'),
                type: 'error'
            });
        }
    });

    const handleSave = () => {
        updateMutation.mutate({ schedule, enabled });
    };

    const handleTrigger = () => {
        triggerMutation.mutate();
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                    <Settings className="h-8 w-8 text-indigo-600" />
                    {t('admin.title')}
                </h1>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                    {t('admin.subtitle')}
                </p>
            </div>

            {/* User Management Link */}
            <Link to="/admin/users" className="block bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 border border-indigo-100 dark:border-indigo-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-xl">
                            <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {t('admin.userManagement')}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('admin.userManagementDesc')}
                            </p>
                        </div>
                    </div>
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </Link>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {t('admin.cronConfig')}
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={enabled}
                                    onChange={(e) => setEnabled(e.target.checked)}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                {t('admin.cronEnabled')}
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('admin.cronExpression')}
                            </label>
                            <input
                                type="text"
                                value={schedule}
                                onChange={(e) => setSchedule(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                placeholder={t('admin.cronExpressionPlaceholder')}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {t('admin.cronExpressionHelp')}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleSave}
                                disabled={updateMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {updateMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                {t('admin.saveConfig')}
                            </button>

                            <button
                                onClick={handleTrigger}
                                disabled={triggerMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {triggerMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Play className="h-4 w-4" />
                                )}
                                {t('admin.runNow')}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t pt-4 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {t('admin.scheduledTasks')}
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li>• {t('admin.task1')}</li>
                        <li>• {t('admin.task2')}</li>
                        <li>• {t('admin.task3')}</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
