import prisma from '../config/db';
import { InvitationStatus, NotificationType } from '@prisma/client';
import { createNotification } from './notification.service';
import { v4 as uuidv4 } from 'uuid';

export const getOrCreateUserTeam = async (userId: string) => {
    let team = await prisma.team.findUnique({
        where: { ownerId: userId },
        include: { members: { include: { user: true } } }
    });

    if (!team) {
        team = await prisma.team.create({
            data: {
                name: `Equipo de ${userId.substring(0, 5)}`,
                ownerId: userId
            },
            include: { members: { include: { user: true } } }
        });
    }

    return team;
};

export const inviteMember = async (teamId: string, email: string, inviterId: string, projectId?: string) => {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new Error('Equipo no encontrado');
    if (team.ownerId !== inviterId) throw new Error('No tienes permiso para invitar a este equipo');

    const inviter = await prisma.user.findUnique({ where: { id: inviterId } });

    let projectName = '';
    if (projectId) {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (project) projectName = project.name;
    }

    // Check if user is already a member
    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (targetUser) {
        const isMember = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId: targetUser.id } }
        });
        if (isMember) throw new Error('El usuario ya es miembro de este equipo');
    }

    // Upsert invitation (update if exists for the same team/email)
    const token = uuidv4();
    const invitation = await prisma.invitation.upsert({
        where: { teamId_email: { teamId, email } },
        update: {
            status: InvitationStatus.PENDING,
            token,
            projectId: projectId || null,
            updatedAt: new Date()
        },
        create: {
            email,
            teamId,
            projectId,
            inviterId,
            token
        }
    });

    // If user exists in system, send notification
    if (targetUser) {
        const title = projectName ? `Invitación a proyecto: ${projectName}` : 'Invitación a equipo';
        const message = projectName
            ? `${inviter?.name} te ha invitado a colaborar en el proyecto "${projectName}".`
            : `${inviter?.name} te ha invitado a unirte a su equipo.`;

        await createNotification({
            userId: targetUser.id,
            type: NotificationType.INVITATION,
            title,
            message,
            link: '/notifications',
            data: { invitationId: invitation.id, teamId, projectId }
        });
    }

    return invitation;
};

export const respondToInvitation = async (invitationId: string, userId: string, accept: boolean) => {
    const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId },
        include: { team: true }
    });

    if (!invitation || invitation.status !== InvitationStatus.PENDING) {
        throw new Error('Invitación no válida o expirada');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        throw new Error('Correo electrónico no coincide con la invitación');
    }

    if (accept) {
        await prisma.$transaction(async (tx) => {
            // Join Team
            await tx.teamMember.upsert({
                where: { teamId_userId: { teamId: invitation.teamId, userId } },
                update: {},
                create: { teamId: invitation.teamId, userId }
            });

            // If it's a project invitation, join Project
            if (invitation.projectId) {
                await tx.projectMember.upsert({
                    where: { projectId_userId: { projectId: invitation.projectId, userId } },
                    update: {},
                    create: { projectId: invitation.projectId, userId }
                });
            }

            // Accept Invitation
            await tx.invitation.update({
                where: { id: invitationId },
                data: { status: InvitationStatus.ACCEPTED }
            });
        });

        // Notify owner
        await createNotification({
            userId: invitation.team.ownerId,
            type: NotificationType.TEAM_JOINED,
            title: 'Invitación aceptada',
            message: `${user.name} se ha unido a tu equipo.`,
            link: '/team'
        });
    } else {
        await prisma.invitation.update({
            where: { id: invitationId },
            data: { status: InvitationStatus.DECLINED }
        });
    }

    return { success: true };
};

export const getTeamMembers = async (teamId: string) => {
    return await prisma.teamMember.findMany({
        where: { teamId },
        include: { user: { select: { id: true, name: true, email: true, nickname: true, avatarUrl: true } } }
    });
};

export const getUserMemberships = async (userId: string) => {
    return await prisma.teamMember.findMany({
        where: { userId },
        include: { team: { include: { owner: true } } }
    });
};

export const removeMemberFromProject = async (projectId: string, userId: string, ownerId: string) => {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Proyecto no encontrado');
    if (project.userId !== ownerId) throw new Error('No tienes permiso para eliminar miembros de este proyecto');

    return await prisma.projectMember.delete({
        where: { projectId_userId: { projectId, userId } }
    });
};
