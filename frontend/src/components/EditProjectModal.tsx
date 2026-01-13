import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { updateProject, Project } from '../api/projects';
import { X, Loader2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './ui/Toast';

interface EditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({ isOpen, onClose, project }) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const projectSchema = z.object({
        name: z.string().min(1, t('validation.required')),
        description: z.string().optional(),
    });

    type ProjectForm = z.infer<typeof projectSchema>;

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProjectForm>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            name: project.name,
            description: project.description || '',
        },
    });

    useEffect(() => {
        if (project) {
            setValue('name', project.name);
            setValue('description', project.description || '');
        }
    }, [project, isOpen, setValue]);

    const mutation = useMutation({
        mutationFn: (data: ProjectForm) => updateProject(project.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', project.id] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            onClose();
            toast({
                title: t('common.success'),
                description: t('projects.updateSuccess'),
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

    const onSubmit = (data: ProjectForm) => {
        mutation.mutate(data);
    };

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
                                                    {t('projects.editProject')}
                                                </Dialog.Title>
                                                <Dialog.Close asChild>
                                                    <button className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-1 transition-colors">
                                                        <X className="h-5 w-5" />
                                                    </button>
                                                </Dialog.Close>
                                            </div>

                                            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                                                <div className="space-y-1">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('projects.projectName')}</label>
                                                    <input
                                                        type="text"
                                                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                                        {...register('name')}
                                                    />
                                                    {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('tasks.description')}</label>
                                                    <textarea
                                                        rows={3}
                                                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                                        {...register('description')}
                                                    />
                                                </div>

                                                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={onClose}
                                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                                    >
                                                        {t('common.cancel')}
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={mutation.isPending}
                                                        className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        {mutation.isPending && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                                                        {t('common.save')}
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

export default EditProjectModal;
