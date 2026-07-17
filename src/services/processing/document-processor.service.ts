import sharp from 'sharp';
import PDFDocument from 'pdfkit';

export class DocumentProcessorService {
  static async processSelfie(imageBuffer: Buffer, mimeType: string) {
    if (mimeType === 'image/heic' || mimeType === 'image/heif') {
      throw new Error('HEIC processing is not yet supported in Version 1.');
    }

    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 280;
    const height = metadata.height || 380;
    const size = Math.min(width, height); 

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

    const buffer = await sharp(imageBuffer)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .composite([{ input: overlaySvg, blend: 'over' }])
      .jpeg({ quality: 90 }) 
      .toBuffer();

    return { buffer, mimeType: 'image/jpeg', size: buffer.length };
  }

  static async generateStandardizedPdf(fileBuffer: Buffer, mimeType: string): Promise<any> {
    if (mimeType.startsWith('image/')) {
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 0, size: 'A4' });
        const buffers: Buffer[] = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve({ buffer: pdfBuffer, mimeType: 'application/pdf', size: pdfBuffer.length });
        });
        doc.on('error', reject);
        
        doc.image(fileBuffer, 0, 0, { fit: [595.28, 841.89], align: 'center', valign: 'center' });
        doc.end();
      });
    } else if (mimeType === 'application/pdf') {
      return { buffer: fileBuffer, mimeType: 'application/pdf', size: fileBuffer.length };
    } else {
      throw new Error('Unsupported document format. Only images and PDFs are allowed.');
    }
  }
}