import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import KanbanBoard from '../KanbanBoard';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@tanstack/react-query', () => ({
    useMutation: () => ({ mutate: vi.fn() }),
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

// Mock dnd context if necessary, but shallow rendering might be hard via RTL.
// hello-pangea/dnd might error if not mocked in JSDOM environment?
// It usually requires some setup. For now we will try rendering it.
// Explicitly mocking DragDropContext to just render children is often safest for unit tests not testing drag physics.

vi.mock('@hello-pangea/dnd', async () => {
    return {
        DragDropContext: ({ children }: any) => <div>{children}</div>,
        Droppable: ({ children }: any) => children({ draggableProps: {}, innerRef: null }, {}),
        Draggable: ({ children }: any) => children({ draggableProps: {}, dragHandleProps: {}, innerRef: null }, {}),
    };
});
// Need to mock KanbanColumn too if we want to isolate board logic or if Column has dependencies.
// But let's try rendering integration of Board + Columns (mocking Column's complex parts might be skipped for now)

vi.mock('../KanbanColumn', () => ({
    default: ({ title }: any) => <div data-testid="kanban-column">{title}</div>
}));

describe('KanbanBoard', () => {
    it('renders 3 columns', () => {
        render(
            <KanbanBoard
                tasks={[]}
                onToggleStatus={vi.fn()}
            />
        );

        expect(screen.getAllByTestId('kanban-column')).toHaveLength(3);
        expect(screen.getByText('projects.kanban.todo')).toBeInTheDocument();
        expect(screen.getByText('projects.kanban.inProgress')).toBeInTheDocument();
        expect(screen.getByText('projects.kanban.done')).toBeInTheDocument();
    });
});
