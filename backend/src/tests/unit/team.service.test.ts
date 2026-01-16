import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import prisma from '../../config/db';
import * as teamService from '../../services/team.service';
import * as notificationService from '../../services/notification.service';
import { AppError } from '../../utils/AppError';
import { InvitationStatus, NotificationType } from '@prisma/client';

// Mock DB
jest.mock('../../config/db', () => ({
    team: { findUnique: jest.fn(), create: jest.fn() },
    project: { updateMany: jest.fn(), findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    projectMember: { findUnique: jest.fn() },
    teamMember: { findUnique: jest.fn() },
    invitation: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn()
    },
    $transaction: jest.fn((callback: any) => callback({
        teamMember: { upsert: jest.fn() },
        projectMember: { upsert: jest.fn() },
        invitation: { update: jest.fn() }
    }))
}));

jest.mock('../../services/notification.service', () => ({
    createNotification: jest.fn()
}));

// Mock UUID
jest.mock('uuid', () => ({ v4: () => 'uuid-token' }));

describe('Team Service Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('inviteMember', () => {
        const teamId = 't1';
        const inviterId = 'u1';
        const email = 'target@test.com';

        it('should throw if team not found', async () => {
            (prisma.team.findUnique as jest.Mock).mockResolvedValue(null);
            await expect(teamService.inviteMember(teamId, email, inviterId)).rejects.toThrow('Equipo no encontrado');
        });

        it('should throw if inviter is not owner', async () => {
            (prisma.team.findUnique as jest.Mock).mockResolvedValue({ ownerId: 'other' });
            await expect(teamService.inviteMember(teamId, email, inviterId)).rejects.toThrow('No tienes permiso');
        });

        it('should throw if inviting self', async () => {
            (prisma.team.findUnique as jest.Mock).mockResolvedValue({ ownerId: inviterId });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: inviterId, email });

            await expect(teamService.inviteMember(teamId, email, inviterId)).rejects.toThrow('No puedes invitarte a ti mismo');
        });

        it('should throw if user is already a member', async () => {
            (prisma.team.findUnique as jest.Mock).mockResolvedValue({ ownerId: inviterId });
            (prisma.user.findUnique as jest.Mock)
                .mockResolvedValueOnce({ id: inviterId, email: 'inviter@test.com' }) // Inviter
                .mockResolvedValueOnce({ id: 'u2', email }); // Target

            (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue({ id: 'tm1' });

            await expect(teamService.inviteMember(teamId, email, inviterId)).rejects.toThrow('El usuario ya es miembro de este equipo');
        });

        it('should throw if user not registered in system', async () => {
            (prisma.team.findUnique as jest.Mock).mockResolvedValue({ ownerId: inviterId });
            (prisma.user.findUnique as jest.Mock)
                .mockResolvedValueOnce({ id: inviterId })
                .mockResolvedValueOnce(null); // Target not found

            await expect(teamService.inviteMember(teamId, email, inviterId)).rejects.toThrow('El usuario no está registrado en el sistema');
        });

        it('should create new invitation', async () => {
            (prisma.team.findUnique as jest.Mock).mockResolvedValue({ ownerId: inviterId });
            (prisma.user.findUnique as jest.Mock)
                .mockResolvedValueOnce({ id: inviterId, name: 'Inviter' }) // Inviter
                .mockResolvedValueOnce({ id: 'u2' }); // Target exists

            (prisma.invitation.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.invitation.create as jest.Mock).mockResolvedValue({ id: 'inv1' });
            (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue(null); // Not member

            await teamService.inviteMember(teamId, email, inviterId);

            expect(prisma.invitation.create).toHaveBeenCalled();
            expect(notificationService.createNotification).toHaveBeenCalled();
        });

        it('should resend invitation if expired/declined', async () => {
            (prisma.team.findUnique as jest.Mock).mockResolvedValue({ ownerId: inviterId });
            (prisma.user.findUnique as jest.Mock)
                .mockResolvedValueOnce({ id: inviterId, name: 'Inviter' }) // Inviter
                .mockResolvedValueOnce({ id: 'u2' }); // Target exists

            (prisma.teamMember.findUnique as jest.Mock).mockResolvedValue(null); // Not member

            (prisma.invitation.findFirst as jest.Mock).mockResolvedValue({
                id: 'inv1', status: InvitationStatus.DECLINED
            });

            (prisma.invitation.update as jest.Mock).mockResolvedValue({ id: 'inv1' });

            await teamService.inviteMember(teamId, email, inviterId);

            expect(prisma.invitation.update).toHaveBeenCalled();
        });
    });

    describe('respondToInvitation', () => {
        it('should accept invitation', async () => {
            (prisma.invitation.findUnique as jest.Mock).mockResolvedValue({
                id: 'inv1', status: InvitationStatus.PENDING, email: 'u1@test.com', teamId: 't1',
                team: { ownerId: 'owner' }
            });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', email: 'u1@test.com', name: 'User1' });

            await teamService.respondToInvitation('inv1', 'u1', true);

            expect(prisma.$transaction).toHaveBeenCalled();
        });

        it('should decline invitation', async () => {
            (prisma.invitation.findUnique as jest.Mock).mockResolvedValue({
                id: 'inv1', status: InvitationStatus.PENDING, email: 'u1@test.com', teamId: 't1',
                team: { ownerId: 'owner' }
            });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', email: 'u1@test.com' });

            await teamService.respondToInvitation('inv1', 'u1', false);

            expect(prisma.invitation.update).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 'inv1' }, data: { status: InvitationStatus.DECLINED } })
            );
        });
    });
});
