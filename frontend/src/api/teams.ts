import api from './axios';
import { User } from '../store/auth.store';

export interface TeamMember {
    id: string;
    teamId: string;
    userId: string;
    joinedAt: string;
    user: User;
}

export interface Team {
    id: string;
    name: string;
    ownerId: string;
    members: TeamMember[];
    createdAt: string;
    updatedAt: string;
}

export interface Membership {
    id: string;
    teamId: string;
    userId: string;
    joinedAt: string;
    team: {
        id: string;
        name: string;
        owner: User;
    };
}

export const getMyTeam = async (): Promise<Team> => {
    const response = await api.get('/teams/my-team');
    return response.data.data;
};

export const inviteMember = async (teamId: string, email: string, projectId?: string) => {
    const response = await api.post('/teams/invite', { teamId, email, projectId });
    return response.data.data;
};

export const getMemberships = async (): Promise<Membership[]> => {
    const response = await api.get('/teams/memberships');
    return response.data.data;
};

export const removeMemberFromProject = async (projectId: string, userId: string): Promise<void> => {
    await api.delete(`/teams/project/${projectId}/member/${userId}`);
};
