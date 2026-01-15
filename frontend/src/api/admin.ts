import api from './axios';

export const getCronConfig = async () => {
    const response = await api.get('/admin/cron-config');
    return response.data.data;
};

export const updateCronConfig = async (config: { schedule: string; enabled: boolean }) => {
    const response = await api.put('/admin/cron-config', config);
    return response.data.data;
};

export const triggerCronJob = async () => {
    const response = await api.post('/admin/cron-trigger');
    return response.data;
};

// User Management
export const getAllUsers = async () => {
    const response = await api.get('/admin/users');
    return response.data.data;
};

export const updateUserRole = async (userId: string, role: 'USER' | 'ADMIN') => {
    const response = await api.patch(`/admin/users/${userId}/role`, { role });
    return response.data.data;
};

export const deleteUser = async (userId: string) => {
    await api.delete(`/admin/users/${userId}`);
};
