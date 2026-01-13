import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyTeam, inviteMember, getMemberships } from '../api/teams';
import { Users, Mail, UserPlus, Loader2, Shield, User, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TeamManagement: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [email, setEmail] = useState('');
    const [inviteError, setInviteError] = useState<string | null>(null);

    const { data: team, isLoading: isLoadingTeam } = useQuery({
        queryKey: ['my-team'],
        queryFn: getMyTeam
    });

    const { data: memberships = [], isLoading: isLoadingMemberships } = useQuery({
        queryKey: ['memberships'],
        queryFn: getMemberships
    });

    const inviteMutation = useMutation({
        mutationFn: (email: string) => inviteMember(team!.id, email),
        onSuccess: () => {
            setEmail('');
            setInviteError(null);
            queryClient.invalidateQueries({ queryKey: ['my-team'] });
            alert(t('teams.inviteSuccess'));
        },
        onError: (error: any) => {
            setInviteError(error.response?.data?.message || t('common.error'));
        }
    });

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        inviteMutation.mutate(email);
    };

    if (isLoadingTeam || isLoadingMemberships) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                    <Users className="h-8 w-8 text-indigo-600" />
                    {t('teams.title')}
                </h1>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                    Administra tus colaboradores y equipos de trabajo.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Shield className="h-5 w-5 text-indigo-500" />
                                {t('teams.myTeam')}
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                                {t('teams.roleOwner')}
                            </span>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleInvite} className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('teams.inviteMember')}
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder={t('teams.emailPlaceholder')}
                                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={inviteMutation.isPending}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                                    >
                                        {inviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                                        {t('teams.invite')}
                                    </button>
                                </div>
                                {inviteError && <p className="mt-2 text-xs text-red-500">{inviteError}</p>}
                            </form>

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {t('teams.members')} ({team?.members.length || 0})
                                </h3>
                                {team?.members.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                        <User className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('teams.noMembers')}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {team?.members.map((member) => (
                                            <div key={member.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-700">
                                                {member.user.avatarUrl ? (
                                                    <img src={member.user.avatarUrl} className="h-10 w-10 rounded-full object-cover" alt="" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                                        {(member.user.nickname || member.user.name || '?').substring(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="ml-3 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{member.user.nickname || member.user.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.user.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>

                <div className="space-y-6">
                    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Users className="h-5 w-5 text-indigo-500" />
                                {t('teams.memberships')}
                            </h2>
                        </div>
                        <div className="p-6">
                            {memberships.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                    No eres miembro de ningún otro equipo aún.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {memberships.map((membership) => (
                                        <div key={membership.id} className="p-4 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{membership.team.name}</p>
                                            <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                <User className="h-3 w-3 mr-1" />
                                                Owner: {membership.team.owner.name}
                                            </div>
                                            <div className="flex items-center mt-1 text-[10px] text-gray-400">
                                                <Clock className="h-2.5 w-2.5 mr-1" />
                                                Joined: {new Date(membership.joinedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TeamManagement;
