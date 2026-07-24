import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { StorageService } from "../services/storage/storage.service";
import { PDFDocument } from "pdf-lib";
import { DocumentType } from "@prisma/client";
import axios from "axios";

export const downloadDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: String(req.params.id) }
    });

    if (!document) {
      res.status(404).json({ success: false, error: "Document not found." });
      return;
    }

    const signedUrl = await StorageService.getSignedUrl(document.storedFilename);
    res.redirect(signedUrl);
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch document." });
  }
};

export const downloadSelfie = async (req: Request, res: Response): Promise<void> => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: String(req.params.id) }
    });

    if (!employee || !employee.selfieFilename) {
      res.status(404).json({ success: false, error: "Selfie not found." });
      return;
    }

    const signedUrl = await StorageService.getSignedUrl(employee.selfieFilename);
    res.redirect(signedUrl);
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch selfie." });
  }
};

export const downloadMergedDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    // Explicitly cast to string to fix TS errors and satisfy Prisma's strict typing
    const employeeId = String(req.params.employeeId);
    const type = String(req.params.type) as DocumentType;

    if (!Object.values(DocumentType).includes(type)) {
      res.status(400).json({ success: false, error: "Invalid document type." });
      return;
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { 
        documents: { 
          where: { type },
          orderBy: { uploadedAt: 'asc' } // Enforce chronological upload order
        } 
      }
    });

    if (!employee || employee.documents.length === 0) {
      res.status(404).json({ success: false, error: "Documents not found." });
      return;
    }

    const documents = employee.documents;

    // Format: EMPLOYEE_NAME_DOCUMENT_TYPE.pdf
    const rawName = `${employee.firstName} ${employee.surname}`;
    const safeName = rawName.trim().toUpperCase().replace(/\s+/g, '_');
    const safeType = type.toUpperCase().replace(/\s+/g, '_');
    const filename = `${safeName}_${safeType}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    // Use "inline" so browser preview works, but provide the strict filename
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    // Fast path: Single document stream
    if (documents.length === 1) {
      const signedUrl = await StorageService.getSignedUrl(documents[0].storedFilename);
      const response = await axios.get(signedUrl, { responseType: 'arraybuffer' });
      
      res.setHeader('Content-Length', response.data.byteLength);
      res.send(Buffer.from(response.data));
      return;
    }

    // Multi-page merging
    const mergedPdf = await PDFDocument.create();
    
    for (const doc of documents) {
      try {
        const signedUrl = await StorageService.getSignedUrl(doc.storedFilename);
        const response = await axios.get(signedUrl, { responseType: 'arraybuffer' });
        
        const pdfToMerge = await PDFDocument.load(response.data);
        const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      } catch (err) {
        console.error(`Failed to merge document page ${doc.id}:`, err);
        res.status(500).json({ success: false, error: `Corrupted document page encountered (ID: ${doc.id}).` });
        return;
      }
    }

    const mergedPdfBytes = await mergedPdf.save();
    const pdfBuffer = Buffer.from(mergedPdfBytes);

    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error) {
    console.error("Merge error:", error);
    res.status(500).json({ success: false, error: "Failed to generate multi-page document." });
  }
};