import { Request, Response } from "express";
import { AdminService } from "../services/admin/admin.service";

// Helper to extract the actor context cleanly
const getActorContext = (req: Request) => {
  const adminReq = (req as any).admin || (req as any).user;
  return {
    id: adminReq.id,
    name: adminReq.name || adminReq.username,
    username: adminReq.username, // Pulled from updated JWT
    role: adminReq.role,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  };
};

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
    const admin = await AdminService.createAdmin(req.body, getActorContext(req));
    res.status(201).json({ success: true, data: admin });
  } catch (error: any) {
    const statusCode = error.message.includes("exists") ? 409 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export const updateAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const admin = await AdminService.updateAdmin(String(req.params.id), req.body, getActorContext(req));
    res.status(200).json({ success: true, data: admin });
  } catch (error: any) {
    const statusCode = error.message.includes("protected") ? 403 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export const resetAdminPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    await AdminService.resetAdminPassword(String(req.params.id), req.body.password, getActorContext(req));
    res.status(200).json({ success: true, data: { message: "Password reset successfully." } });
  } catch (error: any) {
    const statusCode = error.message.includes("protected") ? 403 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export const deleteAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    await AdminService.deleteAdmin(String(req.params.id), getActorContext(req));
    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (error: any) {
    const statusCode = error.message.includes("protected") ? 403 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};