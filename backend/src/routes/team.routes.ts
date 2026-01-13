import { Router } from 'express';
import * as teamController from '../controllers/team.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/my-team', teamController.getMyTeam);
router.post('/invite', teamController.inviteMember);
router.get('/memberships', teamController.getMemberships);
router.delete('/project/:projectId/member/:userId', teamController.removeMemberFromProject);
router.delete('/invitations/:id', teamController.cancelInvitation);

export default router;
