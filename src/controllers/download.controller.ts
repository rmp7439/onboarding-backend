import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { StorageService } from "../services/storage/storage.service";

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
};String()