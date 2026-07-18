import { Router } from 'express';
import { 
  exportExcel, 
  downloadPdf, 
  getReportEmployees, 
  getReportEmployeeDetail, 
  exportMobileExcel,
  downloadReportDocument,
  downloadBulkPdf
} from '../controllers/report.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';

const router = Router();

// Existing admin routes
router.get('/export/excel', authenticateAdmin, exportExcel);
router.get('/employee/:id/pdf', authenticateAdmin, downloadPdf);

// New isolated mobile report endpoints
router.get('/reports/employees', getReportEmployees);
router.get('/reports/employee/:id', getReportEmployeeDetail);
router.get('/reports/export/excel', exportMobileExcel);
// Add this single line to your existing route definitions
router.get('/reports/document/:docId/download', downloadReportDocument);
router.get('/export/pdf/bulk', authenticateAdmin, downloadBulkPdf);

export default router;