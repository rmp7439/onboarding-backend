import { prisma } from '../../config/prisma';
import { DocumentType, Employee, Document } from '@prisma/client';
import { DocumentProcessorService } from '../processing/document-processor.service';

export class UploadService {
  
  static async saveSelfie(employeeId: string, file: Express.Multer.File): Promise<Employee> {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new Error('Employee not found.');

    // Process the image (converts PNG/JPEG to JPG)
    const processedMetadata = await DocumentProcessorService.processImage(
      file.path, 
      file.filename, 
      file.mimetype
    );

    return prisma.employee.update({
      where: { id: employeeId },
      data: {
        selfieFilename: processedMetadata.filename,
        selfieMimeType: processedMetadata.mimeType,
        selfieSize: processedMetadata.size,
      }
    });
  }

  static async saveDocument(
    employeeId: string, 
    type: DocumentType, 
    file: Express.Multer.File
  ): Promise<Document> {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new Error('Employee not found.');

    const isImage = file.mimetype.startsWith('image/');
    let processedMetadata;

    if (isImage) {
      // Processes image documents (like a photo of an Aadhaar card) to JPG
      processedMetadata = await DocumentProcessorService.processImage(file.path, file.filename, file.mimetype);
    } else if (file.mimetype === 'application/pdf') {
      // Passes PDFs through unmodified
      processedMetadata = await DocumentProcessorService.processDocument(file.path, file.filename, file.mimetype);
    } else {
      throw new Error('Unsupported document format. Only images and PDFs are allowed.');
    }

    return prisma.document.create({
      data: {
        employeeId,
        type,
        storedFilename: processedMetadata.filename,
        originalFilename: file.originalname,
        mimeType: processedMetadata.mimeType,
        fileSize: processedMetadata.size,
        fileExtension: processedMetadata.extension
      }
    });
  }
}