import { prisma } from "../../config/prisma";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export interface ReportFilters {
  day?: string;
  month?: string;
  year?: string;
  unit?: string;
  userId?: string;
}

const DOC_TYPES = [
  { type: "AADHAAR", label: "Aadhaar" },
  { type: "PAN", label: "PAN" },
  { type: "DRIVING_LICENSE", label: "Driving License" },
  { type: "BANK_PASSBOOK", label: "Bank Passbook" },
  { type: "EDUCATION", label: "Education" },
  { type: "VOTER_ID", label: "Voter ID" },
  { type: "DISCHARGE_BOOK", label: "Discharge Book" },
];

async function buildReportFilter(filters: ReportFilters) {
  const where: any = {};

  if (filters.year) {
    const year = parseInt(filters.year, 10);
    if (filters.month) {
      const month = parseInt(filters.month, 10) - 1; 
      if (filters.day) {
        const day = parseInt(filters.day, 10);
        where.joiningDate = {
          gte: new Date(year, month, day),
          lt: new Date(year, month, day + 1),
        };
      } else {
        where.joiningDate = {
          gte: new Date(year, month, 1),
          lt: new Date(year, month + 1, 1),
        };
      }
    } else {
      where.joiningDate = {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      };
    }
  }

  if (filters.unit) {
    where.unit = filters.unit;
  } else if (filters.userId) {
    const user = await prisma.user.findUnique({
      where: { id: filters.userId },
      include: { units: { include: { unit: true } } },
    });
    if (user && user.units.length > 0) {
      const userUnits = user.units.map((u) => u.unit.name);
      where.unit = { in: userUnits };
    } else {
      where.unit = { in: [] };
    }
  }

  return where;
}

function renderEmployeeProfileLayout(
  doc: typeof PDFDocument,
  employee: any,
  baseUrl: string,
) {
  doc.fontSize(20).text("Employee Profile", { align: "center" });
  doc.moveDown();

  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text(`Employee Code: ${employee.employeeCode || "PENDING ASSIGNMENT"}`)
    .text(`Status: ${employee.status}`);
  doc.moveDown();

  const addSection = (title: string, data: Record<string, any>) => {
    if (doc.y > doc.page.height - 100) {
      doc.addPage();
    }
    
    doc.fontSize(14).font("Helvetica-Bold").fillColor("#2563eb").text(title);
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica").fillColor("#000000");

    Object.entries(data).forEach(([key, value]) => {
      const text = `${value || "N/A"}`;
      const options = { continued: false, width: doc.page.width - 150 };
      const height = doc.heightOfString(`${key}: ${text}`, options);

      if (doc.y + height > doc.page.height - 50) {
        doc.addPage();
      }

      doc
        .font("Helvetica-Bold")
        .text(`${key}: `, { continued: true })
        .font("Helvetica")
        .text(text, options);
    });
    doc.moveDown();
  };

  const formatEnum = (str: string | null) => {
    if (!str) return "N/A";
    return str.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  addSection("Personal Details", {
    "Name": `${employee.firstName} ${employee.surname}`,
    "Father Name": employee.fatherName,
    "Husband Name": employee.husbandName,
    "Gender": formatEnum(employee.gender),
    "Blood Group": formatEnum(employee.bloodGroup),
    "Marital Status": formatEnum(employee.maritalStatus),
    "Education": formatEnum(employee.education),
    "Date of Birth": employee.dateOfBirth.toISOString().split("T")[0],
    "Phone Number": employee.mobile,
  });

  addSection("Identity Information", {
    "Aadhaar": employee.aadhaar,
    "PAN": employee.pan,
    "UAN": employee.uan,
    "ESIC": employee.esic,
    "Driving Licence": employee.drivingLicence,
  });

  addSection("Address Details", {
    "Permanent Address": employee.permanentAddress,
    "Permanent City": employee.city,
    "Permanent State": employee.state,
    "Permanent PIN Code": employee.pinCode,
    "Police Station": employee.permanentPoliceStation,
    "Current Address": employee.currentAddress,
    "Current City": employee.currentCity,
    "Current State": employee.currentState,
    "Current PIN Code": employee.currentPinCode,
  });

  addSection("Bank Details", {
    "Account Holder Name": employee.accountHolderName,
    "Bank Name": employee.bankName,
    "Account Number": employee.accountNumber,
    "IFSC Code": employee.ifsc,
    "MICR Code": employee.micr,
  });

  addSection("Emergency Contact", {
    "Name": employee.emergencyName,
    "Relationship": employee.emergencyRelation,
    "Phone": employee.emergencyPhone,
  });

  addSection("Nominee Details", {
    "Nominee Name": employee.nomineeName,
    "Relationship": employee.nomineeRelation,
    "Mobile Number": employee.nomineeMobile,
  });

  if (doc.y > doc.page.height - 150) {
    doc.addPage();
  }
  
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor("#2563eb")
    .text("Uploaded Documents");
  doc.moveDown(0.5);

  DOC_TYPES.forEach((dt, index) => {
    if (doc.y > doc.page.height - 50) {
      doc.addPage();
    }
    
    const docItem = employee.documents.find((d: any) => d.type === dt.type);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#000000")
      .text(`${index + 1}. ${dt.label}: `, { continued: true });

    if (docItem) {
      const url = `${baseUrl}/reports/document/${docItem.id}/download`;
      doc.fillColor("#2563eb").text(`View ${dt.label}`, {
        link: url,
        underline: true,
      });
    } else {
      doc.fillColor("#6b7280").text("Not Uploaded", {
        underline: false,
      });
    }
  });
}

export class ReportService {
  static async getFilteredEmployees(filters: ReportFilters) {
    const where = await buildReportFilter(filters);

    return prisma.employee.findMany({
      where,
      orderBy: { joiningDate: "desc" },
      select: {
        id: true,
        firstName: true,
        surname: true,
        employeeCode: true,
        joiningDate: true,
        documents: { select: { id: true, type: true } },
      },
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
        documents: { select: { id: true, type: true } },
      },
    });
    if (!employee) throw new Error("Employee not found in reports database.");
    return employee;
  }

  static async exportExcel(
    filters: ReportFilters,
    baseUrl: string,
    dynamicColumns: { header: string; key: string; width?: number }[] = [
      { header: "ADDITIONAL COLUMN 1", key: "additionalCol1", width: 25 },
    ],
  ): Promise<Buffer> {
    const where = await buildReportFilter(filters);
    const employees = await prisma.employee.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
      include: { documents: true },
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
      { header: "HIGHEST EDUCATION", key: "education", width: 20 },
      { header: "MARITAL STATUS", key: "maritalStatus", width: 15 },
      { header: "MOBILE", key: "mobile", width: 15 },
      { header: "JOB TYPE", key: "jobType", width: 15 },
      { header: "A/C HOLDER NAME", key: "accountHolderName", width: 30 },
      { header: "BANK NAME", key: "bankName", width: 30 },
      { header: "PAY MODE", key: "payMode", width: 15 },
      { header: "ACCOUNT NO", key: "accountNo", width: 20 },
      { header: "IFSC CODE", key: "ifscCode", width: 15 },
      { header: "MICR CODE", key: "micrCode", width: 15 },
      { header: "WEEKLY OFF", key: "weeklyOff", width: 15 },
      { header: "AADHAAR NO", key: "aadhaarNo", width: 20 },
      { header: "PF NUMBER", key: "pfNumber", width: 20 },
      { header: "ESI NO", key: "esiNo", width: 20 },
      { header: "PAN NO", key: "panNo", width: 15 },
      { header: "DRIVING LICENCE", key: "drivingLicence", width: 20 },
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
      { header: "CURR_STATE", key: "currState", width: 20 },
      { header: "CURR_CITY", key: "currCity", width: 20 },
      { header: "CURR_PINCODE", key: "currPincode", width: 15 },
      { header: "PermanentAdd1", key: "permanentAdd1", width: 25 },
      { header: "PERM_STATE", key: "permState", width: 20 },
      { header: "PERM_CITY", key: "permCity", width: 20 },
      { header: "PERM_PINCODE", key: "permPincode", width: 15 },
      { header: "PoliceStation", key: "policeStation", width: 20 },
      { header: "NOMINEE NAME", key: "nomineeName", width: 25 },
      { header: "NOMINEE RELATION", key: "nomineeRelation", width: 20 },
      { header: "NOMINEE MOBILE", key: "nomineeMobile", width: 15 },
      { header: "CompID", key: "compId", width: 15 },
      { header: "Error", key: "error", width: 10 },
      { header: "Nominee Name", key: "appNomineeName", width: 25 },
      { header: "Nominee Relationship", key: "appNomineeRelation", width: 20 },
      { header: "Nominee DOB", key: "nomineeDob", width: 15 },
      { header: "Nominee Mobile Number", key: "appNomineeMobile", width: 20 },
      { header: "Police Station", key: "appPoliceStation", width: 20 },
      { header: "Police Station Address", key: "policeStationAddress", width: 25 },
      { header: "Husband Name", key: "husbandName", width: 20 },
      { header: "Blood Group", key: "bloodGroup", width: 15 },
      { header: "Emergency Name", key: "emergencyName", width: 25 },
      { header: "Emergency Relation", key: "emergencyRelation", width: 20 },
      { header: "Emergency Phone", key: "emergencyPhone", width: 15 },
      { header: "Unit", key: "unit", width: 15 },
      { header: "Reject Reason", key: "rejectReason", width: 25 },
      { header: "Correction Remark", key: "correctionRemark", width: 25 },
      { header: "Uploaded At", key: "uploadedAt", width: 20 },
      { header: "Updated At", key: "updatedAt", width: 20 },
    ];

    const documentColumns = DOC_TYPES.map((dt) => ({
      header: `${dt.label.toUpperCase()} DOC`,
      key: `doc_${dt.type}`,
      width: 25,
    }));

    worksheet.columns = [...baseColumns, ...dynamicColumns, ...documentColumns];
    worksheet.getRow(1).font = { bold: true };

    const getDocHyperlink = (docs: any[], type: string, label: string) => {
      const doc = docs.find((d) => d.type === type);
      if (doc) {
        return {
          text: `View ${label}`,
          hyperlink: `${baseUrl}/reports/document/${doc.id}/download`,
        };
      }
      return "Not Uploaded";
    };

    employees.forEach((emp) => {
      const rowData: any = {
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
        education: emp.education || "",
        maritalStatus: emp.maritalStatus || "",
        mobile: emp.mobile || "",
        jobType: "",
        accountHolderName: emp.accountHolderName || "",
        bankName: emp.bankName || "",
        payMode: "",
        accountNo: emp.accountNumber || "",
        ifscCode: emp.ifsc || "",
        micrCode: emp.micr || "",
        weeklyOff: "",
        aadhaarNo: emp.aadhaar || "",
        pfNumber: "",
        esiNo: emp.esic || "",
        panNo: emp.pan || "",
        drivingLicence: emp.drivingLicence || "",
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
        currState: emp.currentState || "",
        currCity: emp.currentCity || "",
        currPincode: emp.currentPinCode || "",
        permanentAdd1: emp.permanentAddress || "",
        permState: emp.state || "",
        permCity: emp.city || "",
        permPincode: emp.pinCode || "",
        policeStation: emp.permanentPoliceStation || "",
        nomineeName: emp.nomineeName || "",
        nomineeRelation: emp.nomineeRelation || "",
        nomineeMobile: emp.nomineeMobile || "",
        compId: "",
        error: "",
        appNomineeName: emp.nomineeName || "",
        appNomineeRelation: emp.nomineeRelation || "",
        nomineeDob: "", 
        appNomineeMobile: emp.nomineeMobile || "",
        appPoliceStation: emp.permanentPoliceStation || "",
        policeStationAddress: "", 
        husbandName: emp.husbandName || "",
        bloodGroup: emp.bloodGroup ? emp.bloodGroup.replace(/_/g, ' ') : "",
        emergencyName: emp.emergencyName || "",
        emergencyRelation: emp.emergencyRelation || "",
        emergencyPhone: emp.emergencyPhone || "",
        unit: emp.unit || "",
        rejectReason: emp.rejectReason || "",
        correctionRemark: emp.correctionRemark || "",
        uploadedAt: emp.uploadedAt ? emp.uploadedAt.toISOString() : "",
        updatedAt: emp.updatedAt ? emp.updatedAt.toISOString() : "",
        additionalCol1: "Processed",
      };

      DOC_TYPES.forEach((dt) => {
        rowData[`doc_${dt.type}`] = getDocHyperlink(
          emp.documents,
          dt.type,
          dt.label,
        );
      });

      worksheet.addRow(rowData);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }

  static async generateEmployeePdf(
    employeeId: string,
    baseUrl: string,
  ): Promise<Buffer> {
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
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        renderEmployeeProfileLayout(doc, employee, baseUrl);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  static async generateBulkPdf(
    filters: ReportFilters,
    baseUrl: string,
  ): Promise<Buffer> {
    const where = await buildReportFilter(filters);

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { joiningDate: "desc" },
      include: { documents: true },
    });

    if (!employees.length)
      throw new Error("No employees found for the selected filters.");

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        const buffers: Buffer[] = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        employees.forEach((employee, index) => {
          if (index > 0) doc.addPage();
          renderEmployeeProfileLayout(doc, employee, baseUrl);
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}