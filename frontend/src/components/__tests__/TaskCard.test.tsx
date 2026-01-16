import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskCard from '../TaskCard';
import { Task } from '../../api/tasks';

// Mock translation
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            if (key === 'tasks.dateFormat') return 'yyyy-MM-dd';
            return key;
        }
    }),
}));

const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'PENDING',
    priority: 'HIGH',
    dueDate: new Date().toISOString(),
    tags: ['tag1'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

describe('TaskCard', () => {
    it('renders task details', () => {
        render(
            <TaskCard
                task={mockTask}
                onToggleStatus={vi.fn()}
            />
        );

        expect(screen.getByText('Test Task')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
        expect(screen.getByText('tasks.priorityHigh')).toBeInTheDocument();
        expect(screen.getByText('tag1')).toBeInTheDocument();
    });

    it('calls actions when buttons clicked', () => {
        const onEdit = vi.fn();
        const onDelete = vi.fn();
        const onToggle = vi.fn();

        render(
            <TaskCard
                task={mockTask}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleStatus={onToggle}
            />
        );

        fireEvent.click(screen.getByLabelText('tasks.editTaskAria'));
        expect(onEdit).toHaveBeenCalledWith(mockTask);

        fireEvent.click(screen.getByLabelText('tasks.deleteTaskAria'));
        expect(onDelete).toHaveBeenCalledWith('1');

        fireEvent.click(screen.getByLabelText('tasks.markCompleted'));
        expect(onToggle).toHaveBeenCalledWith(mockTask);
    });
});
