import { prisma } from '../../config/prisma';
import { DocumentType, Employee, Document } from '@prisma/client';
import path from 'path';

export class UploadService {
  /**
   * Saves selfie metadata directly to the Employee record.
   */
  static async saveSelfie(employeeId: string, file: Express.Multer.File): Promise<Employee> {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new Error('Employee not found.');

    return prisma.employee.update({
      where: { id: employeeId },
      data: {
        selfieFilename: file.filename,
        selfieMimeType: file.mimetype,
        selfieSize: file.size,
      }
    });
  }

  /**
   * Saves document metadata (Aadhaar, PAN, etc.) to the Document table.
   */
  static async saveDocument(
    employeeId: string, 
    type: DocumentType, 
    file: Express.Multer.File
  ): Promise<Document> {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new Error('Employee not found.');

    return prisma.document.create({
      data: {
        employeeId,
        type,
        storedFilename: file.filename,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        fileExtension: path.extname(file.originalname)
      }
    });
  }
}