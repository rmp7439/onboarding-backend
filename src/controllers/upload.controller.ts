import { Request, Response } from 'express';
import { UploadService } from '../services/employee/upload.service';
import { DocumentType } from '@prisma/client';

export const uploadSelfie = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      res.status(400).json({ success: false, error: 'Selfie file is required.' });
      return;
    }

    const updatedEmployee = await UploadService.saveSelfie(id, req.file);
    res.status(200).json({ success: true, data: updatedEmployee });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export const uploadDocument = async (
  req: Request<{ id: string }, any, { type: string }>, 
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    if (!req.file) {
      res.status(400).json({ success: false, error: 'Document file is required.' });
      return;
    }

    // Validate the DocumentType matches the Prisma Enum
    if (!type || !Object.values(DocumentType).includes(type as DocumentType)) {
      res.status(400).json({ 
        success: false, 
        error: `Invalid document type. Allowed types: ${Object.values(DocumentType).join(', ')}` 
      });
      return;
    }

    const document = await UploadService.saveDocument(id, type as DocumentType, req.file);
    res.status(201).json({ success: true, data: document });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};