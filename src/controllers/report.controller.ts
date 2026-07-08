import { Request, Response } from "express";
import { ReportService } from "../services/reporting/report.service";

export const exportExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = req.query;
    const buffer = await ReportService.exportExcel(filters);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Employee_Report_${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Failed to generate Excel report." });
  }
};

export const downloadPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    // FIX: Explicitly cast the parameter as a string
    const id = req.params.id as string; 
    
    const buffer = await ReportService.generateEmployeePdf(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Employee_Profile_${id}.pdf"`);
    
    res.send(buffer);
  } catch (error: any) {
    const statusCode = error?.message?.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};