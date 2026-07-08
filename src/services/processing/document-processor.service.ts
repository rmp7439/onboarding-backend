import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

export class DocumentProcessorService {
  private static readonly JPG_DIR = path.join(__dirname, '../../../uploads/jpg');
  private static readonly PDF_DIR = path.join(__dirname, '../../../uploads/pdf');

  static async initDirectories() {
    await fs.mkdir(this.JPG_DIR, { recursive: true });
    await fs.mkdir(this.PDF_DIR, { recursive: true });
  }

  /**
   * Processes an image, converting it to a standardized JPG.
   * Built modularly to support HEIC conversion in future versions.
   */
  static async processImage(originalPath: string, filename: string, mimeType: string) {
    await this.initDirectories();
    const baseName = path.parse(filename).name;
    const jpgFilename = `${baseName}.jpg`;
    const jpgPath = path.join(this.JPG_DIR, jpgFilename);

    // V2 Placeholder: Handle HEIC conversion here before passing to Sharp
    if (mimeType === 'image/heic' || mimeType === 'image/heif') {
      throw new Error('HEIC processing is not yet supported in Version 1.');
    }

    const imageBuffer = await fs.readFile(originalPath);

    // Convert PNG/JPEG to a standardized JPG format using Sharp
    await sharp(imageBuffer)
      .jpeg({ quality: 80 })
      .toFile(jpgPath);

    const stat = await fs.stat(jpgPath);

    return {
      filename: jpgFilename,
      mimeType: 'image/jpeg',
      size: stat.size,
      extension: '.jpg'
    };
  }

  /**
   * Processes a document. In Version 1, PDFs are stored unmodified.
   * Built modularly to support DOC/DOCX -> PDF conversion in future versions.
   */
  static async processDocument(originalPath: string, filename: string, mimeType: string) {
    await this.initDirectories();

    if (mimeType === 'application/pdf') {
      // V1: Store unmodified PDFs in a structured directory
      const pdfPath = path.join(this.PDF_DIR, filename);
      await fs.copyFile(originalPath, pdfPath);
      const stat = await fs.stat(pdfPath);
      
      return {
        filename: filename,
        mimeType: 'application/pdf',
        size: stat.size,
        extension: path.extname(filename)
      };
    }

    // V2 Placeholder: Handle DOC/DOCX to PDF conversion here
    throw new Error('Document conversion (DOC/DOCX) is not yet supported in Version 1.');
  }
}