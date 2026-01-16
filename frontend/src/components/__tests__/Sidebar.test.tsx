import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Sidebar from '../Sidebar';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { useTranslation } from 'react-i18next';

vi.mock('../../store/auth.store', () => ({
    useAuthStore: vi.fn(),
}));
vi.mock('react-i18next', () => ({
    useTranslation: vi.fn(),
}));

describe('Sidebar', () => {
    beforeEach(() => {
        (useTranslation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            t: (key: string) => key,
        });
    });

    it('renders navigation links', () => {
        (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
            const state = { user: { role: 'USER' } };
            return selector ? selector(state) : state;
        });

        render(
            <BrowserRouter>
                <Sidebar isOpen={true} isMobileOpen={false} setIsMobileOpen={vi.fn()} />
            </BrowserRouter>
        );

        expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
        expect(screen.getByText('nav.projects')).toBeInTheDocument();
        expect(screen.getByText('teams.title')).toBeInTheDocument();
        expect(screen.getByText('nav.profile')).toBeInTheDocument();
        expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });

    it('renders admin link for admin user', () => {
        (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
            const state = { user: { role: 'ADMIN' } };
            return selector ? selector(state) : state;
        });

        render(
            <BrowserRouter>
                <Sidebar isOpen={true} isMobileOpen={false} setIsMobileOpen={vi.fn()} />
            </BrowserRouter>
        );

        expect(screen.getByText('Admin')).toBeInTheDocument();
    });
});
