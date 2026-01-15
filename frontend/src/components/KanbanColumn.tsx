import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Task } from '../api/tasks';
import TaskCard from './TaskCard';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface KanbanColumnProps {
    id: string;
    title: string;
    tasks: Task[];
    onEdit?: (task: Task) => void;
    onDelete?: (id: string) => void;
    onToggleStatus: (task: Task) => void;
    onView?: (task: Task) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, tasks, onEdit, onDelete, onToggleStatus, onView }) => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 min-h-[400px]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    {t(title)}
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full">
                        {tasks.length}
                    </span>
                </h3>
            </div>

            <Droppable droppableId={id}>
                {(provided, snapshot) => (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={clsx(
                            "flex-1 space-y-4 transition-colors rounded-lg pb-4",
                            snapshot.isDraggingOver ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""
                        )}
                    >
                        {tasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={clsx(
                                            "transition-shadow",
                                            snapshot.isDragging ? "shadow-2xl z-50" : ""
                                        )}
                                    >
                                        <TaskCard
                                            task={task}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            onToggleStatus={onToggleStatus}
                                            onView={onView}
                                        />
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};

export default KanbanColumn;
