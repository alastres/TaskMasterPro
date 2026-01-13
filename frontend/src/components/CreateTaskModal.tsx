import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTask, updateTask, Task } from '../api/tasks';
import { getProjects } from '../api/projects';
import { X, Loader2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';

const taskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    tags: z.string().optional(),
    projectId: z.string().optional(),
});

type TaskForm = z.infer<typeof taskSchema>;

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskToEdit?: Task | null;
    defaultProjectId?: string;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, taskToEdit, defaultProjectId }) => {
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<TaskForm>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            status: 'PENDING',
            priority: 'MEDIUM',
            projectId: defaultProjectId || '',
        },
    });

    // Fetch projects for the dropdown
    const { data: projects } = useQuery({
        queryKey: ['projects'],
        queryFn: getProjects,
        enabled: !defaultProjectId, // Only fetch if not pre-assigned to a project
    });

    useEffect(() => {
        if (taskToEdit) {
            setValue('title', taskToEdit.title);
            setValue('description', taskToEdit.description || '');
            setValue('status', taskToEdit.status);
            setValue('priority', taskToEdit.priority);
            setValue('tags', taskToEdit.tags.join(', '));
            // Note: Task interface might need projectId field added
        } else {
            reset({
                title: '',
                description: '',
                status: 'PENDING',
                priority: 'MEDIUM',
                tags: '',
                projectId: defaultProjectId || '',
            });
        }
    }, [taskToEdit, isOpen, setValue, reset, defaultProjectId]);

    const createMutation = useMutation({
        mutationFn: createTask,
        onSuccess: () => {
            // Invalidate all task queries
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            // Invalidate all project queries to update counts
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            // Invalidate specific project if task was created within a project
            if (defaultProjectId) {
                queryClient.invalidateQueries({ queryKey: ['project', defaultProjectId] });
            }
            reset();
            onClose();
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => updateTask(taskToEdit!.id, data),
        onSuccess: () => {
            // Invalidate all task queries
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            // Invalidate all project queries
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            // Invalidate specific project if task belongs to a project
            if (defaultProjectId) {
                queryClient.invalidateQueries({ queryKey: ['project', defaultProjectId] });
            }
            reset();
            onClose();
        },
    });

    const onSubmit = (data: TaskForm) => {
        const payload = {
            ...data,
            tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            projectId: data.projectId || undefined, // Convert empty string to undefined
        };

        if (taskToEdit) {
            updateMutation.mutate(payload);
        } else {
            createMutation.mutate(payload);
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AnimatePresence>
                {isOpen && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 grid place-items-center overflow-y-auto p-4"
                            >
                                <Dialog.Content asChild>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full max-w-lg relative z-50"
                                    >
                                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden w-full">
                                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                                                <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                                    {taskToEdit ? 'Edit Task' : 'Create New Task'}
                                                </Dialog.Title>
                                                <Dialog.Close asChild>
                                                    <button className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-1 transition-colors">
                                                        <X className="h-5 w-5" />
                                                    </button>
                                                </Dialog.Close>
                                            </div>

                                            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                                                <div className="space-y-1">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                                                    <input
                                                        type="text"
                                                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                                        {...register('title')}
                                                    />
                                                    {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                                    <textarea
                                                        rows={3}
                                                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                                        {...register('description')}
                                                    />
                                                </div>

                                                {/* Project Selector - Only show if not locked to a project */}
                                                {!defaultProjectId && (
                                                    <div className="space-y-1">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project (Optional)</label>
                                                        <select
                                                            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                                            {...register('projectId')}
                                                        >
                                                            <option value="">No Project</option>
                                                            {projects?.map((project) => (
                                                                <option key={project.id} value={project.id}>
                                                                    {project.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                                        <select
                                                            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                                            {...register('status')}
                                                        >
                                                            <option value="PENDING">Pending</option>
                                                            <option value="IN_PROGRESS">In Progress</option>
                                                            <option value="COMPLETED">Completed</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                                                        <select
                                                            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                                            {...register('priority')}
                                                        >
                                                            <option value="LOW">Low</option>
                                                            <option value="MEDIUM">Medium</option>
                                                            <option value="HIGH">High</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags (comma separated)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="ui, frontend, urgency"
                                                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                                        {...register('tags')}
                                                    />
                                                </div>

                                                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={onClose}
                                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={isPending}
                                                        className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        {isPending && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                                                        {taskToEdit ? 'Update Task' : 'Create Task'}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </motion.div>
                                </Dialog.Content>
                            </motion.div>
                        </Dialog.Overlay>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
};

export default CreateTaskModal;
