import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser, assignUnits } from '../controllers/user.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';

const router = Router();

// Protect all user management routes
router.use('/users', authenticateAdmin);

router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Assign units to user
router.put('/users/:id/units', assignUnits);

export default router;