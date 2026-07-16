import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import axios from 'axios';

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
      const pdfFilename = document.originalFilename.replace(/\.[^/.]+$/, "") + ".pdf";
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${pdfFilename}"`);

      const doc = new PDFDocument({ margin: 0, size: 'A4' });
      doc.pipe(res);
      doc.image(filePath, 0, 0, { fit: [595.28, 841.89], align: 'center', valign: 'center' });
      doc.end();
    } else {
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

    if (!employee) {
      res.status(404).json({ success: false, error: 'Selfie not found' });
      return;
    }

    // Proxy the Cloudinary stream if it exists
    if (employee.selfieCloudinaryUrl) {
      const response = await axios({
        method: 'get',
        url: employee.selfieCloudinaryUrl,
        responseType: 'stream'
      });
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Disposition', `attachment; filename="selfie-${employee.firstName}.jpg"`);
      response.data.pipe(res);
      return;
    }

    // Fallback to legacy local stream
    if (!employee.selfieFilename) {
      res.status(404).json({ success: false, error: 'Selfie not found' });
      return;
    }

    const filePath = path.join(__dirname, '../../uploads/jpg', employee.selfieFilename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: 'File not found on server' });
      return;
    }

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="selfie-${employee.firstName}.jpg"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};