import { Router } from 'express';
import { exportExcel, downloadPdf, getReportEmployees } from '../controllers/report.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/export/excel', authenticateAdmin, exportExcel);
router.get('/employee/:id/pdf', authenticateAdmin, downloadPdf);

router.get('/reports/employees', getReportEmployees);

export default router;