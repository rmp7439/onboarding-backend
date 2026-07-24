import { Router, RequestHandler } from 'express';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  assignUnits,
  getMyUnits,
  getMe,
  resetPassword
} from '../controllers/user.controller';
import { authenticateToken, RequireRole, ROLES } from '../middleware/auth.middleware';

const router = Router();

// CRUD strictly restricted to DEV
router.post('/users', authenticateToken as RequestHandler, RequireRole(ROLES.DEV) as RequestHandler, createUser as RequestHandler);
router.put('/users/:id', authenticateToken as RequestHandler, RequireRole(ROLES.DEV) as RequestHandler, updateUser as RequestHandler);
router.delete('/users/:id', authenticateToken as RequestHandler, RequireRole(ROLES.DEV) as RequestHandler, deleteUser as RequestHandler);
router.patch('/users/:id/password', authenticateToken as RequestHandler, RequireRole(ROLES.DEV) as RequestHandler, resetPassword as RequestHandler);

// Shared Admin Capabilities
router.get('/users', authenticateToken as RequestHandler, RequireRole(ROLES.DEV, ROLES.ADMIN) as RequestHandler, getUsers as RequestHandler);
router.put('/users/:id/units', authenticateToken as RequestHandler, RequireRole(ROLES.DEV, ROLES.ADMIN) as RequestHandler, assignUnits as RequestHandler);

// Supervisor Profiles
router.get('/user/me', authenticateToken as RequestHandler, RequireRole(ROLES.SUPERVISOR, ROLES.DEV, ROLES.ADMIN) as RequestHandler, getMe as RequestHandler);
router.get('/user/my-units', authenticateToken as RequestHandler, RequireRole(ROLES.SUPERVISOR, ROLES.DEV, ROLES.ADMIN) as RequestHandler, getMyUnits as RequestHandler);

export default router;