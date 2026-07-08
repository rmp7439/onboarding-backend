import { Router } from 'express';
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

const router = Router();

// Matches: POST /employee/register
router.post('/employee/register', validateRegistration, register);

// Matches: GET /employees
router.get('/employees', getEmployees);

// Matches: GET /employee/:id
router.get('/employee/:id', getEmployeeById);

// Matches: PATCH /employee/status
router.patch('/employee/status', validateStatusUpdate, updateStatus);

// Matches: PATCH /employee/code
router.patch('/employee/code', validateCodeUpdate, updateCode);

export default router;