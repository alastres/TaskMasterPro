import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ThemeToggle from '../ThemeToggle';
// We need to mock the module, so we assume the mock will supply the implementation
import { useThemeStore } from '../../store/theme.store';

vi.mock('../../store/theme.store', () => ({
    useThemeStore: vi.fn(),
}));

describe('ThemeToggle', () => {
    it('renders all theme options', () => {
        (useThemeStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            theme: 'light',
            setTheme: vi.fn(),
        });

        render(<ThemeToggle />);

        expect(screen.getByLabelText('Switch to light theme')).toBeInTheDocument();
        expect(screen.getByLabelText('Switch to dark theme')).toBeInTheDocument();
        expect(screen.getByLabelText('Switch to system theme')).toBeInTheDocument();
    });

    it('calls setTheme when a button is clicked', () => {
        const setThemeMock = vi.fn();
        (useThemeStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            theme: 'light',
            setTheme: setThemeMock,
        });

        render(<ThemeToggle />);

        const darkButton = screen.getByLabelText('Switch to dark theme');
        fireEvent.click(darkButton);

        expect(setThemeMock).toHaveBeenCalledWith('dark');
    });
});
