import { prisma } from "../../config/prisma";
import { DocumentType, Employee, Document } from "@prisma/client";
import { DocumentProcessorService } from "../processing/document-processor.service";
import cloudinary from "../../config/cloudinary";
import { cleanupFile } from "../../utils/fileCleanup";
import path from "path";

export class UploadService {
  static async saveSelfie(
    employeeId: string,
    file: Express.Multer.File,
  ): Promise<Employee> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) throw new Error("Employee not found.");

    // 1. Process local image (crop & format)
    const processedMetadata = await DocumentProcessorService.processSelfie(
      file.path,
      file.filename,
      file.mimetype,
    );

    const localProcessedPath = path.join(
      __dirname,
      "../../../uploads/jpg",
      processedMetadata.filename,
    );

    try {
      // 2. Upload to Cloudinary
      const cloudinaryResult = await cloudinary.uploader.upload(
        localProcessedPath,
        {
          folder: "employee_selfies",
          public_id: `selfie_${employeeId}_${Date.now()}`,
        },
      );

      // 3. Update Database
      const updatedEmployee = await prisma.employee.update({
        where: { id: employeeId },
        data: {
          selfieFilename: null, // Actively remove legacy dependency for new uploads
          selfieMimeType: processedMetadata.mimeType,
          selfieSize: processedMetadata.size,
          selfieCloudinaryUrl: cloudinaryResult.secure_url,
          selfieCloudinaryId: cloudinaryResult.public_id,
        },
      });

      // 4. Safely and asynchronously clean up the local temp processed file
      cleanupFile(localProcessedPath);
      cleanupFile(file.path);

      return updatedEmployee;
    } catch (error) {
      // Safely and asynchronously clean up on failure before throwing
      cleanupFile(localProcessedPath);
      cleanupFile(file.path);

      throw new Error("Failed to upload profile image to Cloudinary.");
    }
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
        file.path,
        targetFilename,
        file.mimetype,
      );

    const localProcessedPath = path.join(
      __dirname,
      "../../../uploads/pdf",
      processedMetadata.filename,
    );

    try {
      const cloudinaryResult = await cloudinary.uploader.upload(
        localProcessedPath,
        {
          folder: "employee_documents",
          public_id: `doc_${employeeId}_${type}_${Date.now()}`,
        },
      );

      const document = await prisma.document.create({
        data: {
          employeeId,
          type,
          storedFilename: processedMetadata.filename,
          originalFilename: targetFilename,
          mimeType: processedMetadata.mimeType,
          fileSize: processedMetadata.size,
          fileExtension: processedMetadata.extension,

          cloudinaryUrl: cloudinaryResult.secure_url,
          cloudinaryPublicId: cloudinaryResult.public_id,
        },
      });

      cleanupFile(localProcessedPath);
      cleanupFile(file.path);

      return document;
    } catch (error) {
      cleanupFile(localProcessedPath);
      cleanupFile(file.path);

      throw new Error("Failed to upload document to Cloudinary.");
    }
  }
}