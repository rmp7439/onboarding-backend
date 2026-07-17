import { prisma } from "../../config/prisma";
import { DocumentType, Employee, Document } from "@prisma/client";
import { DocumentProcessorService } from "../processing/document-processor.service";
import cloudinary from "../../config/cloudinary";

const uploadToCloudinary = (buffer: Buffer, options: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    stream.end(buffer);
  });
};

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

    try {
      const cloudinaryResult = await uploadToCloudinary(
        processedMetadata.buffer,
        {
          folder: "employee_selfies",
          public_id: `selfie_${employeeId}_${Date.now()}`,
        },
      );

      return await prisma.employee.update({
        where: { id: employeeId },
        data: {
          selfieCloudinaryUrl: cloudinaryResult.secure_url,
          selfieCloudinaryId: cloudinaryResult.public_id,
        },
      });
    } catch (error) {
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
        file.buffer,
        file.mimetype,
      );

    try {
      const cloudinaryResult = await uploadToCloudinary(
        processedMetadata.buffer,
        {
          resource_type: "raw",
          folder: "employee_documents",
          public_id: `doc_${employeeId}_${type}_${Date.now()}`,
        },
      );

      return await prisma.document.create({
        data: {
          employeeId,
          type,
          originalFilename: targetFilename,
          mimeType: processedMetadata.mimeType,
          fileSize: processedMetadata.size,
          cloudinaryUrl: cloudinaryResult.secure_url,
          cloudinaryPublicId: cloudinaryResult.public_id,

          storedFilename: cloudinaryResult.public_id,
          fileExtension: ".pdf",
        },
      });
    } catch (error) {
      console.error("========== REAL ERROR ==========");
      console.error(error);

      if (error instanceof Error) {
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
      }

      throw error;
    }
  }
}