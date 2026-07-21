import { Router } from 'express';
import { getUnits, createUnit, updateUnit, deleteUnit } from '../controllers/unit.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use('/units', authenticateAdmin);

router.get('/units', getUnits);
router.post('/units', createUnit);
router.put('/units/:id', updateUnit);
router.delete('/units/:id', deleteUnit);

export default router;