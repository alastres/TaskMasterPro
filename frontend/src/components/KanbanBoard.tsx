import React, { useMemo } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Task, updateTask } from '../api/tasks';
import KanbanColumn from './KanbanColumn';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { priorityWeight } from '../pages/ProjectDetails';

interface KanbanBoardProps {
    tasks: Task[];
    onEdit?: (task: Task) => void;
    onDelete?: (id: string) => void;
    onToggleStatus: (task: Task) => void;
    prioritySort?: 'asc' | 'desc' | null;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onEdit, onDelete, onToggleStatus, prioritySort }) => {
    const queryClient = useQueryClient();

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: Task['status'] }) =>
            updateTask(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['project'] });
        }
    });

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const newStatus = destination.droppableId as Task['status'];

        updateStatusMutation.mutate({ id: draggableId, status: newStatus });
    };

    const columns = useMemo(() => {
        const getColumnTasks = (status: Task['status']) => {
            let colTasks = tasks.filter(t => t.status === status);
            if (prioritySort) {
                colTasks.sort((a, b) => {
                    const weightA = priorityWeight[a.priority];
                    const weightB = priorityWeight[b.priority];
                    return prioritySort === 'desc' ? weightB - weightA : weightA - weightB;
                });
            }
            return colTasks;
        };

        return [
            {
                id: 'PENDING' as const,
                title: 'projects.kanban.todo',
                tasks: getColumnTasks('PENDING')
            },
            {
                id: 'IN_PROGRESS' as const,
                title: 'projects.kanban.inProgress',
                tasks: getColumnTasks('IN_PROGRESS')
            },
            {
                id: 'COMPLETED' as const,
                title: 'projects.kanban.done',
                tasks: getColumnTasks('COMPLETED')
            }
        ];
    }, [tasks, prioritySort]);

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]">
                {columns.map(column => (
                    <KanbanColumn
                        key={column.id}
                        id={column.id}
                        title={column.title}
                        tasks={column.tasks}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onToggleStatus={onToggleStatus}
                    />
                ))}
            </div>
        </DragDropContext>
    );
};

export default KanbanBoard;
