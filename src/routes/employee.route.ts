import { Router, RequestHandler } from 'express';
import { 
  register, 
  getEmployees, 
  getEmployeeById, 
  updateStatus, 
  updateCode 
} from '../controllers/employee.controller';
import { 
  validateRegistration, 
  validateStatusUpdate, 
  validateCodeUpdate 
} from '../middleware/employee.validator';
import { authenticateAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public / Mobile facing
router.post('/employee/register', validateRegistration as RequestHandler, register as RequestHandler);

// Protected Admin facing
router.get('/employees', authenticateAdmin as RequestHandler, getEmployees as RequestHandler);

// Matches: GET /employee/:id
router.get('/employee/:id', authenticateAdmin as RequestHandler, getEmployeeById as RequestHandler);

// Matches: PATCH /employee/status
router.patch('/employee/status', authenticateAdmin as RequestHandler, validateStatusUpdate as RequestHandler, updateStatus as RequestHandler);

// Matches: PATCH /employee/code
router.patch('/employee/code', authenticateAdmin as RequestHandler, validateCodeUpdate as RequestHandler, updateCode as RequestHandler);

export default router;