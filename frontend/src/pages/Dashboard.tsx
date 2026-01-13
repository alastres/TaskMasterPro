import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getTasks, deleteTask, updateTask, Task } from '../api/tasks';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/CreateTaskModal';
import { Plus, Search, Loader2, LayoutDashboard } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/ui/Toast';
import { AlertDialog } from '../components/ui/AlertDialog';

const Dashboard = () => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [status, setStatus] = useState<string>('');
    const [priority, setPriority] = useState<string>('');

    const queryClient = useQueryClient();

    const { data: tasks, isLoading, error } = useQuery({
        queryKey: ['tasks', { search: debouncedSearch, status, priority, projectId: null }],
        queryFn: () => getTasks({ search: debouncedSearch, status, priority, projectId: null }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast({
                title: t('common.success'),
                description: t('tasks.deleteSuccess'),
                type: 'success'
            });
            setTaskToDelete(null);
        },
        onError: (error: any) => {
            toast({
                title: t('common.error'),
                description: error.response?.data?.message || t('common.error'),
                type: 'error'
            });
            setTaskToDelete(null);
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' }) =>
            updateTask(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast({
                title: t('common.success'),
                description: t('tasks.updateSuccess'),
                type: 'success'
            });
        },
    });

    const handleEdit = (task: Task) => {
        setTaskToEdit(task);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        setTaskToDelete(id);
    };

    const confirmDelete = () => {
        if (taskToDelete) {
            deleteMutation.mutate(taskToDelete);
        }
    };

    const handleToggleStatus = (task: Task) => {
        const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        updateStatusMutation.mutate({ id: task.id, status: newStatus });
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTaskToEdit(null);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <LayoutDashboard className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.dashboard')}</h1>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-105"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    {t('tasks.newTask')}
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
                <div className="flex-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                        <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                        type="text"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 py-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg transition-colors text-sm sm:text-base md:text-lg"
                        placeholder={t('tasks.searchPlaceholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex space-x-4">
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                    >
                        <option value="">{t('tasks.allStatus')}</option>
                        <option value="PENDING">{t('tasks.statusPending')}</option>
                        <option value="IN_PROGRESS">{t('tasks.statusInProgress')}</option>
                        <option value="COMPLETED">{t('tasks.statusCompleted')}</option>
                    </select>

                    <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                    >
                        <option value="">{t('tasks.allPriorities')}</option>
                        <option value="LOW">{t('tasks.priorityLow')}</option>
                        <option value="MEDIUM">{t('tasks.priorityMedium')}</option>
                        <option value="HIGH">{t('tasks.priorityHigh')}</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                </div>
            ) : error ? (
                <div className="text-center py-12 text-red-600">
                    {t('common.error')}
                </div>
            ) : tasks?.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700"
                >
                    <p className="text-gray-500 dark:text-gray-400 text-lg">{t('tasks.noTasks')}</p>
                </motion.div>
            ) : (
                <motion.div
                    layout
                    className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                    <AnimatePresence>
                        {tasks?.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onToggleStatus={handleToggleStatus}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            <CreateTaskModal
                isOpen={isModalOpen}
                onClose={closeModal}
                taskToEdit={taskToEdit}
            />

            <AlertDialog
                isOpen={!!taskToDelete}
                onOpenChange={(open) => !open && setTaskToDelete(null)}
                onConfirm={confirmDelete}
                title={t('tasks.deleteTask')}
                description={t('tasks.deleteConfirm')}
                variant="danger"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
};

export default Dashboard;
