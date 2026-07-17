import { Request, Response, NextFunction } from 'express';
import { UploadService } from '../services/employee/upload.service';
import { DocumentType } from '@prisma/client';
import { AppError } from '../utils/AppError';

export const uploadSelfie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    if (!req.file) throw new AppError('Selfie file is required.', 400);

    const updatedEmployee = await UploadService.saveSelfie(id, req.file);
    res.status(200).json({ success: true, data: updatedEmployee });
  } catch (error) {
    next(error);
  }
};

export const uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { type } = req.body;

    if (!req.file) throw new AppError('Document file is required.', 400);
    if (!type || !Object.values(DocumentType).includes(type as DocumentType)) {
      throw new AppError(`Invalid document type. Allowed types: ${Object.values(DocumentType).join(', ')}`, 400);
    }

    const document = await UploadService.saveDocument(id, type as DocumentType, req.file);
    res.status(201).json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
};