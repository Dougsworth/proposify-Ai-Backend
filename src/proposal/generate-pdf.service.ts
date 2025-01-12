import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class GeneratePdfService {
  async createPdf(data: any): Promise<Buffer> {
    const doc = new PDFDocument();
    const buffers: any[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    doc.fontSize(20).text(data.title, { align: 'center' });
    data.sections.forEach((section: any) => {
      doc.fontSize(16).text(section.title, { underline: true });
      doc.fontSize(12).text(section.content);
      doc.moveDown();
    });

    doc.end();

    return Buffer.concat(buffers);
  }
}
