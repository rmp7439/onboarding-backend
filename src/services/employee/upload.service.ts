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

    // Check if the user already has this exact DocumentType uploaded
    const existingDoc = await prisma.document.findFirst({
      where: { employeeId, type },
    });

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
    
    // Add timestamp to make the filename unique so we don't accidentally overwrite in storage
    const timestamp = Date.now();
    const targetFilename = `${firstName}_${lastName}_${suffix}_${timestamp}.pdf`;

    const processedMetadata =
      await DocumentProcessorService.generateStandardizedPdf(
        file.buffer,
        file.mimetype,
      );

    const storagePath = `employees/${employeeId}/documents/${targetFilename}`;

    // 1. Upload new file safely
    await StorageService.upload(
      processedMetadata.buffer,
      storagePath,
      processedMetadata.mimeType,
    );

    let document: Document;
    const oldFilename = existingDoc?.storedFilename;

    // 2 & 3. Verify upload succeeded, then Update OR Create the database record
    if (existingDoc) {
      document = await prisma.document.update({
        where: { id: existingDoc.id },
        data: {
          storedFilename: storagePath,
          originalFilename: targetFilename,
          mimeType: processedMetadata.mimeType,
          fileSize: processedMetadata.size,
          fileExtension: processedMetadata.extension,
        },
      });
    } else {
      document = await prisma.document.create({
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
    }

    // 4 & 5. Delete old file from storage (record is already updated)
    if (oldFilename && oldFilename !== storagePath) {
      StorageService.delete(oldFilename).catch((err) =>
        logger.error(`Failed to delete old document: ${oldFilename}`, err)
      );
    }

    return document;
  }
}