import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';

export const downloadDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const document = await prisma.document.findUnique({ where: { id } });

    if (!document) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    const baseDir = document.mimeType === 'application/pdf' ? 'pdf' : 'jpg';
    const filePath = path.join(__dirname, `../../uploads/${baseDir}`, document.storedFilename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: 'File not found on server' });
      return;
    }

    if (document.mimeType.startsWith('image/')) {
      // 1. Convert Image to PDF on the fly
      const pdfFilename = document.originalFilename.replace(/\.[^/.]+$/, "") + ".pdf";
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${pdfFilename}"`);

      // 2. Stream directly to client
      const doc = new PDFDocument({ margin: 0, size: 'A4' });
      doc.pipe(res);
      
      // A4 size is 595.28 x 841.89 points. Center the image.
      doc.image(filePath, 0, 0, {
        fit: [595.28, 841.89],
        align: 'center',
        valign: 'center'
      });
      
      doc.end();
    } else {
      // 3. Serve original PDF directly
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalFilename}"`);
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const downloadSelfie = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const employee = await prisma.employee.findUnique({ where: { id } });

    if (!employee || !employee.selfieFilename) {
      res.status(404).json({ success: false, error: 'Selfie not found' });
      return;
    }

    const filePath = path.join(__dirname, '../../uploads/jpg', employee.selfieFilename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: 'File not found on server' });
      return;
    }

    // Always serve Selfie as JPG
    const filename = `selfie-${employee.firstName}.jpg`;
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};