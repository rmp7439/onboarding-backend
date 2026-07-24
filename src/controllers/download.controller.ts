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
          orderBy: { uploadedAt: 'asc' } // Ensures exact upload order (Page 1 -> Page 2 -> ...)
        } 
      }
    });

    if (!employee || employee.documents.length === 0) {
      res.status(404).json({ success: false, error: "Documents not found." });
      return;
    }

    const documents = employee.documents;

    // --- REQUIRED DEBUG LOGGING ---
    console.log(`\n--- DOCUMENT GENERATION DEBUG: ${type} ---`);
    console.log(`1. Pages retrieved from DB/Storage: ${documents.length}`);
    console.log(`2. Ordered Image Paths:`, documents.map(d => d.storedFilename));

    // Format strictly: EMPLOYEE_NAME_DOCUMENT_TYPE.pdf
    const rawName = `${employee.firstName} ${employee.surname}`;
    const safeName = rawName.trim().toUpperCase().replace(/\s+/g, '_');
    const safeType = type.toUpperCase().replace(/\s+/g, '_');
    const filename = `${safeName}_${safeType}.pdf`;

    // Headers mapped for proper application/pdf handling and browser preview support
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`); // 'inline' allows preview, frontend forces the download

    // Fast path for single page documents
    if (documents.length === 1) {
      const signedUrl = await StorageService.getSignedUrl(documents[0].storedFilename);
      const response = await axios.get(signedUrl, { responseType: 'arraybuffer' });
      
      const pdfBuffer = Buffer.from(response.data);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      console.log(`3. Pages added to PDF: 1`);
      console.log(`4. Final PDF Page Count: 1\n---------------------------------------\n`);
      res.send(pdfBuffer);
      return;
    }

    // PDF Generation Stage: Merge multi-page documents seamlessly
    const mergedPdf = await PDFDocument.create();
    let pagesAdded = 0;

    for (const doc of documents) {
      try {
        const signedUrl = await StorageService.getSignedUrl(doc.storedFilename);
        const response = await axios.get(signedUrl, { responseType: 'arraybuffer' });
        
        const pdfToMerge = await PDFDocument.load(response.data);
        const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
        
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
          pagesAdded++;
        });
      } catch (err) {
        console.error(`[ERROR] Failed to process document ID ${doc.id}:`, err);
        res.status(500).json({ success: false, error: "Corrupted source document encountered. Cannot generate PDF." });
        return;
      }
    }

    const mergedPdfBytes = await mergedPdf.save();
    const pdfBuffer = Buffer.from(mergedPdfBytes);

    // --- REQUIRED DEBUG LOGGING ---
    console.log(`3. Pages added to PDF: ${pagesAdded}`);
    console.log(`4. Final PDF Page Count: ${mergedPdf.getPageCount()}\n---------------------------------------\n`);

    // Ensure correct Content-Length to prevent corrupted streams
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error) {
    console.error("Merge error:", error);
    res.status(500).json({ success: false, error: "Failed to generate multi-page document." });
  }
};