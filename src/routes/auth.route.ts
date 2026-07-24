import { Router, RequestHandler } from 'express';
import { employeeLogin, login, changeAdminPassword } from '../controllers/auth.controller';
import { authenticateToken, RequireRole, ROLES } from '../middleware/auth.middleware';

const router = Router();
router.post('/auth/login', login as RequestHandler);
router.post('/employee/auth/login', employeeLogin as RequestHandler);

// Pass as separate arguments and cast as RequestHandler to satisfy TS
router.patch('/admin/password', authenticateToken as RequestHandler, RequireRole(ROLES.DEV, ROLES.ADMIN) as RequestHandler, changeAdminPassword as RequestHandler);

export default router;