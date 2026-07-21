import { Router } from 'express';
import { upload } from '../middleware/upload.middleware';
import { uploadSelfie, uploadDocument } from '../controllers/upload.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

router.post('/employee/:id/selfie', authenticateUser as any, upload.single('selfie'), uploadSelfie);
router.post('/employee/:id/document', authenticateUser as any, upload.single('document'), uploadDocument);

export default router;