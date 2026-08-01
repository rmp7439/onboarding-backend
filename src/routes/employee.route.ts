import { Router, RequestHandler } from 'express';
import { 
  register, 
  getEmployees, 
  getEmployeeById, 
  updateStatus, 
  updateCode,
  getEmployeeProfile,
  searchEmployees,
  returnForCorrection,
  updateEmployee,
  getMyApplications,
  adminUpdateEmployee
} from '../controllers/employee.controller';
import { 
  validateRegistration, 
  validateStatusUpdate, 
  validateCodeUpdate,
  validateReturnForCorrection,
  validateEmployeeUpdate
} from '../middleware/employee.validator';
import { authenticateToken, RequireRole, ROLES } from '../middleware/auth.middleware';
import { deleteEmployee } from '../controllers/employee.controller';

const router = Router();

// ==============================
// Public / Mobile facing
// ==============================
router.post('/employee/register', authenticateToken as RequestHandler, RequireRole(ROLES.DEV, ROLES.ADMIN, ROLES.SUPERVISOR) as RequestHandler, validateRegistration as RequestHandler, register as RequestHandler);
router.put('/employee/:id', authenticateToken as RequestHandler, RequireRole(ROLES.DEV, ROLES.ADMIN, ROLES.SUPERVISOR) as RequestHandler, validateEmployeeUpdate as RequestHandler, updateEmployee as RequestHandler);
router.get('/employees/search', authenticateToken as RequestHandler, RequireRole(ROLES.DEV, ROLES.ADMIN, ROLES.SUPERVISOR) as RequestHandler, searchEmployees as RequestHandler);
router.get('/employee/profile/:id', authenticateToken as RequestHandler, RequireRole(ROLES.DEV, ROLES.ADMIN, ROLES.SUPERVISOR) as RequestHandler, getEmployeeProfile as RequestHandler);
router.get('/employee/my-applications', authenticateToken as RequestHandler, RequireRole(ROLES.DEV, ROLES.ADMIN, ROLES.SUPERVISOR) as RequestHandler, getMyApplications as RequestHandler);

// ==============================
// Protected Admin facing
// ==============================
router.get('/employees', authenticateToken as RequestHandler, RequireRole(ROLES.DEV, ROLES.ADMIN) as RequestHandler, getEmployees as RequestHandler);
router.get('/employee/:id', authenticateToken as RequestHandler, RequireRole(ROLES.DEV, ROLES.ADMIN) as RequestHandler, getEmployeeById as RequestHandler);
router.patch('/employee/status', authenticateToken as RequestHandler, RequireRole(ROLES.DEV, ROLES.ADMIN) as RequestHandler, validateStatusUpdate as RequestHandler, updateStatus as RequestHandler);
router.patch('/employee/code', authenticateToken as RequestHandler, RequireRole(ROLES.DEV, ROLES.ADMIN) as RequestHandler, validateCodeUpdate as RequestHandler, updateCode as RequestHandler);
router.patch('/employee/:id/return', authenticateToken as RequestHandler, RequireRole(ROLES.DEV, ROLES.ADMIN) as RequestHandler, validateReturnForCorrection as RequestHandler, returnForCorrection as RequestHandler);
router.delete(
  '/employee/:id', 
  authenticateToken as RequestHandler, 
  RequireRole(ROLES.DEV, ROLES.ADMIN) as RequestHandler, 
  deleteEmployee as RequestHandler
);

// ==============================
// Phase 3: Admin Employee Editing
// ==============================
router.put(
  '/admin/employees/:id', 
  authenticateToken as RequestHandler, 
  RequireRole(ROLES.DEV, ROLES.ADMIN) as RequestHandler, 
  validateEmployeeUpdate as RequestHandler, 
  adminUpdateEmployee as RequestHandler
);

export default router;