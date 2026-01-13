import api from './axios';

export type NotificationType = 'INVITATION' | 'TEAM_JOINED' | 'TEAM_LEFT' | 'PROJECT_SHARED';

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    link?: string;
    data?: any;
    createdAt: string;
}

export const getNotifications = async (): Promise<Notification[]> => {
    const response = await api.get('/notifications');
    return response.data.data;
};

export const markAsRead = async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data.data;
};

export const respondToInvitation = async (invitationId: string, accept: boolean) => {
    const response = await api.post('/notifications/respond-invite', { invitationId, accept });
    return response.data;
};

export const deleteNotification = async (id: string) => {
    await api.delete(`/notifications/${id}`);
};
