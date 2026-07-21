import { Router, RequestHandler } from 'express';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  assignUnits,
  getMyUnits
} from '../controllers/user.controller';
import { authenticateAdmin, authenticateUser } from '../middleware/auth.middleware';

const router = Router();

// Define paths explicitly to match existing Employee routing architecture
router.get('/users', authenticateAdmin as RequestHandler, getUsers as RequestHandler);
router.post('/users', authenticateAdmin as RequestHandler, createUser as RequestHandler);
router.put('/users/:id', authenticateAdmin as RequestHandler, updateUser as RequestHandler);
router.delete('/users/:id', authenticateAdmin as RequestHandler, deleteUser as RequestHandler);

// Assignment endpoint
router.get('/user/my-units', authenticateUser as RequestHandler, getMyUnits as RequestHandler);
router.put('/users/:id/units', authenticateAdmin as RequestHandler, assignUnits as RequestHandler);

export default router;