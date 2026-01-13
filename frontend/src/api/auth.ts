import api from './axios';

// Redefiniendo tipos para evitar problemas de compilación si el backend no está en la ruta de inclusión TS válida del frontend.

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    status: string;
    token: string;
    data: {
        user: {
            id: string;
            name: string;
            email: string;
            nickname: string;
            avatarUrl?: string;
            thresholdMedium: number;
            thresholdHigh: number;
        }
    }
}

export const login = async (data: LoginPayload) => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
};

export const register = async (data: RegisterPayload) => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
};
