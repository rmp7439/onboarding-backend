import { Request, Response } from "express";
import {
  ReportFilters,
  ReportService,
} from "../services/reporting/report.service";
import { prisma } from "../config/prisma";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

const firstQueryValue = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    const trimmed = value[0].trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  return undefined;
};

const buildReportFilters = (query: Request["query"]): ReportFilters => ({
  code: firstQueryValue(query.code),
  name: firstQueryValue(query.name),
  joiningDate: firstQueryValue(query.joiningDate),
  month: firstQueryValue(query.month),
  year: firstQueryValue(query.year),
});

export const exportExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = buildReportFilters(req.query);
    const buffer = await ReportService.exportExcel(filters);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Employee_Report_${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Failed to generate Excel report." });
  }
};

export const exportMobileExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = buildReportFilters(req.query);
    const buffer = await ReportService.exportExcel(filters);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Mobile_Report_${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Failed to generate Excel report via mobile." });
  }
};

export const downloadPdf = async (req: Request, res: Response): Promise<void> => {
  try {
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

export const getReportEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = buildReportFilters(req.query);
    const employees = await ReportService.getFilteredEmployees(filters);
    res.status(200).json({ success: true, data: employees });
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Failed to fetch report results." });
  }
};

export const getReportEmployeeDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const employeeId = String(req.params.id);
    const employee = await ReportService.getReportEmployeeDetail(employeeId);
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const employeeWithSelfie = employee as typeof employee & {
      selfieFilename?: string | null;
    };
    const selfieUrl = employeeWithSelfie.selfieFilename 
      ? `${baseUrl}/uploads/jpg/${employeeWithSelfie.selfieFilename}` 
      : null;

    const { selfieFilename, ...safeProfile } = employeeWithSelfie;

    res.status(200).json({ 
      success: true, 
      data: { ...safeProfile, selfieUrl }
    });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
};

export const downloadReportDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.docId);
    const document = await prisma.document.findUnique({ where: { id } });

    if (!document) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    const baseDir = document.mimeType === 'application/pdf' ? 'pdf' : 'jpg';
    const documentWithStoredFilename = document as typeof document & {
      storedFilename: string;
    };
    const filePath = path.join(__dirname, `../../uploads/${baseDir}`, documentWithStoredFilename.storedFilename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: 'File not found on server' });
      return;
    }

    // Reuse existing stream logic from download.controller.ts natively
    if (document.mimeType.startsWith('image/')) {
      const pdfFilename = document.originalFilename.replace(/\.[^/.]+$/, "") + ".pdf";
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${pdfFilename}"`);

      const doc = new PDFDocument({ margin: 0, size: 'A4' });
      doc.pipe(res);
      doc.image(filePath, 0, 0, { fit: [595.28, 841.89], align: 'center', valign: 'center' });
      doc.end();
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${document.originalFilename}"`);
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};