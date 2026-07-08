import { Router } from 'express';
import { upload } from '../middleware/upload.middleware';
import { uploadSelfie, uploadDocument } from '../controllers/upload.controller';

const router = Router();

// Matches: POST /employee/:id/selfie
// Expects form-data with a file field named "selfie"
router.post('/employee/:id/selfie', upload.single('selfie'), uploadSelfie);

// Matches: POST /employee/:id/document
// Expects form-data with a file field named "document" and a text field "type"
router.post('/employee/:id/document', upload.single('document'), uploadDocument);

export default router;