
import React from 'react';
import { Task } from '../api/tasks';
import TaskCard from './TaskCard';
import KanbanBoard from './KanbanBoard';
import { useTranslation } from 'react-i18next';

interface ProjectTasksViewProps {
    viewMode: 'list' | 'board';
    tasks: Task[];
    isOwner: boolean;
    onEditTask?: (task: Task) => void;
    onDeleteTask?: (id: string, e?: React.MouseEvent) => void;
    onToggleTaskStatus: (task: Task) => void;
    onViewTask: (task: Task) => void;
    prioritySort?: 'asc' | 'desc' | null;
}

const ProjectTasksView: React.FC<ProjectTasksViewProps> = ({
    viewMode,
    tasks,
    isOwner,
    onEditTask,
    onDeleteTask,
    onToggleTaskStatus,
    onViewTask,
    prioritySort,
}) => {
    const { t } = useTranslation();

    // Sort tasks if needed
    const getSortedTasks = (tasksToExp: Task[]) => {
        if (!prioritySort) return tasksToExp;

        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };

        return [...tasksToExp].sort((a, b) => {
            const pA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
            const pB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
            return prioritySort === 'asc' ? pA - pB : pB - pA;
        });
    };

    const sortedTasks = getSortedTasks(tasks);

    if (viewMode === 'list') {
        return (
            <div className="h-full overflow-y-auto p-1 custom-scrollbar">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-8">
                    {sortedTasks.length > 0 ? (
                        sortedTasks.map((task: Task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onEdit={isOwner ? onEditTask : undefined}
                                onDelete={isOwner ? onDeleteTask : undefined}
                                onToggleStatus={onToggleTaskStatus}
                                onView={onViewTask}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                            {t('projects.noTasksInProject')}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto overflow-x-auto p-1 custom-scrollbar">
            <div className="w-full">
                <KanbanBoard
                    tasks={tasks}
                    onEdit={isOwner ? onEditTask : undefined}
                    onDelete={isOwner ? (id) => onDeleteTask?.(id) : undefined}
                    onToggleStatus={onToggleTaskStatus}
                    onView={onViewTask}
                    prioritySort={prioritySort}
                />
            </div>
        </div>
    );
};

export default ProjectTasksView;
