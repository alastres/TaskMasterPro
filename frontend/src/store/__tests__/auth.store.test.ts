import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../auth.store';

describe('Auth Store', () => {
    beforeEach(() => {
        useAuthStore.setState({ user: null, token: null });
    });

    it('sets auth correctly', () => {
        const user = {
            id: '1',
            name: 'Test',
            email: 'test@example.com',
            role: 'USER',
            nickname: 'TestUser',
            thresholdMedium: 72,
            thresholdHigh: 24,
            autoPriorityEnabled: true
        };
        const token = 'fake-token';

        useAuthStore.getState().setAuth(user, token);

        expect(useAuthStore.getState().user).toEqual(user);
        expect(useAuthStore.getState().token).toEqual(token);
        expect(useAuthStore.getState().isAuthenticated()).toBe(true);
    });

    it('logs out correctly', () => {
        const user = {
            id: '1',
            name: 'Test',
            email: 'test@example.com',
            role: 'USER',
            nickname: 'TestUser',
            thresholdMedium: 72,
            thresholdHigh: 24,
            autoPriorityEnabled: true
        };
        const token = 'fake-token';

        useAuthStore.setState({ user, token });

        useAuthStore.getState().logout();

        expect(useAuthStore.getState().user).toBeNull();
        expect(useAuthStore.getState().token).toBeNull();
        expect(useAuthStore.getState().isAuthenticated()).toBe(false);
    });
});
