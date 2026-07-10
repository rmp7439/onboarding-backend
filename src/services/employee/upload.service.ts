import { prisma } from "../../config/prisma";
import { DocumentType, Employee, Document } from "@prisma/client";
import { DocumentProcessorService } from "../processing/document-processor.service";

export class UploadService {
  static async saveSelfie(
    employeeId: string,
    file: Express.Multer.File,
  ): Promise<Employee> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) throw new Error("Employee not found.");

    // Process the image (converts PNG/JPEG to JPG)
    const processedMetadata = await DocumentProcessorService.processImage(
      file.path,
      file.filename,
      file.mimetype,
    );

    return prisma.employee.update({
      where: { id: employeeId },
      data: {
        selfieFilename: processedMetadata.filename,
        selfieMimeType: processedMetadata.mimeType,
        selfieSize: processedMetadata.size,
      },
    });
  }

  static async saveDocument(
    employeeId: string,
    type: DocumentType,
    file: Express.Multer.File,
  ): Promise<Document> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) throw new Error("Employee not found.");

    // Map Prisma DocumentType enums to the requested filename abbreviations
    const docTypeMap: Record<DocumentType, string> = {
      AADHAAR: "AADHAR",
      PAN: "PAN",
      DRIVING_LICENSE: "DL",
      BANK_PASSBOOK: "PASSBOOK",
      EDUCATION: "EDUCATION",
      VOTER_ID: "VOTER_ID",
      DISCHARGE_BOOK: "DISCHARGE",
    };

    // Sanitize names and construct the target filename
    const typeSuffix = docTypeMap[type] || type.toString();
    const firstName = employee.firstName
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_");
    const lastName = employee.surname.trim().toUpperCase().replace(/\s+/g, "_");
    const targetFilename = `${firstName}_${lastName}_${typeSuffix}.pdf`;

    // Process the upload (Image or PDF) into a standardized PDF
    const processedMetadata =
      await DocumentProcessorService.generateStandardizedPdf(
        file.path,
        targetFilename,
        file.mimetype,
      );

    // Save the new PDF metadata to the database
    return prisma.document.create({
      data: {
        employeeId,
        type,
        storedFilename: processedMetadata.filename,
        originalFilename: file.originalname,
        mimeType: processedMetadata.mimeType,
        fileSize: processedMetadata.size,
        fileExtension: processedMetadata.extension,
      },
    });
  }
}