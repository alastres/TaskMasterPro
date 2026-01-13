import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import api from '../api/axios';
import { User, Lock, Save, Loader2, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    nickname: z.string().min(1, 'Nickname is required').max(20, 'Nickname maximum 20 characters'),
    avatarUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const Profile = () => {
    const { user, setAuth, token } = useAuthStore();
    const queryClient = useQueryClient();

    const { register: registerProfile, handleSubmit: handleSubmitProfile, formState: { errors: profileErrors } } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || '',
            nickname: user?.nickname || '',
            avatarUrl: user?.avatarUrl || '',
        },
    });

    const { register: registerPassword, handleSubmit: handleSubmitPassword, reset: resetPassword, formState: { errors: passwordErrors } } = useForm<PasswordForm>({
        resolver: zodResolver(passwordSchema),
    });

    const updateProfileMutation = useMutation({
        mutationFn: async (data: ProfileForm) => {
            const res = await api.put('/users/profile', data);
            return res.data.data.user;
        },
        onSuccess: (updatedUser) => {
            if (token) {
                setAuth(updatedUser, token);
            }
            alert('Profile updated successfully');
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Failed to update profile');
        },
    });

    const changePasswordMutation = useMutation({
        mutationFn: async (data: PasswordForm) => {
            await api.put('/users/password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
        },
        onSuccess: () => {
            resetPassword();
            alert('Password changed successfully');
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Failed to change password');
        },
    });

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage your account settings and preferences.
                    </p>
                </div>

                {/* Profile Information */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Personal Information</h2>
                        </div>
                    </div>
                    <form onSubmit={handleSubmitProfile(updateProfileMutation.mutate)} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 transition-colors"
                                    {...registerProfile('name')}
                                />
                                {profileErrors.name && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{profileErrors.name.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nickname
                                </label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 transition-colors"
                                    {...registerProfile('nickname')}
                                />
                                {profileErrors.nickname && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{profileErrors.nickname.message}</p>
                                )}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Avatar URL
                                </label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 sm:text-sm">
                                        <Camera className="h-4 w-4" />
                                    </span>
                                    <input
                                        type="text"
                                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                                        placeholder="https://example.com/avatar.jpg"
                                        {...registerProfile('avatarUrl')}
                                    />
                                </div>
                                {profileErrors.avatarUrl && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{profileErrors.avatarUrl.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={updateProfileMutation.isPending}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                            >
                                {updateProfileMutation.isPending ? (
                                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>

                {/* Password Change */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Change Password</h2>
                        </div>
                    </div>
                    <form onSubmit={handleSubmitPassword(changePasswordMutation.mutate)} className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 transition-colors"
                                    {...registerPassword('currentPassword')}
                                />
                                {passwordErrors.currentPassword && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordErrors.currentPassword.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 transition-colors"
                                    {...registerPassword('newPassword')}
                                />
                                {passwordErrors.newPassword && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordErrors.newPassword.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 transition-colors"
                                    {...registerPassword('confirmPassword')}
                                />
                                {passwordErrors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordErrors.confirmPassword.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={changePasswordMutation.isPending}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                            >
                                {changePasswordMutation.isPending ? (
                                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                Update Password
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default Profile;
