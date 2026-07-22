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
  getMyApplications
} from '../controllers/employee.controller';
import { 
  validateRegistration, 
  validateStatusUpdate, 
  validateCodeUpdate,
  validateReturnForCorrection,
  validateEmployeeUpdate
} from '../middleware/employee.validator';
import { authenticateAdmin, authenticateUser } from '../middleware/auth.middleware';
const router = Router();

// ==============================
// Public / Mobile facing
// ==============================
router.post('/employee/register', authenticateUser as RequestHandler, validateRegistration as RequestHandler, register as RequestHandler);
router.put('/employee/:id', authenticateUser as RequestHandler, validateEmployeeUpdate as RequestHandler, updateEmployee as RequestHandler);
router.get('/employees/search', authenticateUser as RequestHandler, searchEmployees as RequestHandler);
router.get('/employee/profile/:id', authenticateUser as RequestHandler, getEmployeeProfile as RequestHandler);
router.get('/employee/my-applications', authenticateUser as RequestHandler, getMyApplications as RequestHandler);

// ==============================
// Protected Admin facing
// ==============================
router.get('/employees', authenticateAdmin as RequestHandler, getEmployees as RequestHandler);
router.get('/employee/:id', authenticateAdmin as RequestHandler, getEmployeeById as RequestHandler);
router.patch('/employee/status', authenticateAdmin as RequestHandler, validateStatusUpdate as RequestHandler, updateStatus as RequestHandler);
router.patch('/employee/code', authenticateAdmin as RequestHandler, validateCodeUpdate as RequestHandler, updateCode as RequestHandler);

// NEW: Admin Return for Correction Endpoint
router.patch('/employee/:id/return', authenticateAdmin as RequestHandler, validateReturnForCorrection as RequestHandler, returnForCorrection as RequestHandler);

export default router;