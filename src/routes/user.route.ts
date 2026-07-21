import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser, assignUnits } from '../controllers/user.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all user management routes
router.use(authenticateAdmin);

// Paths are defined relative to where this router is mounted (/users)
router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

// Assign units to user
router.put('/:id/units', assignUnits);

export default router;