import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/auth.store';
import api from '../api/axios';
import { User, Lock, Save, Loader2, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = () => {
    const { t } = useTranslation();
    const { user, setAuth, token } = useAuthStore();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(user?.avatarUrl || null);

    const profileSchema = z.object({
        name: z.string().min(2, t('validation.required')),
        nickname: z.string().min(1, t('validation.required')).max(20, 'Nickname maximum 20 characters'),
    });

    const passwordSchema = z.object({
        currentPassword: z.string().min(1, t('validation.required')),
        newPassword: z.string().min(6, t('validation.passwordMin')),
        confirmPassword: z.string().min(6, t('validation.passwordMin')),
    }).refine((data) => data.newPassword === data.confirmPassword, {
        message: t('validation.passwordsDontMatch'),
        path: ["confirmPassword"],
    });

    type ProfileForm = z.infer<typeof profileSchema>;
    type PasswordForm = z.infer<typeof passwordSchema>;

    useEffect(() => {
        if (!selectedFile && user?.avatarUrl) {
            setPreviewUrl(user.avatarUrl);
        }
    }, [user?.avatarUrl, selectedFile]);

    const { register: registerProfile, handleSubmit: handleSubmitProfile, formState: { errors: profileErrors } } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || '',
            nickname: user?.nickname || '',
        },
    });

    const { register: registerPassword, handleSubmit: handleSubmitPassword, reset: resetPassword, formState: { errors: passwordErrors } } = useForm<PasswordForm>({
        resolver: zodResolver(passwordSchema),
    });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const updateProfileMutation = useMutation({
        mutationFn: async (data: ProfileForm) => {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('nickname', data.nickname);
            if (selectedFile) {
                formData.append('avatar', selectedFile);
            }

            const res = await api.put('/users/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return res.data.data.user;
        },
        onSuccess: (updatedUser) => {
            if (token) {
                setAuth(updatedUser, token);
            }
            alert(t('profile.profileUpdated'));
            setSelectedFile(null);
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
            alert(t('profile.passwordUpdated'));
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Failed to change password');
        },
    });

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('profile.profile')}</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {t('profile.profileInformation')}
                    </p>
                </div>

                {/* Profile Information */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white">{t('profile.profileInformation')}</h2>
                        </div>
                    </div>
                    <form onSubmit={handleSubmitProfile((data) => updateProfileMutation.mutate(data))} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="sm:col-span-2 flex flex-col items-center justify-center space-y-4">
                                <div className="relative h-24 w-24">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Avatar Preview" className="h-24 w-24 rounded-full object-cover border-4 border-indigo-100 dark:border-indigo-900" />
                                    ) : (
                                        <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            <User className="h-12 w-12 text-gray-400" />
                                        </div>
                                    )}
                                    <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-indigo-600 p-1.5 rounded-full text-white hover:bg-indigo-700 cursor-pointer shadow-sm transition-colors">
                                        <Camera className="h-4 w-4" />
                                        <input
                                            id="avatar-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.uploadImage')}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('auth.name')}
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
                                    {t('profile.nickname')}
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
                                {t('profile.updateProfile')}
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
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white">{t('profile.changePassword')}</h2>
                        </div>
                    </div>
                    <form onSubmit={handleSubmitPassword((data) => changePasswordMutation.mutate(data))} className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('profile.currentPassword')}
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
                                    {t('profile.newPassword')}
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
                                    {t('auth.confirmPassword')}
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
                                {t('profile.updatePassword')}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default Profile;
