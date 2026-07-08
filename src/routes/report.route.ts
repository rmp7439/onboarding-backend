import { Router } from 'express';
import { exportExcel, downloadPdf } from '../controllers/report.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/export/excel', authenticateAdmin, exportExcel);
router.get('/employee/:id/pdf', authenticateAdmin, downloadPdf);

export default router;