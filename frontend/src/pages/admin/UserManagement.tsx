import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllUsers, updateUserRole, deleteUser } from '../../api/admin';
import { Users, Trash2, Shield, User as UserIcon, Loader2, Search } from 'lucide-react';
import { AlertDialog } from '../../components/ui/AlertDialog';
import { useAuthStore } from '../../store/auth.store';
import { useToast } from '../../components/ui/Toast';
import { useTranslation } from 'react-i18next';

interface User {
    id: string;
    name: string;
    email: string;
    nickname: string;
    role: string;
    avatarUrl?: string;
    createdAt: string;
}

const UserManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const currentUser = useAuthStore((state) => state.user);
    const { toast } = useToast();
    const { t } = useTranslation();
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const { data: users, isLoading } = useQuery<User[]>({
        queryKey: ['admin-users'],
        queryFn: getAllUsers
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: 'USER' | 'ADMIN' }) =>
            updateUserRole(userId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast({
                title: t('admin.roleUpdated'),
                description: t('admin.roleUpdatedDesc'),
                type: 'success'
            });
        },
        onError: (error: any) => {
            toast({
                title: t('common.error'),
                description: error.response?.data?.message || t('admin.roleUpdateError'),
                type: 'error'
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            setDeleteConfirm(null);
            toast({
                title: t('admin.userDeleted'),
                description: t('admin.userDeletedDesc'),
                type: 'success'
            });
        },
        onError: (error: any) => {
            toast({
                title: t('common.error'),
                description: error.response?.data?.message || t('admin.userDeleteError'),
                type: 'error'
            });
        }
    });

    const handleToggleRole = (user: User) => {
        const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
        updateRoleMutation.mutate({ userId: user.id, role: newRole });
    };

    const handleDelete = (userId: string) => {
        deleteMutation.mutate(userId);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    // Filter users based on search term
    const filteredUsers = users?.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.nickname.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('admin.userManagement')}
                    </h2>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t('admin.userCount', { count: filteredUsers.length })}
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder={t('admin.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {t('admin.user')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {t('admin.email')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {t('admin.role')}
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {t('admin.actions')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {user.avatarUrl ? (
                                            <img
                                                src={user.avatarUrl}
                                                alt={user.name}
                                                className="h-8 w-8 rounded-full"
                                            />
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                                <span className="text-indigo-600 dark:text-indigo-400 font-medium text-sm">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        <div className="ml-3">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {user.name}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                @{user.nickname}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => handleToggleRole(user)}
                                        disabled={user.id === currentUser?.id || updateRoleMutation.isPending}
                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${user.role === 'ADMIN'
                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                            } ${user.id === currentUser?.id
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'hover:opacity-80 cursor-pointer'
                                            }`}
                                    >
                                        {user.role === 'ADMIN' ? (
                                            <Shield className="h-3 w-3" />
                                        ) : (
                                            <UserIcon className="h-3 w-3" />
                                        )}
                                        {user.role}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {user.id !== currentUser?.id && (
                                        <button
                                            onClick={() => setDeleteConfirm(user.id)}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                            title={t('admin.deleteUser')}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Delete Confirmation Modal */}
                <AlertDialog
                    isOpen={!!deleteConfirm}
                    onOpenChange={(open) => !open && setDeleteConfirm(null)}
                    title={t('admin.confirmDeleteTitle')}
                    description={t('admin.confirmDeleteMessage')}
                    confirmText={t('admin.delete')}
                    variant="danger"
                    isLoading={deleteMutation.isPending}
                    onConfirm={() => {
                        if (deleteConfirm) {
                            handleDelete(deleteConfirm);
                        }
                    }}
                />

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        {searchTerm ? t('admin.noUsersFound') : t('admin.noUsers')}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {filteredUsers.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                        {t('admin.showing')} <span className="font-medium">{startIndex + 1}</span> {t('admin.to')}{' '}
                        <span className="font-medium">{Math.min(endIndex, filteredUsers.length)}</span> {t('admin.of')}{' '}
                        <span className="font-medium">{filteredUsers.length}</span> {t('admin.userCount', { count: filteredUsers.length })}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('admin.previous')}
                            </button>
                            <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                                {t('admin.page')} {currentPage} {t('admin.of')} {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('admin.next')}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserManagement;
