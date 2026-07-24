import { Request, Response } from "express";
import { AdminService } from "../services/admin/admin.service";

export const getAdmins = async (req: Request, res: Response): Promise<void> => {
  try {
    const admins = await AdminService.getAdmins();
    res.status(200).json({ success: true, data: admins });
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Failed to fetch admins." });
  }
};

export const createAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const admin = await AdminService.createAdmin(req.body);
    res.status(201).json({ success: true, data: admin });
  } catch (error: any) {
    const statusCode = error.message.includes("exists") ? 409 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export const updateAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    // Force cast to String to satisfy strict Express types
    const admin = await AdminService.updateAdmin(String(req.params.id), req.body);
    res.status(200).json({ success: true, data: admin });
  } catch (error: any) {
    const statusCode = error.message.includes("protected") ? 403 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export const resetAdminPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Force cast to String to satisfy strict Express types
    await AdminService.resetAdminPassword(String(req.params.id), req.body.password);
    res.status(200).json({ success: true, data: { message: "Password reset successfully." } });
  } catch (error: any) {
    const statusCode = error.message.includes("protected") ? 403 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export const deleteAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    // Force cast to String to satisfy strict Express types
    await AdminService.deleteAdmin(String(req.params.id));
    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (error: any) {
    const statusCode = error.message.includes("protected") ? 403 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};