import { prisma } from '../../config/prisma';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export class ReportService {
  static async exportExcel(filters: any): Promise<Buffer> {
    const where: any = {};

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { employeeCode: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.startDate || filters.endDate) {
      where.joiningDate = {};
      if (filters.startDate) where.joiningDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.joiningDate.lte = new Date(filters.endDate);
    }

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { uploadedAt: 'desc' }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Employees');

    worksheet.columns = [
      { header: 'Employee Code', key: 'code', width: 20 },
      { header: 'Employee Name', key: 'name', width: 30 },
      { header: 'Unit', key: 'unit', width: 20 },
      { header: 'Phone Number', key: 'phone', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Joining Date', key: 'joiningDate', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    employees.forEach((emp) => {
      worksheet.addRow({
        code: emp.employeeCode || 'PENDING',
        name: `${emp.firstName} ${emp.surname}`,
        unit: 'N/A',
        phone: emp.mobile,
        status: emp.status,
        joiningDate: emp.joiningDate.toISOString().split('T')[0]
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return Buffer.from(buffer as ArrayBuffer);
  }

  static async generateEmployeePdf(employeeId: string): Promise<Buffer> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { documents: true }
    });

    if (!employee) throw new Error('Employee not found.');

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });

        // Header
        doc.fontSize(20).text('Employee Profile', { align: 'center' });
        doc.moveDown();
        
        // Status & Code
        doc.fontSize(12).font('Helvetica-Bold')
           .text(`Employee Code: ${employee.employeeCode || 'PENDING ASSIGNMENT'}`)
           .text(`Status: ${employee.status}`);
        doc.moveDown();

        // Helper function for sections
        const addSection = (title: string, data: Record<string, any>) => {
          doc.fontSize(14).font('Helvetica-Bold').fillColor('#2563eb').text(title);
          doc.moveDown(0.5);
          doc.fontSize(10).font('Helvetica').fillColor('#000000');
          
          Object.entries(data).forEach(([key, value]) => {
            doc.font('Helvetica-Bold').text(`${key}: `, { continued: true })
               .font('Helvetica').text(`${value || 'N/A'}`);
          });
          doc.moveDown();
        };

        addSection('Personal Details', {
          'Name': `${employee.firstName} ${employee.surname}`,
          'Father Name': employee.fatherName,
          'Husband Name': employee.husbandName,
          'Gender': employee.gender,
          'Blood Group': employee.bloodGroup,
          'Date of Birth': employee.dateOfBirth.toISOString().split('T')[0],
          'Phone Number': employee.mobile
        });

        addSection('Identity Information', {
          'Aadhaar': employee.aadhaar,
          'PAN': employee.pan,
          'UAN': employee.uan,
          'ESIC': employee.esic
        });

        addSection('Address Details', {
          'Permanent Address': employee.permanentAddress,
          'Current Address': employee.currentAddress,
          'City': employee.city,
          'State': employee.state,
          'PIN Code': employee.pinCode
        });

        addSection('Bank Details', {
          'Bank Name': employee.bankName,
          'Account Number': employee.accountNumber,
          'IFSC Code': employee.ifsc,
          'Branch': employee.branch,
          'MICR Code': employee.micr
        });

        addSection('Emergency Contact', {
          'Name': employee.emergencyName,
          'Relationship': employee.emergencyRelation,
          'Phone': employee.emergencyPhone
        });

        // Documents Section
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#2563eb').text('Uploaded Documents');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').fillColor('#000000');
        
        if (employee.documents.length === 0) {
          doc.text('No documents uploaded.');
        } else {
          employee.documents.forEach((docItem, index) => {
            doc.text(`${index + 1}. ${docItem.type} - (${docItem.originalFilename})`);
          });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}