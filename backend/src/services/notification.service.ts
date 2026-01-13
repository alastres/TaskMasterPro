import prisma from '../config/db';
import { NotificationType } from '@prisma/client';

export const getNotifications = async (userId: string) => {
    return await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
};

export const markAsRead = async (notificationId: string, userId: string) => {
    return await prisma.notification.update({
        where: { id: notificationId, userId },
        data: { isRead: true },
    });
};

export const markAllAsRead = async (userId: string) => {
    return await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
    });
};

export const createNotification = async (data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string | null;
    data?: any;
}) => {
    return await prisma.notification.create({
        data,
    });
};

export const deleteNotification = async (notificationId: string, userId: string) => {
    return await prisma.notification.delete({
        where: { id: notificationId, userId },
    });
};
