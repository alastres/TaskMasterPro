import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AlertDialog } from '../ui/AlertDialog';
import { removeMemberFromProject, cancelInvitation } from '../../api/teams';
import { useToast } from '../ui/Toast';
import { useQueryClient } from '@tanstack/react-query';

interface ProjectMembersTableProps {
    projects: any[];
}

const ProjectMembersTable: React.FC<ProjectMembersTableProps> = ({ projects }) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // Alert Dialog States
    const [confirmDeleteMember, setConfirmDeleteMember] = useState<{ isOpen: boolean; projectId: string; userId: string; name: string }>({
        isOpen: false, projectId: '', userId: '', name: ''
    });
    const [confirmCancelInvite, setConfirmCancelInvite] = useState<{ isOpen: boolean; inviteId: string; email: string }>({
        isOpen: false, inviteId: '', email: ''
    });

    // Filtering Logic
    const filteredProjects = projects.filter(project => {
        const query = searchQuery.toLowerCase();

        // Match project name
        if (project.name.toLowerCase().includes(query)) return true;

        // Match member name or email
        const hasMemberMatch = project.members.some((m: any) =>
            (m.user.name || '').toLowerCase().includes(query) ||
            (m.user.nickname || '').toLowerCase().includes(query) ||
            (m.user.email || '').toLowerCase().includes(query)
        );
        if (hasMemberMatch) return true;

        // Match invitation email
        const hasInviteMatch = project.invitations.some((i: any) =>
            i.email.toLowerCase().includes(query)
        );
        if (hasInviteMatch) return true;

        return false;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentProjects = filteredProjects.slice(startIndex, startIndex + itemsPerPage);

    const handleRemoveMember = async (projectId: string, userId: string) => {
        try {
            await removeMemberFromProject(projectId, userId);
            queryClient.invalidateQueries({ queryKey: ['my-team'] });
            toast({ title: t('common.success'), type: 'success' });
        } catch (error: any) {
            toast({ title: t('common.error'), description: error.response?.data?.message || t('common.error'), type: 'error' });
        }
    };

    const handleCancelInvite = async (inviteId: string) => {
        try {
            await cancelInvitation(inviteId);
            queryClient.invalidateQueries({ queryKey: ['my-team'] });
            toast({ title: t('common.success'), type: 'success' });
        } catch (error: any) {
            toast({ title: t('common.error'), description: error.response?.data?.message || t('common.error'), type: 'error' });
        }
    };

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                    type="text"
                    placeholder={t('projects.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1); // Reset to first page on search
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-all"
                />
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {t('projects.project')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {t('teams.members')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {t('teams.pendingInvitations')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {currentProjects.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <AlertCircle className="h-8 w-8 text-gray-300 mb-2" />
                                            <p>{t('common.noResults')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentProjects.map((project: any) => (
                                    <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link to={`/projects/${project.id}`} className="block group">
                                                <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {project.name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {t(project.members.length + project.invitations.length > 1 ? 'teams.usersCount_other' : 'teams.usersCount_one', { count: project.members.length + project.invitations.length })}
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {project.members.length === 0 && <span className="text-xs text-gray-400 italic">{t('teams.noMembers')}</span>}
                                                {project.members.map((member: any) => (
                                                    <div key={member.id} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 group">
                                                        <span className="truncate max-w-[100px]">{member.user.nickname || member.user.name}</span>
                                                        <button
                                                            onClick={() => setConfirmDeleteMember({ isOpen: true, projectId: project.id, userId: member.user.id, name: member.user.name })}
                                                            className="ml-1.5 text-indigo-400 hover:text-red-500 focus:outline-none opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {project.invitations.map((invite: any) => (
                                                    <div key={invite.id} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/30 group">
                                                        <span className="truncate max-w-[150px]">{invite.email}</span>
                                                        <button
                                                            onClick={() => setConfirmCancelInvite({ isOpen: true, inviteId: invite.id, email: invite.email })}
                                                            className="ml-1.5 text-yellow-400 hover:text-red-500 focus:outline-none opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {filteredProjects.length > 0 && (
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{t('common.rowsPerPage')}</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-1 appearance-none cursor-pointer"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mr-2">
                                {t('common.pageOf', { current: currentPage, total: totalPages })}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

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

export default ProjectMembersTable;
