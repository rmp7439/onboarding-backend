import { Router } from 'express';
import { getUnits, createUnit, updateUnit, deleteUnit } from '../controllers/unit.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all unit management routes
router.use(authenticateAdmin);

// Paths are defined relative to where this router is mounted (/units)
router.get('/', getUnits);
router.post('/', createUnit);
router.put('/:id', updateUnit);
router.delete('/:id', deleteUnit);

export default router;