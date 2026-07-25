import { Router, RequestHandler } from 'express';
import { getBanks, createBank, updateBank, deleteBank } from '../controllers/bank.controller';
import { authenticateToken, RequireRole, ROLES } from '../middleware/auth.middleware';

const router = Router();

router.get('/banks', authenticateToken as RequestHandler, RequireRole(ROLES.DEV, ROLES.ADMIN, ROLES.SUPERVISOR) as RequestHandler, getBanks as RequestHandler);
router.post('/banks', authenticateToken as RequestHandler, RequireRole(ROLES.DEV, ROLES.ADMIN) as RequestHandler, createBank as RequestHandler);
router.put('/banks/:id', authenticateToken as RequestHandler, RequireRole(ROLES.DEV, ROLES.ADMIN) as RequestHandler, updateBank as RequestHandler);
router.delete('/banks/:id', authenticateToken as RequestHandler, RequireRole(ROLES.DEV, ROLES.ADMIN) as RequestHandler, deleteBank as RequestHandler);

export default router;