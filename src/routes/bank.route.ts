import { Router, RequestHandler } from 'express';
import { getBanks, createBank, updateBank, deleteBank } from '../controllers/bank.controller';
import { authenticateAdmin, authenticateUser } from '../middleware/auth.middleware';

const router = Router();

// Allow users (mobile) to fetch banks. Admins require full CRUD.
router.get('/banks', authenticateUser as RequestHandler, getBanks as RequestHandler);
router.post('/banks', authenticateAdmin as RequestHandler, createBank as RequestHandler);
router.put('/banks/:id', authenticateAdmin as RequestHandler, updateBank as RequestHandler);
router.delete('/banks/:id', authenticateAdmin as RequestHandler, deleteBank as RequestHandler);

export default router;