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
    // Explicitly cast to string to satisfy Prisma's strict typing
    const employeeId = String(req.params.employeeId);
    const type = String(req.params.type) as DocumentType;

    if (!Object.values(DocumentType).includes(type as DocumentType)) {
      res.status(400).json({ success: false, error: "Invalid document type." });
      return;
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }, // Error 1 resolved
      include: { 
        documents: { 
          where: { type: type as DocumentType },
          orderBy: { uploadedAt: 'asc' } 
        } 
      }
    });

    // Errors 2 & 3 resolved automatically because Prisma can now properly infer the `include`
    if (!employee || employee.documents.length === 0) {
      res.status(404).json({ success: false, error: "Documents not found." });
      return;
    }

    const documents = employee.documents;
    const prefix = employee.employeeCode && employee.employeeCode !== "Pending Assignment" ? employee.employeeCode : "EMP";
    const filename = `${prefix}_${type}.pdf`;

    // Ensure headers dictate PDF handling in browsers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    // Fast path: If it's a single image/page, just stream it directly
    if (documents.length === 1) {
      const signedUrl = await StorageService.getSignedUrl(documents[0].storedFilename);
      const response = await axios.get(signedUrl, { responseType: 'arraybuffer' });
      res.send(Buffer.from(response.data));
      return;
    }

    // Multi-page document: Merge them together using pdf-lib
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
        throw new Error("Corrupted document page encountered.");
      }
    }

    const mergedPdfBytes = await mergedPdf.save();
    res.send(Buffer.from(mergedPdfBytes));

  } catch (error) {
    console.error("Merge error:", error);
    res.status(500).json({ success: false, error: "Failed to generate multi-page document." });
  }
};