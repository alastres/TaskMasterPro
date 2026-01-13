import React from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Task, updateTask } from '../api/tasks';
import KanbanColumn from './KanbanColumn';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface KanbanBoardProps {
    tasks: Task[];
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (task: Task) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onEdit, onDelete, onToggleStatus }) => {
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

        // Optimistic update would be nice, but let's start with a simple mutation
        updateStatusMutation.mutate({ id: draggableId, status: newStatus });
    };

    const columns: { id: Task['status']; title: string; tasks: Task[] }[] = [
        {
            id: 'PENDING',
            title: 'projects.kanban.todo',
            tasks: tasks.filter(t => t.status === 'PENDING')
        },
        {
            id: 'IN_PROGRESS',
            title: 'projects.kanban.inProgress',
            tasks: tasks.filter(t => t.status === 'IN_PROGRESS')
        },
        {
            id: 'COMPLETED',
            title: 'projects.kanban.done',
            tasks: tasks.filter(t => t.status === 'COMPLETED')
        }
    ];

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
