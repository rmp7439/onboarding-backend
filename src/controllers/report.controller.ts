import { Request, Response } from "express";
import { ReportService } from "../services/reporting/report.service";
import { prisma } from "../config/prisma";
import { StorageService } from "../services/storage/storage.service";

export const exportExcel = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const filters = req.query;
    const baseUrl = `${req.protocol}://${req.get("host")}/api`;
    const buffer = await ReportService.exportExcel(filters, baseUrl);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Employee_Report_${new Date().toISOString().split("T")[0]}.xlsx"`,
    );

    res.send(buffer);
  } catch (error: any) {
    res
      .status(500)
      .json({ success: false, error: "Failed to generate Excel report." });
  }
};

export const exportMobileExcel = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const filters = req.query;
    const baseUrl = `${req.protocol}://${req.get("host")}/api`;
    const buffer = await ReportService.exportExcel(filters, baseUrl);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Mobile_Report_${new Date().toISOString().split("T")[0]}.xlsx"`,
    );

    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to generate Excel report via mobile.",
    });
  }
};

export const downloadPdf = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const baseUrl = `${req.protocol}://${req.get("host")}/api`;
    const buffer = await ReportService.generateEmployeePdf(id, baseUrl);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Employee_Profile_${id}.pdf"`,
    );

    res.send(buffer);
  } catch (error: any) {
    const statusCode = error?.message?.includes("not found") ? 404 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export const getReportEmployees = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const filters = req.query;
    const employees = await ReportService.getFilteredEmployees(filters);
    res.status(200).json({ success: true, data: employees });
  } catch (error: any) {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch report results." });
  }
};

export const getReportEmployeeDetail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const employee = await ReportService.getReportEmployeeDetail(
      String(req.params.id),
    );

    res.status(200).json({
      success: true,
      data: { ...employee, selfieUrl: null },
    });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
};

export const downloadReportDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: String(req.params.docId) }
    });

    if (!document) {
      res.status(404).send("Document not found.");
      return;
    }

    const signedUrl = await StorageService.getSignedUrl(document.storedFilename);
    // Send a 302 redirect so the browser downloads/opens the raw file
    res.redirect(signedUrl);
  } catch (error: any) {
    res.status(500).send("Failed to generate document link.");
  }
};

// Add this new export to the file
export const downloadBulkPdf = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const filters = req.query;
    const baseUrl = `${req.protocol}://${req.get("host")}/api`;
    const buffer = await ReportService.generateBulkPdf(filters, baseUrl);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Employee_Bulk_Report.pdf"`,
    );

    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Failed to generate Bulk PDF report." });
  }
};