import { prisma } from "../../config/prisma";
import { DocumentType, Employee, Document } from "@prisma/client";
import { DocumentProcessorService } from "../processing/document-processor.service";
import { StorageService } from "../storage/storage.service";
import { logger } from "../../utils/logger";

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

    // Grab the old filename before we overwrite the record
    const oldFilename = employee.selfieFilename;
    const timestamp = Date.now();
    const storagePath = `employees/${employeeId}/selfie_${timestamp}.jpg`;

    // 1. Upload new file (fails safely without touching the DB or old file)
    await StorageService.upload(
      processedMetadata.buffer,
      storagePath,
      processedMetadata.mimeType,
    );

    // 2 & 3. Verify upload succeeded and update database
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        selfieFilename: storagePath,
        selfieMimeType: processedMetadata.mimeType,
        selfieSize: processedMetadata.size,
      },
    });

    // 4. Safely clean up old file from storage (fire and forget to not block the response)
    if (oldFilename && oldFilename !== storagePath) {
      StorageService.delete(oldFilename).catch((err) =>
        logger.error(`Failed to delete old selfie: ${oldFilename}`, err)
      );
    }

    return updatedEmployee;
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

    // FIX: Removed the `findFirst` check that was overwriting existing pages.
    // Every uploaded image is now appended as a new, sequential database record.

    const docTypeMap: Record<DocumentType, string> = {
      AADHAAR: "AADHAR", PAN: "PAN", DRIVING_LICENSE: "DL",
      BANK_PASSBOOK: "PASSBOOK", EDUCATION: "EDU_PROOF",
      VOTER_ID: "VOTER_ID", DISCHARGE_BOOK: "DISCHARGE",
    };

    const suffix = docTypeMap[type] || type.toString();
    const firstName = employee.firstName.trim().toUpperCase().replace(/\s+/g, "_");
    const lastName = employee.surname.trim().toUpperCase().replace(/\s+/g, "_");
    
    // Use timestamp + random string to prevent filename collisions on rapid sequential uploads
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const targetFilename = `${firstName}_${lastName}_${suffix}_${timestamp}_${randomStr}.pdf`;

    // EXIF rotation, A4 scaling, and aspect-ratio preservation are already handled here by PDFKit[cite: 2]
    const processedMetadata = await DocumentProcessorService.generateStandardizedPdf(
      file.buffer,
      file.mimetype,
    );

    const storagePath = `employees/${employeeId}/documents/${targetFilename}`;

    await StorageService.upload(
      processedMetadata.buffer,
      storagePath,
      processedMetadata.mimeType,
    );

    // FIX: Always create a new record to preserve multi-page integrity
    const document = await prisma.document.create({
      data: {
        employeeId,
        type,
        storedFilename: storagePath,
        originalFilename: targetFilename,
        mimeType: processedMetadata.mimeType,
        fileSize: processedMetadata.size,
        fileExtension: processedMetadata.extension,
      },
    });

    return document;
  }
}