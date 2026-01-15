import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Trash2, Loader2, Info, Users, LayoutGrid } from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead, respondToInvitation, deleteNotification, deleteAllNotifications } from '../api/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/ui/Toast';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const NotificationCenter: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: getNotifications,
        refetchInterval: 30000, // Poll every 30 seconds
    });

    const markReadMutation = useMutation({
        mutationFn: markAsRead,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const markAllReadMutation = useMutation({
        mutationFn: markAllAsRead,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const responseMutation = useMutation({
        mutationFn: ({ invitationId, accept, notificationId }: { invitationId: string; accept: boolean; notificationId: string }) =>
            respondToInvitation(invitationId, accept).then(() => notificationId),
        onSuccess: (notificationId, variables) => {
            // Mark as read immediately to hide buttons
            markReadMutation.mutate(notificationId);

            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            if (variables.accept) {
                toast({
                    title: t('common.success'),
                    description: t('teams.acceptSuccess'),
                    type: 'success'
                });
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteNotification,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const deleteAllMutation = useMutation({
        mutationFn: deleteAllNotifications,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'INVITATION': return <Users className="h-5 w-5 text-indigo-500" />;
            case 'TEAM_JOINED': return <Check className="h-5 w-5 text-green-500" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const fnLocale = i18n.language === 'es' ? es : enUS;

    const getNotificationContent = (notification: any) => {
        let title = notification.title;
        let message = notification.message;

        if (notification.type === 'INVITATION') {
            if (notification.data?.projectId && notification.data?.projectName && notification.data?.inviterName) {
                title = t('notifications.invitationProjectTitle');
                message = t('notifications.invitationProjectMessage', {
                    name: notification.data.inviterName,
                    project: notification.data.projectName
                });
            } else if (notification.data?.inviterName) {
                title = t('notifications.invitationTeamTitle');
                message = t('notifications.invitationTeamMessage', { name: notification.data.inviterName });
            }
        } else if (notification.type === 'TEAM_JOINED' && notification.data?.userName) {
            title = t('notifications.teamJoinedTitle');
            message = t('notifications.teamJoinedMessage', { name: notification.data.userName });
        }

        return { title, message };
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-800">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[500px] overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[999] flex flex-col"
                    >
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">{t('notifications.title')}</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllReadMutation.mutate()}
                                    disabled={markAllReadMutation.isPending}
                                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
                                >
                                    {markAllReadMutation.isPending ? t('common.loading') : t('notifications.markAllAsRead')}
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={() => deleteAllMutation.mutate()}
                                    disabled={deleteAllMutation.isPending}
                                    className="ml-3 text-[10px] text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:underline disabled:opacity-50 flex items-center gap-1"
                                >
                                    {deleteAllMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 size={10} />}
                                    {t('notifications.clearAll')}
                                </button>
                            )}
                        </div>

                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            {isLoading ? (
                                <div className="p-10 flex justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-10 text-center">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">{t('notifications.empty')}</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {notifications.map((notification) => {
                                        const { title, message } = getNotificationContent(notification);
                                        return (
                                            <div
                                                key={notification.id}
                                                className={clsx(
                                                    "p-4 transition-colors relative group",
                                                    !notification.isRead ? "bg-indigo-50/30 dark:bg-indigo-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-700/30"
                                                )}
                                            >
                                                <div className="flex gap-3">
                                                    <div className="flex-shrink-0 mt-1">
                                                        {getIcon(notification.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{message}</p>
                                                        {notification.data?.projectId && (
                                                            <div className="mt-1 flex items-center gap-1.5">
                                                                <LayoutGrid className="h-3 w-3 text-indigo-400" />
                                                                <span className="text-[10px] font-medium text-indigo-500 uppercase tracking-tight">{t('notifications.projectCollaboration')}</span>
                                                            </div>
                                                        )}
                                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
                                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: fnLocale })}
                                                        </p>

                                                        {notification.type === 'INVITATION' && !notification.isRead && notification.data?.invitationId && (
                                                            <div className="mt-3 flex gap-2">
                                                                <button
                                                                    onClick={() => responseMutation.mutate({
                                                                        invitationId: notification.data.invitationId,
                                                                        accept: true,
                                                                        notificationId: notification.id
                                                                    })}
                                                                    disabled={responseMutation.isPending}
                                                                    className="px-3 py-1 bg-indigo-600 text-white text-[11px] font-bold rounded hover:bg-indigo-700 flex items-center gap-1 transition-colors"
                                                                >
                                                                    {responseMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                                                    {t('notifications.accept')}
                                                                </button>
                                                                <button
                                                                    onClick={() => responseMutation.mutate({
                                                                        invitationId: notification.data.invitationId,
                                                                        accept: false,
                                                                        notificationId: notification.id
                                                                    })}
                                                                    disabled={responseMutation.isPending}
                                                                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[11px] font-bold rounded hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-1 transition-colors"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                    {t('notifications.reject')}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        {!notification.isRead && (
                                                            <button
                                                                onClick={() => markReadMutation.mutate(notification.id)}
                                                                className="p-1 text-gray-300 hover:text-indigo-600 transition-colors"
                                                                title={t('notifications.markAsRead')}
                                                            >
                                                                <div className="h-2 w-2 rounded-full bg-indigo-600" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => deleteMutation.mutate(notification.id)}
                                                            className="p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;
