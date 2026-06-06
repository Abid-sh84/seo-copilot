import { Router } from 'express';
import { authMiddleware } from '../auth';
import { auditLimiter } from '../../common/middleware/rateLimiter';
import { runAudit, listAudits, getAudit, deleteAudit } from './audit.controller';

const router = Router();

// POST   /api/audits        → run a full audit
router.post(  '/',    authMiddleware, auditLimiter, runAudit);

// GET    /api/audits        → paginated history
router.get(   '/',    authMiddleware, listAudits);

// GET    /api/audits/:id    → single audit
router.get(   '/:id', authMiddleware, getAudit);

// DELETE /api/audits/:id    → remove audit
router.delete('/:id', authMiddleware, deleteAudit);

export default router;
