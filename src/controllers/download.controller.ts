import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import axios from "axios";

export const downloadDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const document = await prisma.document.findUnique({ where: { id } });

    if (!document || !document.cloudinaryUrl) {
      res.status(404).json({ success: false, error: "Document not found" });
      return;
    }

    res.redirect(302, document.cloudinaryUrl);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const downloadSelfie = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const employee = await prisma.employee.findUnique({ where: { id } });

    if (!employee || !employee.selfieCloudinaryUrl) {
      res.status(404).json({ success: false, error: "Selfie not found" });
      return;
    }

    const response = await axios({
      method: "get",
      url: employee.selfieCloudinaryUrl,
      responseType: "stream",
    });
    
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Content-Disposition", `attachment; filename="selfie-${employee.firstName}.jpg"`);
    response.data.pipe(res);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};