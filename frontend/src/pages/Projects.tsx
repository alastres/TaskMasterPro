import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getProjects, createProject } from '../api/projects';
import { Folder, Plus, Loader2, Calendar, Search, User, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

const Projects = () => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const createProjectSchema = z.object({
        name: z.string().min(1, t('validation.required')),
        description: z.string().optional(),
    });

    type CreateProjectForm = z.infer<typeof createProjectSchema>;

    const { data: projects, isLoading, isError } = useQuery({
        queryKey: ['projects'],
        queryFn: getProjects,
    });

    const filteredProjects = projects?.filter((project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const createMutation = useMutation({
        mutationFn: createProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setIsCreateModalOpen(false);
            reset();
            toast({
                title: t('common.success'),
                description: t('projects.createSuccess'),
                type: 'success'
            });
        },
        onError: (error: any) => {
            toast({
                title: t('common.error'),
                description: error.response?.data?.message || t('common.error'),
                type: 'error'
            });
        },
    });

    const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateProjectForm>({
        resolver: zodResolver(createProjectSchema),
    });

    const onSubmit = (data: CreateProjectForm) => {
        createMutation.mutate(data);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
            </div>
        );
    }

    if (isError) {
        return <div className="text-center text-red-500 dark:text-red-400">{t('common.error')}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.projects')}</h1>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    {t('projects.newProject')}
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                    type="text"
                    placeholder={t('projects.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                />
            </div>

            {filteredProjects?.length === 0 ? (
                <div className="text-center py-12">
                    <Folder className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        {searchQuery ? t('common.noResults') : t('projects.noProjects')}
                    </h3>
                    {!searchQuery && (
                        <div className="mt-6">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                {t('projects.newProject')}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    {/* My Projects */}
                    {filteredProjects && filteredProjects.some(p => p.isOwner) && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <User size={20} className="text-indigo-500" />
                                {t('projects.myProjects')}
                            </h2>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredProjects
                                    .filter(project => project.isOwner)
                                    .map((project) => (
                                        <Link key={project.id} to={`/projects/${project.id}`}>
                                            <motion.div
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                                            >
                                                <div className="p-5">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0">
                                                            <Folder className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                                                        </div>
                                                        <div className="ml-5 w-0 flex-1">
                                                            <dl>
                                                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                                                    {project.name}
                                                                </dt>
                                                                <dd>
                                                                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                                                                        {t('projects.tasksCount', { count: project._count?.tasks || 0 })}
                                                                    </div>
                                                                </dd>
                                                            </dl>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3">
                                                    <div className="text-sm">
                                                        <div className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center">
                                                            <Calendar className="h-4 w-4 mr-1" />
                                                            {format(new Date(project.createdAt), 'MMM d, yyyy')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </Link>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Shared Projects */}
                    {filteredProjects && filteredProjects.some(p => !p.isOwner) && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Users size={20} className="text-purple-500" />
                                {t('projects.sharedProjects')}
                            </h2>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredProjects
                                    .filter(project => !project.isOwner)
                                    .map((project) => (
                                        <Link key={project.id} to={`/projects/${project.id}`}>
                                            <motion.div
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-purple-100 dark:border-purple-900/30 hover:shadow-md transition-shadow cursor-pointer relative"
                                            >
                                                <div className="absolute top-0 right-0 p-2">
                                                    <div className="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 text-xs px-2 py-1 rounded-full font-bold">
                                                        {t('projects.sharedBadge')}
                                                    </div>
                                                </div>
                                                <div className="p-5">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0">
                                                            <Folder className="h-6 w-6 text-purple-400 dark:text-purple-500" />
                                                        </div>
                                                        <div className="ml-5 w-0 flex-1">
                                                            <dl>
                                                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                                                    {project.name}
                                                                </dt>
                                                                <dd>
                                                                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                                                                        {t('projects.tasksCount', { count: project._count?.tasks || 0 })}
                                                                    </div>
                                                                </dd>
                                                            </dl>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3">
                                                    <div className="text-sm">
                                                        <div className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center">
                                                            <Calendar className="h-4 w-4 mr-1" />
                                                            {format(new Date(project.createdAt), 'MMM d, yyyy')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </Link>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Create Project Modal */}
            <Dialog.Root open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
                    <Dialog.Content className="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white dark:bg-gray-800 p-6 shadow-2xl focus:outline-none z-50 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                                {t('projects.createProject')}
                            </Dialog.Title>
                            <Dialog.Close asChild>
                                <button className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400">
                                    <X className="h-5 w-5" />
                                </button>
                            </Dialog.Close>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('projects.projectName')}
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 transition-colors"
                                    {...register('name')}
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('tasks.description')}
                                </label>
                                <textarea
                                    id="description"
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 transition-colors"
                                    {...register('description')}
                                />
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors flex items-center"
                                >
                                    {createMutation.isPending && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                                    {t('projects.createProject')}
                                </button>
                            </div>
                        </form>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>

    );
};

export default Projects;
