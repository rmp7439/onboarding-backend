import path from "path";
import fs from "fs/promises";
import { createWriteStream } from "fs";
import sharp from "sharp";
import PDFDocument from "pdfkit";

export class DocumentProcessorService {
  private static readonly JPG_DIR = path.join(
    __dirname,
    "../../../uploads/jpg",
  );
  private static readonly PDF_DIR = path.join(
    __dirname,
    "../../../uploads/pdf",
  );

  static async initDirectories() {
    await fs.mkdir(this.JPG_DIR, { recursive: true });
    await fs.mkdir(this.PDF_DIR, { recursive: true });
  }

  /**
   * Processes an image, converting it to a standardized JPG.
   * Built modularly to support HEIC conversion in future versions.
   */
  static async processImage(
    originalPath: string,
    filename: string,
    mimeType: string,
  ) {
    await this.initDirectories();
    const baseName = path.parse(filename).name;
    const jpgFilename = `${baseName}.jpg`;
    const jpgPath = path.join(this.JPG_DIR, jpgFilename);

    // V2 Placeholder: Handle HEIC conversion here before passing to Sharp
    if (mimeType === "image/heic" || mimeType === "image/heif") {
      throw new Error("HEIC processing is not yet supported in Version 1.");
    }

    const imageBuffer = await fs.readFile(originalPath);

    // Convert PNG/JPEG to a standardized JPG format using Sharp
    await sharp(imageBuffer).jpeg({ quality: 80 }).toFile(jpgPath);

    const stat = await fs.stat(jpgPath);

    return {
      filename: jpgFilename,
      mimeType: "image/jpeg",
      size: stat.size,
      extension: ".jpg",
    };
  }

  /**
   * Generates a standardized PDF from an image or PDF upload.
   * The original file in uploads/originals remains untouched.
   */
  static async generateStandardizedPdf(
    originalPath: string,
    targetFilename: string,
    mimeType: string,
  ): Promise<any> {
    await this.initDirectories();
    const pdfPath = path.join(this.PDF_DIR, targetFilename);

    if (mimeType.startsWith("image/")) {
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 0, size: "A4" });
        const stream = createWriteStream(pdfPath);

        doc.pipe(stream);

        // A4 size is 595.28 x 841.89 points. Center the image.
        doc.image(originalPath, 0, 0, {
          fit: [595.28, 841.89],
          align: "center",
          valign: "center",
        });

        doc.end();

        stream.on("finish", async () => {
          try {
            const stat = await fs.stat(pdfPath);
            resolve({
              filename: targetFilename,
              mimeType: "application/pdf",
              size: stat.size,
              extension: ".pdf",
            });
          } catch (err) {
            reject(err);
          }
        });

        stream.on("error", reject);
      });
    } else if (mimeType === "application/pdf") {
      // If it's already a PDF, just copy it and rename it
      await fs.copyFile(originalPath, pdfPath);
      const stat = await fs.stat(pdfPath);

      return {
        filename: targetFilename,
        mimeType: "application/pdf",
        size: stat.size,
        extension: ".pdf",
      };
    } else {
      throw new Error(
        "Unsupported document format. Only images and PDFs are allowed.",
      );
    }
  }
}