import { prisma } from "../../config/prisma";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export class ReportService {
  static async exportExcel(filters: {
    code?: string;
    name?: string;
    joiningDate?: string;
  }): Promise<Buffer> {
    const where: any = {};

    if (filters.code) {
      where.employeeCode = {
        contains: filters.code.trim(),
        mode: "insensitive",
      };
    }

    if (filters.name) {
      const nameTrimmed = filters.name.trim();
      const spaceIdx = nameTrimmed.indexOf(" ");

      if (spaceIdx !== -1) {
        // If there's a space, assume they are searching [First Name] [Surname]
        const firstPart = nameTrimmed.slice(0, spaceIdx);
        const secondPart = nameTrimmed.slice(spaceIdx + 1);
        where.AND = [
          { firstName: { contains: firstPart, mode: "insensitive" } },
          { surname: { contains: secondPart, mode: "insensitive" } },
        ];
      } else {
        // If a single word, check if it matches either firstName OR surname
        where.OR = [
          { firstName: { contains: nameTrimmed, mode: "insensitive" } },
          { surname: { contains: nameTrimmed, mode: "insensitive" } },
        ];
      }
    }

    if (filters.joiningDate) {
      // Create exact day boundaries since the frontend sends YYYY-MM-DD
      const dStart = new Date(filters.joiningDate);
      const dEnd = new Date(dStart);
      dEnd.setDate(dEnd.getDate() + 1);

      where.joiningDate = {
        gte: dStart,
        lt: dEnd,
      };
    }

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Employees");

    worksheet.columns = [
      { header: "Employee Code", key: "code", width: 20 },
      { header: "Employee Name", key: "name", width: 30 },
      { header: "Father's Name", key: "fatherName", width: 25 },
      { header: "Mobile Number", key: "mobile", width: 15 },
      { header: "Date of Joining", key: "joiningDate", width: 15 },
      { header: "Unit / Site", key: "unit", width: 20 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Date of Birth", key: "dateOfBirth", width: 15 },
      { header: "Blood Group", key: "bloodGroup", width: 15 },
      { header: "Aadhaar Number", key: "aadhaar", width: 20 },
      { header: "PAN Number", key: "pan", width: 15 },
      { header: "UAN Number", key: "uan", width: 20 },
      { header: "ESIC Number", key: "esic", width: 20 },
      { header: "Bank Name", key: "bankName", width: 25 },
      { header: "Account Number", key: "accountNumber", width: 20 },
      { header: "IFSC Code", key: "ifsc", width: 15 },
      { header: "Branch", key: "branch", width: 20 },
      { header: "MICR Code", key: "micr", width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };

    employees.forEach((emp) => {
      worksheet.addRow({
        code: emp.employeeCode || "",
        name: `${emp.firstName} ${emp.surname}`.trim(),
        fatherName: emp.fatherName || "",
        mobile: emp.mobile || "",
        joiningDate: emp.joiningDate
          ? emp.joiningDate.toISOString().split("T")[0]
          : "",
        unit: "", // Unit is currently not in the DB schema; left blank as per requirements
        gender: emp.gender || "",
        dateOfBirth: emp.dateOfBirth
          ? emp.dateOfBirth.toISOString().split("T")[0]
          : "",
        bloodGroup: emp.bloodGroup || "",
        aadhaar: emp.aadhaar || "",
        pan: emp.pan || "",
        uan: emp.uan || "",
        esic: emp.esic || "",
        bankName: emp.bankName || "",
        accountNumber: emp.accountNumber || "",
        ifsc: emp.ifsc || "",
        branch: emp.branch || "",
        micr: emp.micr || "",
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