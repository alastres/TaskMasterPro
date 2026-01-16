import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateTaskModal from '../CreateTaskModal';

// Mock translation and UI components
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../ui/Toast', () => ({
    useToast: () => ({ toast: vi.fn() }),
}));

// Mock API
vi.mock('../api/tasks');
vi.mock('../api/projects', () => ({
    getProjects: vi.fn().mockResolvedValue([]),
}));

// Mock React Query
const { mockMutate } = vi.hoisted(() => {
    return { mockMutate: vi.fn() };
});

vi.mock('@tanstack/react-query', () => ({
    useMutation: (options: any) => ({
        mutate: (data: any) => {
            mockMutate(data);
            options.onSuccess();
        },
        isPending: false,
    }),
    useQuery: () => ({ data: [] }),
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

// Mock Framer Motion
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual,
        motion: { // basic mock for motion.div
            div: ({ children, ...props }: any) => <div {...props}>{children}</div>
        },
        AnimatePresence: ({ children }: any) => <>{children}</>
    };
});

// Mock Radix UI Dialog
vi.mock('@radix-ui/react-dialog', () => ({
    Root: ({ children }: any) => <div>{children}</div>,
    Portal: ({ children }: any) => <div>{children}</div>,
    Overlay: ({ children }: any) => <div>{children}</div>,
    Content: ({ children }: any) => <div>{children}</div>,
    Title: ({ children }: any) => <h1>{children}</h1>,
    Close: ({ children, asChild }: any) => asChild ? children : <button>{children}</button>,
}));

describe('CreateTaskModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not render form content when isOpen is false', () => {
        render(<CreateTaskModal isOpen={false} onClose={vi.fn()} />);
        expect(screen.queryByText('tasks.createTask')).not.toBeInTheDocument();
    });

    it('renders form when open', () => {
        render(<CreateTaskModal isOpen={true} onClose={vi.fn()} />);
        expect(screen.getByText('tasks.createTask')).toBeInTheDocument();
        expect(screen.getByText('tasks.title')).toBeInTheDocument();
    });

    it('populates form for editing', () => {
        const task = {
            id: '1',
            title: 'Edit Me',
            description: 'Desc',
            status: 'PENDING',
            priority: 'MEDIUM',
            tags: ['t1'],
            userId: 'u1',
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any;

        render(<CreateTaskModal isOpen={true} onClose={vi.fn()} taskToEdit={task} />);

        expect(screen.getByDisplayValue('Edit Me')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Desc')).toBeInTheDocument();
        expect(screen.getByDisplayValue('t1')).toBeInTheDocument();
    });

    it.skip('submits form', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        render(<CreateTaskModal isOpen={true} onClose={onClose} />);

        // Find inputs
        const titleInput = screen.getByLabelText('tasks.title');

        // Type title - Use waitFor to ensure element is interactable if needed, though getBy is usually synchronous
        await user.type(titleInput, 'New Task Value');

        // Submit
        const submitBtn = screen.getByRole('button', { name: 'common.create' });
        await user.click(submitBtn);

        await waitFor(() => {
            expect(mockMutate).toHaveBeenCalled();
        }, { timeout: 3000 });

        expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({
            title: 'New Task Value'
        }));
    });
});
