import { Router, RequestHandler } from 'express';
import { 
  getUnits, 
  createUnit, 
  updateUnit, 
  deleteUnit 
} from '../controllers/unit.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/units', authenticateAdmin as RequestHandler, getUnits as RequestHandler);
router.post('/units', authenticateAdmin as RequestHandler, createUnit as RequestHandler);
router.put('/units/:id', authenticateAdmin as RequestHandler, updateUnit as RequestHandler);
router.delete('/units/:id', authenticateAdmin as RequestHandler, deleteUnit as RequestHandler);

export default router;