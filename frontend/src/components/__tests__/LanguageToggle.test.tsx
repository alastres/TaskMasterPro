import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LanguageToggle from '../LanguageToggle';
import { useTranslation } from 'react-i18next';

vi.mock('react-i18next', () => ({
    useTranslation: vi.fn(),
}));

describe('LanguageToggle', () => {
    it('renders current language and toggles on click', () => {
        const changeLanguageMock = vi.fn();
        (useTranslation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            t: (key: string) => key,
            i18n: {
                language: 'en',
                changeLanguage: changeLanguageMock,
            },
        });

        render(<LanguageToggle />);

        expect(screen.getByText('en')).toBeInTheDocument();

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(changeLanguageMock).toHaveBeenCalledWith('es');
    });

    it('toggles from es to en', () => {
        const changeLanguageMock = vi.fn();
        (useTranslation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            t: (key: string) => key,
            i18n: {
                language: 'es',
                changeLanguage: changeLanguageMock,
            },
        });

        render(<LanguageToggle />);

        expect(screen.getByText('es')).toBeInTheDocument();

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(changeLanguageMock).toHaveBeenCalledWith('en');
    });
});
