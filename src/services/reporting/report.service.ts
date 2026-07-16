import { prisma } from "../../config/prisma";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export interface ReportFilters {
  code?: string;
  name?: string;
  joiningDate?: string;
  month?: string;
  year?: string;
}

export class ReportService {
  static async getFilteredEmployees(filters: ReportFilters) {
    const where: any = {};

    if (filters.joiningDate) {
      const dStart = new Date(filters.joiningDate);
      const dEnd = new Date(dStart);
      dEnd.setDate(dEnd.getDate() + 1);
      where.joiningDate = { gte: dStart, lt: dEnd };
    } else if (filters.month || filters.year) {
      const currentYear = new Date().getFullYear();
      const targetYear = filters.year ? parseInt(filters.year, 10) : currentYear;
      const targetMonth = filters.month ? parseInt(filters.month, 10) - 1 : 0;
      
      const startDate = new Date(targetYear, filters.month ? targetMonth : 0, 1);
      const endDate = new Date(targetYear, filters.month ? targetMonth + 1 : 12, 1);
      
      where.joiningDate = { gte: startDate, lt: endDate };
    }

    if (filters.code) {
      where.employeeCode = { contains: filters.code.trim(), mode: "insensitive" };
    }

    return prisma.employee.findMany({
      where,
      orderBy: { joiningDate: "desc" },
      select: {
        id: true,
        firstName: true,
        surname: true,
        employeeCode: true,
        joiningDate: true,
        // Include minimal document metadata for the Admin UI list
        documents: {
          select: { id: true, type: true }
        }
      }
    });
  }

  static async getReportEmployeeDetail(id: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        surname: true,
        fatherName: true,
        husbandName: true,
        mobile: true,
        employeeCode: true,
        joiningDate: true,
        uploadedAt: true,
        selfieFilename: true,
        // Include minimal document metadata for Mobile UI detail
        documents: {
          select: { id: true, type: true }
        }
      }
    });

    if (!employee) throw new Error("Employee not found in reports database.");
    return employee;
  }

  static async exportExcel(
    filters: ReportFilters,
    dynamicColumns: { header: string; key: string; width?: number }[] = [
      { header: "ADDITIONAL COLUMN 1", key: "additionalCol1", width: 25 }, // Dynamic column support
    ],
  ): Promise<Buffer> {
    const where: any = {};

    if (filters.code) {
      where.employeeCode = {
        contains: filters.code.trim(),
        mode: "insensitive",
      };
    }

    if (filters.joiningDate) {
      const dStart = new Date(filters.joiningDate);
      const dEnd = new Date(dStart);
      dEnd.setDate(dEnd.getDate() + 1);
      where.joiningDate = { gte: dStart, lt: dEnd };
    } else if (filters.month || filters.year) {
      const currentYear = new Date().getFullYear();
      const targetYear = filters.year
        ? parseInt(filters.year, 10)
        : currentYear;
      const targetMonth = filters.month ? parseInt(filters.month, 10) - 1 : 0;

      const startDate = new Date(
        targetYear,
        filters.month ? targetMonth : 0,
        1,
      );
      const endDate = new Date(
        targetYear,
        filters.month ? targetMonth + 1 : 12,
        1,
      );

      where.joiningDate = { gte: startDate, lt: endDate };
    }

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Employees");

    const baseColumns = [
      { header: "EMPCODE", key: "empCode", width: 15 },
      { header: "APPLICATION NO", key: "applicationNo", width: 20 },
      { header: "CLIENT EMP ID", key: "clientEmpId", width: 15 },
      { header: "EMP NAME", key: "empName", width: 30 },
      { header: "F/H NAME", key: "fhName", width: 30 },
      { header: "MOTHER NAME", key: "motherName", width: 20 },
      { header: "STATUS", key: "status", width: 15 },
      { header: "DOB", key: "dob", width: 15 },
      { header: "DOJ", key: "doj", width: 15 },
      { header: "GENDER", key: "gender", width: 10 },
      { header: "MOBILE", key: "mobile", width: 15 },
      { header: "JOB TYPE", key: "jobType", width: 15 },
      { header: "BANK CODE", key: "bankCode", width: 15 },
      { header: "PAY MODE", key: "payMode", width: 15 },
      { header: "ACCOUNT NO", key: "accountNo", width: 20 },
      { header: "ACC HOLDER NAME", key: "accHolderName", width: 30 },
      { header: "IFSC CODE", key: "ifscCode", width: 15 },
      { header: "WEEKLY OFF", key: "weeklyOff", width: 15 },
      { header: "AADHAAR NO", key: "aadhaarNo", width: 20 },
      { header: "PF NUMBER", key: "pfNumber", width: 20 },
      { header: "ESI NO", key: "esiNo", width: 20 },
      { header: "PAN NO", key: "panNo", width: 15 },
      { header: "AADHAAR STATE CODE", key: "aadhaarStateCode", width: 15 },
      { header: "UAN NO", key: "uanNo", width: 20 },
      { header: "PF DED", key: "pfDed", width: 10 },
      { header: "ESI DED", key: "esiDed", width: 10 },
      { header: "LWF DED", key: "lwfDed", width: 10 },
      { header: "PTAX DED", key: "ptaxDed", width: 10 },
      { header: "CLIENT CODE", key: "clientCode", width: 15 },
      { header: "UNIT CODE", key: "unitCode", width: 15 },
      { header: "DEPT CODE", key: "deptCode", width: 15 },
      { header: "DESIGNATION CODE", key: "designationCode", width: 20 },
      { header: "EMP CAT CODE", key: "empCatCode", width: 15 },
      { header: "LocalAdd1", key: "localAdd1", width: 25 },
      { header: "LocalAdd2", key: "localAdd2", width: 25 },
      { header: "LocalPincode", key: "localPincode", width: 15 },
      { header: "PermanentAdd1", key: "permanentAdd1", width: 25 },
      { header: "PermanentAdd2", key: "permanentAdd2", width: 25 },
      { header: "PermanentPincode", key: "permanentPincode", width: 15 },
      { header: "CompID", key: "compId", width: 15 },
      { header: "Error", key: "error", width: 10 },
    ];

    worksheet.columns = [...baseColumns, ...dynamicColumns];
    worksheet.getRow(1).font = { bold: true };

    employees.forEach((emp) => {
      worksheet.addRow({
        empCode: emp.employeeCode || "",
        applicationNo: emp.id || "",
        clientEmpId: "",
        empName: `${emp.firstName} ${emp.surname}`.trim(),
        fhName: emp.fatherName || "",
        motherName: "",
        status: emp.status || "",
        dob: emp.dateOfBirth ? emp.dateOfBirth.toISOString().split("T")[0] : "",
        doj: emp.joiningDate ? emp.joiningDate.toISOString().split("T")[0] : "",
        gender: emp.gender || "",
        mobile: emp.mobile || "",
        jobType: "",
        bankCode: "",
        payMode: "",
        accountNo: emp.accountNumber || "",
        accHolderName: emp.bankName || "",
        ifscCode: emp.ifsc || "",
        weeklyOff: "",
        aadhaarNo: emp.aadhaar || "",
        pfNumber: "",
        esiNo: emp.esic || "",
        panNo: emp.pan || "",
        aadhaarStateCode: "",
        uanNo: emp.uan || "",
        pfDed: "",
        esiDed: "",
        lwfDed: "",
        ptaxDed: "",
        clientCode: "",
        unitCode: "",
        deptCode: "",
        designationCode: "",
        empCatCode: "",
        localAdd1: emp.currentAddress || "",
        localAdd2: emp.city ? `${emp.city}, ${emp.state}` : "",
        localPincode: emp.pinCode || "",
        permanentAdd1: emp.permanentAddress || "",
        permanentAdd2: emp.city ? `${emp.city}, ${emp.state}` : "",
        permanentPincode: emp.pinCode || "",
        compId: "",
        error: "",
        additionalCol1: "Processed",
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }
  static async generateEmployeePdf(employeeId: string): Promise<Buffer> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { documents: true },
    });

    if (!employee) throw new Error("Employee not found.");

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        const buffers: Buffer[] = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          resolve(Buffer.concat(buffers));
        });

        // Header
        doc.fontSize(20).text("Employee Profile", { align: "center" });
        doc.moveDown();

        // Status & Code
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text(
            `Employee Code: ${employee.employeeCode || "PENDING ASSIGNMENT"}`,
          )
          .text(`Status: ${employee.status}`);
        doc.moveDown();

        // Helper function for sections
        const addSection = (title: string, data: Record<string, any>) => {
          doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .fillColor("#2563eb")
            .text(title);
          doc.moveDown(0.5);
          doc.fontSize(10).font("Helvetica").fillColor("#000000");

          Object.entries(data).forEach(([key, value]) => {
            doc
              .font("Helvetica-Bold")
              .text(`${key}: `, { continued: true })
              .font("Helvetica")
              .text(`${value || "N/A"}`);
          });
          doc.moveDown();
        };

        addSection("Personal Details", {
          Name: `${employee.firstName} ${employee.surname}`,
          "Father Name": employee.fatherName,
          "Husband Name": employee.husbandName,
          Gender: employee.gender,
          "Blood Group": employee.bloodGroup,
          "Date of Birth": employee.dateOfBirth.toISOString().split("T")[0],
          "Phone Number": employee.mobile,
        });

        addSection("Identity Information", {
          Aadhaar: employee.aadhaar,
          PAN: employee.pan,
          UAN: employee.uan,
          ESIC: employee.esic,
        });

        addSection("Address Details", {
          "Permanent Address": employee.permanentAddress,
          "Current Address": employee.currentAddress,
          City: employee.city,
          State: employee.state,
          "PIN Code": employee.pinCode,
        });

        addSection("Bank Details", {
          "Bank Name": employee.bankName,
          "Account Number": employee.accountNumber,
          "IFSC Code": employee.ifsc,
          Branch: employee.branch,
          "MICR Code": employee.micr,
        });

        addSection("Emergency Contact", {
          Name: employee.emergencyName,
          Relationship: employee.emergencyRelation,
          Phone: employee.emergencyPhone,
        });

        // Documents Section
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .fillColor("#2563eb")
          .text("Uploaded Documents");
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica").fillColor("#000000");

        if (employee.documents.length === 0) {
          doc.text("No documents uploaded.");
        } else {
          employee.documents.forEach((docItem, index) => {
            doc.text(
              `${index + 1}. ${docItem.type} - (${docItem.originalFilename})`,
            );
          });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}