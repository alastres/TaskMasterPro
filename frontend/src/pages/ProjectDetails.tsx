import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getProjectById, deleteProject } from '../api/projects';
import { Loader2, Plus, Trash2, ArrowLeft, Edit2, LayoutGrid, List as ListIcon, SortAsc, SortDesc, UserPlus, Mail, X } from 'lucide-react';
import { updateTask, deleteTask, Task } from '../api/tasks';
import TaskCard from '../components/TaskCard';
import KanbanBoard from '../components/KanbanBoard';
import CreateTaskModal from '../components/CreateTaskModal';
import EditProjectModal from '../components/EditProjectModal';
import { getMyTeam, inviteMember, removeMemberFromProject } from '../api/teams';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/auth.store';
import clsx from 'clsx';

export const priorityWeight: Record<string, number> = {
    'LOW': 1,
    'MEDIUM': 2,
    'HIGH': 3
};

const ProjectDetails = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuthStore();
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
    const [prioritySort, setPrioritySort] = useState<'asc' | 'desc' | null>(null);

    const { data: project, isLoading, isError } = useQuery({
        queryKey: ['project', id],
        queryFn: () => getProjectById(id!),
        enabled: !!id,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            navigate('/projects');
        },
    });

    const inviteMutation = useMutation({
        mutationFn: async (email: string) => {
            const team = await getMyTeam();
            return inviteMember(team.id, email, id!);
        },
        onSuccess: () => {
            setInviteEmail('');
            setIsInviteModalOpen(false);
            alert(t('teams.inviteSuccess'));
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || t('common.error'));
        }
    });

    const removeMemberMutation = useMutation({
        mutationFn: (userId: string) => removeMemberFromProject(id!, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', id] });
        }
    });

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (inviteEmail) inviteMutation.mutate(inviteEmail);
    };

    const sortedTasks = useMemo(() => {
        if (!project?.tasks) return [];
        let tasks = [...project.tasks];

        if (prioritySort) {
            tasks.sort((a, b) => {
                const weightA = priorityWeight[a.priority];
                const weightB = priorityWeight[b.priority];
                return prioritySort === 'desc' ? weightB - weightA : weightA - weightB;
            });
        }

        return tasks;
    }, [project?.tasks, prioritySort]);

    const handleDelete = () => {
        if (window.confirm(t('projects.deleteConfirm'))) {
            deleteMutation.mutate(id!);
        }
    };

    const handleEditTask = (task: Task) => {
        setTaskToEdit(task);
        setIsCreateTaskModalOpen(true);
    };

    const closeTaskModal = () => {
        setIsCreateTaskModalOpen(false);
        setTaskToEdit(null);
    };

    const togglePrioritySort = () => {
        if (prioritySort === null) setPrioritySort('desc');
        else if (prioritySort === 'desc') setPrioritySort('asc');
        else setPrioritySort(null);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
            </div>
        );
    }

    if (isError || !project) {
        return <div className="text-center text-red-500 dark:text-red-400">{t('common.error')}</div>;
    }

    const onToggleTaskStatus = (task: Task) => {
        const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        updateTask(task.id, { status: newStatus }).then(() => {
            queryClient.invalidateQueries({ queryKey: ['project', project.id] });
        });
    };

    const onDeleteTask = async (id: string) => {
        if (window.confirm(t('tasks.deleteConfirm'))) {
            await deleteTask(id);
            queryClient.invalidateQueries({ queryKey: ['project', project.id] });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <button onClick={() => navigate('/projects')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400" title={t('common.back')}>
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
                    {project.description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
                    )}
                </div>

                {/* View/Sort Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={togglePrioritySort}
                        className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border shadow-sm",
                            prioritySort
                                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800"
                        )}
                        title={t('projects.sortByPriority')}
                    >
                        {prioritySort === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                        <span className="hidden sm:inline">
                            {prioritySort === 'desc' ? t('tasks.priorityHigh') : prioritySort === 'asc' ? t('tasks.priorityLow') : t('projects.sortByPriority')}
                        </span>
                    </button>

                    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={clsx(
                                "p-1.5 rounded-md transition-all shadow-sm",
                                viewMode === 'list'
                                    ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 border border-gray-200 dark:border-gray-600"
                                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            )}
                            title={t('projects.viewList')}
                        >
                            <ListIcon className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('board')}
                            className={clsx(
                                "p-1.5 rounded-md transition-all shadow-sm",
                                viewMode === 'board'
                                    ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 border border-gray-200 dark:border-gray-600"
                                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            )}
                            title={t('projects.viewBoard')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {project.isOwner && (
                    <>
                        <button
                            onClick={() => setIsInviteModalOpen(true)}
                            className="p-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                            title={t('teams.invite')}
                        >
                            <UserPlus className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setIsEditProjectModalOpen(true)}
                            className="p-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                            title={t('projects.editProject')}
                        >
                            <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            title={t('projects.deleteProject')}
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                    </>
                )}
            </div>

            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="flex items-center gap-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">{t('tasks.tasks')}</h2>
                    {project.members && project.members.length > 0 && (
                        <div className="flex -space-x-2">
                            {project.members.map((member: any) => (
                                <div
                                    key={member.id}
                                    className="relative group"
                                    title={member.user.name}
                                >
                                    {member.user.avatarUrl ? (
                                        <img
                                            src={member.user.avatarUrl}
                                            alt={member.user.name}
                                            className="h-8 w-8 rounded-full border-2 border-white dark:border-gray-900 object-cover"
                                        />
                                    ) : (
                                        <div className="h-8 w-8 rounded-full border-2 border-white dark:border-gray-900 bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                            {member.user.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    {project.isOwner && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`${t('common.delete')} ${member.user.name}?`)) {
                                                    removeMemberMutation.mutate(member.user.id);
                                                }
                                            }}
                                            className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                        >
                                            <X size={10} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {project.isOwner && (
                    <button
                        onClick={() => setIsCreateTaskModalOpen(true)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        <Plus className="-ml-1 mr-1 h-4 w-4" aria-hidden="true" />
                        {t('projects.addTask')}
                    </button>
                )}
            </div>

            {viewMode === 'list' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sortedTasks.length > 0 ? (
                        sortedTasks.map((task: Task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onEdit={project.isOwner ? handleEditTask : undefined}
                                onDelete={project.isOwner ? onDeleteTask : undefined}
                                onToggleStatus={onToggleTaskStatus}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                            {t('projects.noTasksInProject')}
                        </div>
                    )}
                </div>
            ) : (
                <KanbanBoard
                    tasks={project.tasks || []}
                    onEdit={project.isOwner ? handleEditTask : undefined}
                    onDelete={project.isOwner ? onDeleteTask : undefined}
                    onToggleStatus={onToggleTaskStatus}
                    prioritySort={prioritySort}
                />
            )}

            <CreateTaskModal
                isOpen={isCreateTaskModalOpen}
                onClose={closeTaskModal}
                taskToEdit={taskToEdit}
                defaultProjectId={project.id}
            />

            <EditProjectModal
                isOpen={isEditProjectModalOpen}
                onClose={() => setIsEditProjectModalOpen(false)}
                project={project}
            />

            <AnimatePresence>
                {isInviteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <UserPlus className="h-5 w-5 text-indigo-600" />
                                    {t('teams.inviteMember')}
                                </h3>
                                <button onClick={() => setIsInviteModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleInvite} className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t('teams.inviteMemberInstructions') || 'Introduce el correo electrónico para invitar a colaborar en este proyecto.'}
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            placeholder={t('teams.emailPlaceholder')}
                                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsInviteModalOpen(false)}
                                        className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={inviteMutation.isPending}
                                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        {inviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                        {t('teams.invite')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProjectDetails;
