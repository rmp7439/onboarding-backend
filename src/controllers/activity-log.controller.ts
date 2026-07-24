import { Request, Response } from "express";
import { ActivityLogService } from "../services/logging/activity-log.service";

export const getLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const result = await ActivityLogService.getLogs(req.query, page, limit);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Failed to fetch activity logs." });
  }
};