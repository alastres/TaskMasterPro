import React, { useState } from 'react';
import { X, Mail, Trash2, Clock, Loader2, UserPlus, Shield, Users, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useToast } from './ui/Toast';
import { AlertDialog } from './ui/AlertDialog';
import { removeMemberFromProject, cancelInvitation, inviteMember, getMyTeam } from '../api/teams';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';

interface ProjectMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
    isOwner: boolean;
}

const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({ isOpen, onClose, project, isOwner }) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [inviteEmail, setInviteEmail] = useState('');

    // Alert Dialog State
    const [confirmDeleteMember, setConfirmDeleteMember] = useState<{ isOpen: boolean; userId: string; name: string }>({
        isOpen: false,
        userId: '',
        name: ''
    });
    const [confirmCancelInvite, setConfirmCancelInvite] = useState<{ isOpen: boolean; inviteId: string; email: string }>({
        isOpen: false,
        inviteId: '',
        email: ''
    });

    const mapError = (message: string) => {
        if (message.includes('No tienes permiso')) return t('errors.noPermission');
        if (message.includes('no está registrado')) return t('errors.userNotRegistered');
        if (message.includes('ya es miembro')) return t('errors.alreadyMember');
        if (message.includes('no encontrado')) return t('errors.projectNotFound');
        return message || t('common.error');
    };

    const inviteMutation = useMutation({
        mutationFn: async (email: string) => {
            const team = await getMyTeam();
            return inviteMember(team.id, email, project.id);
        },
        onSuccess: () => {
            setInviteEmail('');
            queryClient.invalidateQueries({ queryKey: ['project', project.id] });
            toast({
                title: t('teams.inviteSuccess'),
                type: 'success'
            });
        },
        onError: (error: any) => {
            toast({
                title: t('common.error'),
                description: mapError(error.response?.data?.message),
                type: 'error'
            });
        }
    });

    const removeMemberMutation = useMutation({
        mutationFn: (userId: string) => removeMemberFromProject(project.id, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', project.id] });
            toast({
                title: t('common.success'),
                description: t('teams.removeMemberSuccess'),
                type: 'success'
            });
            setConfirmDeleteMember(prev => ({ ...prev, isOpen: false }));
        },
        onError: (error: any) => {
            toast({
                title: t('common.error'),
                description: error.response?.data?.message,
                type: 'error'
            });
            setConfirmDeleteMember(prev => ({ ...prev, isOpen: false }));
        }
    });

    const cancelInviteMutation = useMutation({
        mutationFn: (inviteId: string) => cancelInvitation(inviteId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', project.id] });
            toast({
                title: t('common.success'),
                description: t('teams.cancelInviteSuccess'),
                type: 'success'
            });
            setConfirmCancelInvite(prev => ({ ...prev, isOpen: false }));
        },
        onError: (error: any) => {
            toast({
                title: t('common.error'),
                description: error.response?.data?.message,
                type: 'error'
            });
            setConfirmCancelInvite(prev => ({ ...prev, isOpen: false }));
        }
    });

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (inviteEmail) inviteMutation.mutate(inviteEmail);
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AnimatePresence>
                {isOpen && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 grid place-items-center overflow-y-auto p-4"
                            >
                                <Dialog.Content asChild>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full max-w-2xl relative z-50 pointer-events-auto"
                                    >
                                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                                                        <Users size={20} />
                                                    </div>
                                                    <div>
                                                        <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                                                            {t('teams.manageMembers')}
                                                        </Dialog.Title>
                                                        <p className="text-xs text-gray-500">{project.name}</p>
                                                    </div>
                                                </div>
                                                <Dialog.Close asChild>
                                                    <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                                        <X size={20} className="text-gray-500" />
                                                    </button>
                                                </Dialog.Close>
                                            </div>

                                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                                {/* Invite Form */}
                                                {isOwner && (
                                                    <section className="space-y-4">
                                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                            <UserPlus size={16} className="text-indigo-500" />
                                                            {t('teams.inviteToProject')}
                                                        </h3>
                                                        <form onSubmit={handleInvite} className="flex gap-2">
                                                            <div className="relative flex-1">
                                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                                <input
                                                                    type="email"
                                                                    value={inviteEmail}
                                                                    onChange={(e) => setInviteEmail(e.target.value)}
                                                                    placeholder={t('teams.emailPlaceholder')}
                                                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                                                                    required
                                                                />
                                                            </div>
                                                            <button
                                                                type="submit"
                                                                disabled={inviteMutation.isPending}
                                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2"
                                                            >
                                                                {inviteMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                                                {t('teams.invite')}
                                                            </button>
                                                        </form>
                                                    </section>
                                                )}

                                                {/* Active Members */}
                                                <section className="space-y-4">
                                                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex justify-between">
                                                        {t('teams.members')}
                                                        <span>{project.members.length}</span>
                                                    </h3>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {project.members.map((member: any) => (
                                                            <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-700 group">
                                                                <div className="flex items-center gap-3">
                                                                    {member.user.avatarUrl ? (
                                                                        <img src={member.user.avatarUrl} className="h-10 w-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm" alt="" />
                                                                    ) : (
                                                                        <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                                                            {member.user.name.substring(0, 2).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{member.user.name}</p>
                                                                        <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
                                                                    </div>
                                                                </div>
                                                                {isOwner && member.userId !== project.userId && (
                                                                    <button
                                                                        onClick={() => setConfirmDeleteMember({ isOpen: true, userId: member.userId, name: member.user.name })}
                                                                        className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                                        disabled={removeMemberMutation.isPending}
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                )}
                                                                {member.userId === project.userId && (
                                                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold rounded-lg uppercase tracking-tighter flex items-center gap-1">
                                                                        <Shield size={10} />
                                                                        {t('teams.roleOwner')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>

                                                {/* Pending Invitations */}
                                                {project.invitations && project.invitations.length > 0 && (
                                                    <section className="space-y-4">
                                                        <h3 className="text-sm font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-wider flex items-center gap-2">
                                                            <Clock size={16} />
                                                            {t('teams.pendingInvitations')}
                                                        </h3>
                                                        <div className="grid grid-cols-1 gap-3">
                                                            {project.invitations.map((invite: any) => (
                                                                <div key={invite.id} className="flex items-center justify-between p-3 bg-yellow-50/50 dark:bg-yellow-900/5 rounded-2xl border border-yellow-100/50 dark:border-yellow-900/20 group">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 border-2 border-white dark:border-gray-800 shadow-sm">
                                                                            <Mail size={18} />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">{invite.email}</p>
                                                                            <p className="text-[10px] text-gray-400">
                                                                                {t('teams.sentOn', { date: new Date(invite.createdAt).toLocaleDateString() })}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    {isOwner && (
                                                                        <button
                                                                            onClick={() => setConfirmCancelInvite({ isOpen: true, inviteId: invite.id, email: invite.email })}
                                                                            className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                                        >
                                                                            <X size={18} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </section>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                </Dialog.Content>
                            </motion.div>
                        </Dialog.Overlay>
                    </Dialog.Portal>
                )}
            </AnimatePresence>

            {/* Confirm Actions */}
            <AlertDialog
                isOpen={confirmDeleteMember.isOpen}
                onOpenChange={(isOpen) => setConfirmDeleteMember(prev => ({ ...prev, isOpen }))}
                title={t('teams.removeMemberConfirm', { name: confirmDeleteMember.name })}
                description={t('teams.removeMemberDescription')}
                onConfirm={() => removeMemberMutation.mutate(confirmDeleteMember.userId)}
                variant="danger"
                isLoading={removeMemberMutation.isPending}
            />

            <AlertDialog
                isOpen={confirmCancelInvite.isOpen}
                onOpenChange={(isOpen) => setConfirmCancelInvite(prev => ({ ...prev, isOpen }))}
                title={t('teams.cancelInviteConfirm', { email: confirmCancelInvite.email })}
                description={t('teams.cancelInviteDescription')}
                onConfirm={() => cancelInviteMutation.mutate(confirmCancelInvite.inviteId)}
                variant="danger"
                isLoading={cancelInviteMutation.isPending}
            />
        </Dialog.Root>
    );
};

export default ProjectMembersModal;
