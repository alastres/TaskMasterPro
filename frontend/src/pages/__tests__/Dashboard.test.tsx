import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from '../Dashboard';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../../components/ui/Toast', () => ({
    useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('../../components/TaskCard', () => ({
    default: ({ task }: any) => <div data-testid="task-card">{task.title}</div>
}));
vi.mock('../../components/CreateTaskModal', () => ({
    default: () => <div />
}));
vi.mock('../../components/TaskDetailModal', () => ({
    default: () => <div />
}));
vi.mock('../../components/ui/AlertDialog', () => ({
    AlertDialog: () => <div />
}));

vi.mock('@tanstack/react-query', () => ({
    useQuery: () => ({
        data: [{ id: '1', title: 'Task 1' }],
        isLoading: false,
        error: null
    }),
    useMutation: () => ({ mutate: vi.fn() }),
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

describe('Dashboard', () => {
    it('renders dashboard with tasks', () => {
        render(<Dashboard />);
        expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
        expect(screen.getByText('Task 1')).toBeInTheDocument();
    });
});
