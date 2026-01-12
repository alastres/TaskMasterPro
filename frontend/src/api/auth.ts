import api from './axios';

// Redefining types to avoid build issues if backend is not in valid TS include path of frontend.

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
