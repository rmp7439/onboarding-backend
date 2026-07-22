import { Router } from 'express';
import { employeeLogin, login, changeAdminPassword } from '../controllers/auth.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';

const router = Router();
router.post('/auth/login', login);
router.post('/employee/auth/login', employeeLogin);
router.patch('/admin/password', authenticateAdmin, changeAdminPassword);

export default router;