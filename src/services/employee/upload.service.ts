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

    const processedMetadata = await DocumentProcessorService.processSelfie(
      file.buffer,
      file.mimetype,
    );

    // TODO: Upload processedMetadata.buffer to new storage provider

    return employee; // Temporarily return the unmodified employee
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

    const docTypeMap: Record<DocumentType, string> = {
      AADHAAR: "AADHAR",
      PAN: "PAN",
      DRIVING_LICENSE: "DL",
      BANK_PASSBOOK: "PASSBOOK",
      EDUCATION: "EDU_PROOF",
      VOTER_ID: "VOTER_ID",
      DISCHARGE_BOOK: "DISCHARGE",
    };

    const suffix = docTypeMap[type] || type.toString();
    const firstName = employee.firstName
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_");
    const lastName = employee.surname.trim().toUpperCase().replace(/\s+/g, "_");
    const targetFilename = `${firstName}_${lastName}_${suffix}.pdf`;

    const processedMetadata =
      await DocumentProcessorService.generateStandardizedPdf(
        file.buffer,
        file.mimetype,
      );

    // TODO: Upload processedMetadata.buffer to new storage provider

    return await prisma.document.create({
      data: {
        employeeId,
        type,
        originalFilename: targetFilename,
        mimeType: processedMetadata.mimeType,
        fileSize: processedMetadata.size,
      },
    });
  }
}