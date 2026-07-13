import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import sharp from 'sharp';
import PDFDocument from 'pdfkit';

export class DocumentProcessorService {
  private static readonly JPG_DIR = path.join(__dirname, '../../../uploads/jpg');
  private static readonly PDF_DIR = path.join(__dirname, '../../../uploads/pdf');

  static async initDirectories() {
    await fs.mkdir(this.JPG_DIR, { recursive: true });
    await fs.mkdir(this.PDF_DIR, { recursive: true });
  }

  /**
   * Processes an image, converting it to a standardized JPG.
   * (Maintained for generic image processing)
   */
  static async processImage(originalPath: string, filename: string, mimeType: string) {
    await this.initDirectories();
    const baseName = path.parse(filename).name;
    const jpgFilename = `${baseName}.jpg`;
    const jpgPath = path.join(this.JPG_DIR, jpgFilename);

    if (mimeType === 'image/heic' || mimeType === 'image/heif') {
      throw new Error('HEIC processing is not yet supported in Version 1.');
    }

    const imageBuffer = await fs.readFile(originalPath);

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
   * Processes a selfie: crops to a square center, applies a solid white 
   * frame over the corners to mask it to a circle, and outputs a JPEG.
   */
  static async processSelfie(originalPath: string, filename: string, mimeType: string) {
    await this.initDirectories();
    const baseName = path.parse(filename).name;
    const jpgFilename = `${baseName}.jpg`;
    const jpgPath = path.join(this.JPG_DIR, jpgFilename);

    if (mimeType === 'image/heic' || mimeType === 'image/heif') {
      throw new Error('HEIC processing is not yet supported in Version 1.');
    }

    const imageBuffer = await fs.readFile(originalPath);
    const metadata = await sharp(imageBuffer).metadata();
    
    // Use the minimum dimension to extract a perfect square from the center.
    const width = metadata.width || 280;
    const height = metadata.height || 380;
    const size = Math.min(width, height); 

    // Create an SVG overlay. It is a solid white square with a transparent 
    // circular hole punched out of the center.
    const overlaySvg = Buffer.from(
      `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="circle-hole">
            <rect width="100%" height="100%" fill="white" />
            <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="#FFFFFF" mask="url(#circle-hole)" />
      </svg>`
    );

    await sharp(imageBuffer)
      // 1. Crop the original image to a centered square
      .resize(size, size, { fit: 'cover', position: 'center' })
      // 2. Draw the white SVG frame over the image
      .composite([{ input: overlaySvg, blend: 'over' }])
      // 3. Compress and save as a high-quality JPEG
      .jpeg({ quality: 90 }) 
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
   * Generates a standardized PDF from an image or PDF upload.
   */
  static async generateStandardizedPdf(originalPath: string, targetFilename: string, mimeType: string): Promise<any> {
    await this.initDirectories();
    const pdfPath = path.join(this.PDF_DIR, targetFilename);

    if (mimeType.startsWith('image/')) {
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 0, size: 'A4' });
        const stream = createWriteStream(pdfPath);
        
        doc.pipe(stream);
        
        doc.image(originalPath, 0, 0, {
          fit: [595.28, 841.89],
          align: 'center',
          valign: 'center'
        });
        
        doc.end();

        stream.on('finish', async () => {
          try {
            const stat = await fs.stat(pdfPath);
            resolve({
              filename: targetFilename,
              mimeType: 'application/pdf', 
              size: stat.size,
              extension: '.pdf'
            });
          } catch (err) {
            reject(err);
          }
        });
        
        stream.on('error', reject);
      });
    } else if (mimeType === 'application/pdf') {
      await fs.copyFile(originalPath, pdfPath);
      const stat = await fs.stat(pdfPath);
      
      return {
        filename: targetFilename,
        mimeType: 'application/pdf',
        size: stat.size,
        extension: '.pdf'
      };
    } else {
      throw new Error('Unsupported document format. Only images and PDFs are allowed.');
    }
  }
}