import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyTeam, removeMemberFromProject, cancelInvitation } from '../api/teams';
import { Users, Loader2, Shield, Clock, Trash2, LayoutGrid, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/ui/Toast';
import { AlertDialog } from '../components/ui/AlertDialog';

const TeamManagement: React.FC = () => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Alert Dialog State
    const [confirmDeleteMember, setConfirmDeleteMember] = useState<{ isOpen: boolean; projectId: string; userId: string; name: string }>({
        isOpen: false,
        projectId: '',
        userId: '',
        name: ''
    });
    const [confirmCancelInvite, setConfirmCancelInvite] = useState<{ isOpen: boolean; inviteId: string; email: string }>({
        isOpen: false,
        inviteId: '',
        email: ''
    });

    const { data: team, isLoading: isLoadingTeam } = useQuery({
        queryKey: ['my-team'],
        queryFn: getMyTeam
    });

    const mapError = (message: string) => {
        if (message.includes('No tienes permiso')) return t('errors.noPermission');
        if (message.includes('no está registrado')) return t('errors.userNotRegistered');
        if (message.includes('ya es miembro')) return t('errors.alreadyMember');
        if (message.includes('no encontrado')) return t('errors.projectNotFound');
        return message || t('common.error');
    };

    const handleRemoveMember = async (projectId: string, userId: string) => {
        try {
            await removeMemberFromProject(projectId, userId);
            queryClient.invalidateQueries({ queryKey: ['my-team'] });
            toast({
                title: t('common.success'),
                type: 'success'
            });
        } catch (error: any) {
            toast({
                title: t('common.error'),
                description: mapError(error.response?.data?.message),
                type: 'error'
            });
        }
    };

    const handleCancelInvite = async (inviteId: string) => {
        try {
            await cancelInvitation(inviteId);
            queryClient.invalidateQueries({ queryKey: ['my-team'] });
            toast({
                title: t('common.success'),
                type: 'success'
            });
        } catch (error: any) {
            toast({
                title: t('common.error'),
                description: mapError(error.response?.data?.message),
                type: 'error'
            });
        }
    };



    if (isLoadingTeam) { // isLoadingMemberships was removed, so this condition needs to be updated.
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
                    {t('teams.subtitle')}
                </p>
            </div>

            <div className="space-y-6">
                {team?.projects.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-dashed border-gray-200 dark:border-gray-700">
                        <LayoutGrid className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('teams.noProjects')}</h3>
                        <p className="text-gray-500 dark:text-gray-400">{t('teams.createProjectPrompt')}</p>
                    </div>
                ) : (
                    team?.projects.map((project: any) => (
                        <div key={project.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                        <LayoutGrid size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{project.name}</h2>
                                        <p className="text-xs text-gray-500">{project.members.length} {t('teams.members')} • {project.invitations.length} {t('teams.pending')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Members */}
                                    {project.members.map((member: any) => (
                                        <div key={member.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-700 group">
                                            {member.user.avatarUrl ? (
                                                <img src={member.user.avatarUrl} className="h-9 w-9 rounded-full object-cover" alt="" />
                                            ) : (
                                                <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                    {(member.user.nickname || member.user.name || '?').substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="ml-3 min-w-0 flex-1">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{member.user.nickname || member.user.name}</p>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{member.user.email}</p>
                                            </div>
                                            <button
                                                onClick={() => setConfirmDeleteMember({ isOpen: true, projectId: project.id, userId: member.user.id, name: member.user.name })}
                                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                title={t('teams.removeMemberTooltip')}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Pending Invitations */}
                                    {project.invitations.map((invite: any) => (
                                        <div key={invite.id} className="flex items-center p-3 bg-yellow-50/30 dark:bg-yellow-900/10 rounded-xl border border-yellow-100/50 dark:border-yellow-900/20 group animate-pulse-subtle">
                                            <div className="h-9 w-9 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                                                <Clock size={16} />
                                            </div>
                                            <div className="ml-3 min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{invite.email}</p>
                                                <p className="text-[10px] text-yellow-600 dark:text-yellow-500 uppercase font-bold tracking-tighter">{t('teams.pending')}</p>
                                            </div>
                                            <button
                                                onClick={() => setConfirmCancelInvite({ isOpen: true, inviteId: invite.id, email: invite.email })}
                                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                title={t('teams.cancelInviteTooltip')}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Owner/Team Info (Secondary) */}
            <div className="pt-8 border-t border-gray-100 dark:border-gray-700">
                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <Shield className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{t('teams.myTeam')}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('teams.ownerInfo')}</p>
                        </div>
                    </div>
                    <div className="flex -space-x-2">
                        {/* Optional stack of all unique members across projects could go here */}
                    </div>
                </div>
            </div>
            {/* AlertDialogs */}
            <AlertDialog
                isOpen={confirmDeleteMember.isOpen}
                onOpenChange={(isOpen) => setConfirmDeleteMember(prev => ({ ...prev, isOpen }))}
                title={t('teams.removeMemberConfirm', { name: confirmDeleteMember.name })}
                description={t('teams.removeMemberDescription')}
                onConfirm={() => handleRemoveMember(confirmDeleteMember.projectId, confirmDeleteMember.userId)}
                variant="danger"
            />

            <AlertDialog
                isOpen={confirmCancelInvite.isOpen}
                onOpenChange={(isOpen) => setConfirmCancelInvite(prev => ({ ...prev, isOpen }))}
                title={t('teams.cancelInviteConfirm', { email: confirmCancelInvite.email })}
                description={t('teams.cancelInviteDescription')}
                onConfirm={() => handleCancelInvite(confirmCancelInvite.inviteId)}
                variant="danger"
            />
        </div>
    );
};

export default TeamManagement;
