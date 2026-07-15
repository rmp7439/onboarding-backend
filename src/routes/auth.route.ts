import { Router } from 'express';
import { employeeLogin, login } from '../controllers/auth.controller';

const router = Router();
router.post('/auth/login', login);
router.post('/employee/auth/login', employeeLogin);

export default router;