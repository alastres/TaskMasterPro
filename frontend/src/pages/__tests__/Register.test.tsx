import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Register from '../Register';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

// Mock dependencies
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../components/ui/Toast', () => ({
    useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('../../components/ThemeToggle', () => ({ default: () => <div /> }));
vi.mock('../../components/LanguageToggle', () => ({ default: () => <div /> }));

vi.mock('../../store/auth.store', () => ({
    useAuthStore: vi.fn(),
}));

const mockMutate = vi.fn();
vi.mock('@tanstack/react-query', () => ({
    useMutation: (options: any) => ({
        mutate: (data: any) => {
            mockMutate(data);
            if (data.email === 'success@test.com') {
                options.onSuccess({ data: { user: { id: '1' } }, token: 'token' });
            }
        },
        isPending: false,
    }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('Register Page', () => {
    const setAuthMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
            return selector({ setAuth: setAuthMock });
        });
    });

    it('renders register form', () => {
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        expect(screen.getByLabelText('auth.name')).toBeInTheDocument();
        expect(screen.getByLabelText('auth.email')).toBeInTheDocument();
        expect(screen.getByLabelText('auth.password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'auth.signUp' })).toBeInTheDocument();
    });

    it('submits form with valid data', async () => {
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByLabelText('auth.name'), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByLabelText('auth.email'), { target: { value: 'success@test.com' } });
        fireEvent.change(screen.getByLabelText('auth.password'), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: 'auth.signUp' }));

        await waitFor(() => {
            expect(mockMutate).toHaveBeenCalled();
            expect(setAuthMock).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });
});
