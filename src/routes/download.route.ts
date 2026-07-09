import { Router } from 'express';
import { downloadDocument, downloadSelfie } from '../controllers/download.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/document/:id/download', authenticateAdmin, downloadDocument);
router.get('/employee/:id/selfie/download', authenticateAdmin, downloadSelfie);

export default router;