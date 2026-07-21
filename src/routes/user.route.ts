import { Router, RequestHandler } from 'express';
import { createUser } from '../controllers/user.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';

const router = Router();

router.post('/users', authenticateAdmin as RequestHandler, createUser as RequestHandler);

export default router;