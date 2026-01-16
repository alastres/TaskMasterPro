import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Header from '../Header';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { useTranslation } from 'react-i18next';

vi.mock('../../store/auth.store', () => ({
    useAuthStore: vi.fn(),
}));

// We need to properly mock the default export for useAuthStore if it's used as a hook directly
// However, the component imports { useAuthStore } from ...
// Let's refine the mock

vi.mock('react-i18next', () => ({
    useTranslation: vi.fn(),
}));

vi.mock('../ThemeToggle', () => ({ default: () => <div data-testid="theme-toggle" /> }));
vi.mock('../LanguageToggle', () => ({ default: () => <div data-testid="language-toggle" /> }));
vi.mock('../NotificationCenter', () => ({ default: () => <div data-testid="notification-center" /> }));

describe('Header', () => {
    const mockLogout = vi.fn();

    beforeEach(() => {
        (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            user: { name: 'Test User', nickname: 'Tester', avatarUrl: null },
            logout: mockLogout,
        });
        (useTranslation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            t: (key: string) => key,
        });
    });

    it('renders header components', () => {
        render(
            <BrowserRouter>
                <Header toggleSidebar={vi.fn()} />
            </BrowserRouter>
        );

        expect(screen.getByText('TaskMaster Pro')).toBeInTheDocument();
        expect(screen.getAllByTestId('theme-toggle')).toHaveLength(2);
        expect(screen.getByTestId('language-toggle')).toBeInTheDocument();
        expect(screen.getByTestId('notification-center')).toBeInTheDocument();
        expect(screen.getByText('Tester')).toBeInTheDocument();
    });

    it('calls logout when logout button is clicked', () => {
        render(
            <BrowserRouter>
                <Header toggleSidebar={vi.fn()} />
            </BrowserRouter>
        );

        const logoutButton = screen.getByTitle('nav.logout');
        fireEvent.click(logoutButton);

        expect(mockLogout).toHaveBeenCalled();
    });
});
