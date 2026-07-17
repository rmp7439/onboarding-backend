import { Request, Response } from "express";

export const downloadDocument = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, error: "Storage provider not implemented." });
};

export const downloadSelfie = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, error: "Storage provider not implemented." });
};