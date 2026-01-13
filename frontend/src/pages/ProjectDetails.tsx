import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getProjectById, deleteProject } from '../api/projects';
import { Loader2, Plus, Trash2, ArrowLeft, Edit2 } from 'lucide-react';
import { updateTask, deleteTask, Task } from '../api/tasks';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/CreateTaskModal';
import EditProjectModal from '../components/EditProjectModal';

const ProjectDetails = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

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
            </div>

            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">{t('tasks.tasks')}</h2>
                <button
                    onClick={() => setIsCreateTaskModalOpen(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                    <Plus className="-ml-1 mr-1 h-4 w-4" aria-hidden="true" />
                    {t('projects.addTask')}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {project.tasks && project.tasks.length > 0 ? (
                    project.tasks.map((task: Task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onEdit={handleEditTask}
                            onDelete={async (id: string) => {
                                if (window.confirm(t('tasks.deleteConfirm'))) {
                                    await deleteTask(id);
                                    queryClient.invalidateQueries({ queryKey: ['project', project.id] });
                                }
                            }}
                            onToggleStatus={(task: Task) => {
                                const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
                                updateTask(task.id, { status: newStatus }).then(() => {
                                    queryClient.invalidateQueries({ queryKey: ['project', project.id] });
                                });
                            }}
                        />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                        {t('projects.noTasksInProject')}
                    </div>
                )}
            </div>

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
        </div>
    );
};

export default ProjectDetails;
