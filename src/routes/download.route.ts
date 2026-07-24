import { Router } from 'express';
import { downloadDocument, downloadSelfie, downloadMergedDocument } from '../controllers/download.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/document/:id/download', authenticateAdmin, downloadDocument);
router.get('/employee/:id/selfie/download', authenticateAdmin, downloadSelfie);

// Add the new merged endpoint
router.get('/employee/:employeeId/document/:type/merged', authenticateAdmin, downloadMergedDocument);

export default router;