import { Router } from 'express';
import { exportExcel, downloadPdf } from '../controllers/report.controller';

const router = Router();

router.get('/export/excel', exportExcel);
router.get('/employee/:id/pdf', downloadPdf);

export default router;