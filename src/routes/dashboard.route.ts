import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/dashboard/stats', authenticateAdmin, getDashboardStats);

export default router;