import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Projects from '../Projects';
import { BrowserRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../../components/ui/Toast', () => ({
    useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@tanstack/react-query', () => ({
    useQuery: () => ({
        data: [{
            id: '1',
            name: 'Project 1',
            isOwner: true,
            createdAt: new Date().toISOString(),
            _count: { tasks: 5 }
        }],
        isLoading: false,
        error: null
    }),
    useMutation: () => ({ mutate: vi.fn(), isPending: false }),
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

// Mock simple components to avoid deeper rendering issues
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual,
        motion: {
            div: ({ children, ...props }: any) => <div {...props}>{children}</div>
        },
        AnimatePresence: ({ children }: any) => <>{children}</>
    };
});

describe('Projects', () => {
    it('renders projects page', () => {
        render(
            <BrowserRouter>
                <Projects />
            </BrowserRouter>
        );
        expect(screen.getByText('nav.projects')).toBeInTheDocument();
        expect(screen.getByText('Project 1')).toBeInTheDocument();
    });
});
