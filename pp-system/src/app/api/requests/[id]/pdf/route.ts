import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

type Params = { params: { id: string } };

async function getPDFKit() {
  // Force using the CommonJS build to avoid ESM helper issues with fontkit
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const PDFDocument = require('pdfkit/js/pdfkit'); // explicit CJS entry
  return PDFDocument as typeof import('pdfkit');
}

function docToBuffer(doc: any) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const id = Number(params.id);
  if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const request = await prisma.purchaseRequest.findUnique({
    where: { id },
    include: {
      requester: true,
      department: true,
      items: true,
      approvals: {
        include: { approver: true },
        orderBy: { createdAt: 'asc' },
      },
      suggestedVendor: true,
      chosenVendor: true,
    },
  });

  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const PDFDocument = await getPDFKit();
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  doc.fontSize(12).text('PT TunS Esta Indonesia Tbk', { align: 'left' });
  doc.moveDown(0.3);
  doc.fontSize(10).text(`Departemen: ${request.department.name}`, { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(14).text('PERMINTAAN PEMBELIAN', { align: 'center' });
  doc.moveDown(0.5);

  doc.fontSize(10);
  doc.text(`No. PP: ${request.number}`);
  doc.text(`Tanggal: ${request.createdAt.toISOString().slice(0, 10)}`);
  doc.text(`Pemohon: ${request.requester.name}`);
  doc.text(`Tujuan: ${request.purpose ?? '-'}`);
  doc.moveDown();

  doc.text('Detail Barang/Jasa:', { underline: true });
  doc.moveDown(0.3);

  doc.fontSize(10);
  doc.text('No   Deskripsi                 Qty   Satuan    Harga Satuan    Harga Total', {
    continued: false,
  });
  doc.moveDown(0.2);

  request.items.forEach((item, idx) => {
    const total = (item.estimatedUnitPrice ?? 0) * item.quantity;
    doc.text(
      `${idx + 1}    ${item.description}${item.remarks ? ` (${item.remarks})` : ''}    ${item.quantity}    ${item.unit}    ${item.estimatedUnitPrice ?? 0
      }    ${total}`
    );
  });

  doc.moveDown();
  doc.text(`Total Estimasi: ${request.totalEstimatedAmount ?? 0}`);
  if (request.chosenVendor) {
    doc.text(`Vendor Terpilih: ${request.chosenVendor.name}`);
  } else if (request.suggestedVendor) {
    doc.text(`Vendor Disarankan: ${request.suggestedVendor.name}`);
  }
  doc.moveDown();

  doc.text('Tanda Tangan:', { underline: true });
  doc.moveDown(0.5);
  doc.text(`Pemohon: ${request.requesterSignature ?? '(belum ditandatangani)'}`);
  if (request.requesterSignatureImage) {
    try {
      const base64Data = request.requesterSignatureImage.replace(/^data:image\/\w+;base64,/, '');
      const imgBuffer = Buffer.from(base64Data, 'base64');
      doc.image(imgBuffer, { fit: [120, 50] });
    } catch {
      // ignore image errors
    }
  }
  doc.text(`Tanggal: ${request.requesterSignedAt ? request.requesterSignedAt.toISOString().slice(0, 10) : '-'}`);
  doc.moveDown(0.5);

  const managerApproval = request.approvals.find((a) => a.role === 'MANAGER' || a.role === 'DIRECTOR');
  if (managerApproval) {
    doc.text(`Manajer/Direktur: ${managerApproval.signature ?? '(belum ditandatangani)'}`);
    if (managerApproval.signatureImage) {
      try {
        const base64Data = managerApproval.signatureImage.replace(/^data:image\/\w+;base64,/, '');
        const imgBuffer = Buffer.from(base64Data, 'base64');
        doc.image(imgBuffer, { fit: [120, 50] });
      } catch {
        // ignore image errors
      }
    }
    doc.text(`Tanggal: ${managerApproval.decidedAt ? managerApproval.decidedAt.toISOString().slice(0, 10) : '-'}`);
    doc.text(`Status: ${managerApproval.status}`);
  } else {
    doc.text('Manajer/Direktur: (belum ada)');
  }

  const buffer = await docToBuffer(doc);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="pp-${request.number}.pdf"`,
    },
  });
}
