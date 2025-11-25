import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb, PDFFont, RGB } from 'pdf-lib';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

// --- KONFIGURASI & GAYA (STYLES) ---
const COLORS = {
  primary: rgb(0.18, 0.25, 0.55), // Navy Blue (Profesional)
  secondary: rgb(0.4, 0.4, 0.4),  // Abu-abu Gelap
  accent: rgb(0.96, 0.97, 1.0),   // Biru sangat muda untuk background baris
  border: rgb(0.85, 0.85, 0.85),  // Abu-abu terang untuk garis
  textMain: rgb(0.1, 0.1, 0.1),   // Hitam Hampir Pekat
  textLight: rgb(0.5, 0.5, 0.5),  // Abu-abu teks label
  white: rgb(1, 1, 1),
  status: {
    approved: rgb(0.13, 0.65, 0.28), // Hijau
    rejected: rgb(0.85, 0.15, 0.15), // Merah
    pending: rgb(0.9, 0.6, 0.1),     // Oranye
  }
};

const FORMATS = {
  currency: new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }),
  date: new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }), // Contoh: 24 November 2025
};

// Terjemahan Status Database ke Bahasa Indonesia
const STATUS_LABELS: Record<string, string> = {
  APPROVED: 'DISETUJUI',
  REJECTED: 'DITOLAK',
  REVISED: 'DIREVISI',
  PENDING: 'MENUNGGU',
};

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });

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

    if (!request) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });

    // 1. Buat Dokumen PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // Ukuran A4
    const { width, height } = page.getSize();
    
    // Margin
    const margin = 50;
    const contentWidth = width - (margin * 2);

    // 2. Embed Font Standar
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // --- FUNGSI BANTUAN (HELPER) ---
    let currentY = height - margin;

    const drawText = (
      text: string, 
      x: number, 
      y: number, 
      size: number, 
      font: PDFFont, 
      color: RGB = COLORS.textMain, 
      align: 'left' | 'right' | 'center' = 'left'
    ) => {
      const textWidth = font.widthOfTextAtSize(text, size);
      let xPos = x;
      if (align === 'right') xPos = x - textWidth;
      if (align === 'center') xPos = x - (textWidth / 2);
      
      page.drawText(text, { x: xPos, y, size, font, color });
      return textWidth;
    };

    const drawLine = (y: number, color = COLORS.border, thickness = 1) => {
      page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness, color });
    };

    // --- BAGIAN KOP / HEADER ---
    
    // Placeholder Logo (Kiri)
    page.drawRectangle({
      x: margin, y: currentY - 40, width: 40, height: 40,
      color: COLORS.primary, opacity: 0.1 
    });
    drawText("TEI", margin + 10, currentY - 32, 20, fontBold, COLORS.primary); 

    // Info Perusahaan (Kiri, sebelah logo)
    drawText('PT TUNAS ESTA INDONESIA', margin + 55, currentY - 15, 14, fontBold, COLORS.primary);
    
    // Alamat Baru (Dipeah jadi 2 baris agar rapi)
    drawText('Jl. Raya Semarang - Tuban, Kaligondang,', margin + 55, currentY - 30, 9, fontRegular, COLORS.textLight);
    drawText('Kabupaten Demak, Jawa Tengah', margin + 55, currentY - 42, 9, fontRegular, COLORS.textLight);
    
    // Judul Dokumen (Kanan)
    drawText('PERMINTAAN PEMBELIAN', width - margin, currentY - 15, 16, fontBold, COLORS.primary, 'right');
    drawText(`No: ${request.number}`, width - margin, currentY - 32, 10, fontRegular, COLORS.textMain, 'right');

    currentY -= 70;
    drawLine(currentY + 15, COLORS.primary, 2); // Garis pemisah tebal

    // --- BAGIAN INFORMASI UTAMA ---
    currentY -= 20;
    const col1 = margin;
    const col2 = margin + 100; // Nilai kolom kiri
    const col3 = width - margin - 150; // Label kolom kanan
    const col4 = width - margin; // Nilai kolom kanan (rata kanan)

    const drawInfoRow = (label: string, value: string, y: number, isRightSide = false) => {
       if (!isRightSide) {
         drawText(label, col1, y, 9, fontRegular, COLORS.textLight);
         drawText(':', col1 + 80, y, 9, fontRegular, COLORS.textLight);
         drawText(value, col2, y, 9, fontBold, COLORS.textMain);
       } else {
         drawText(label, col3, y, 9, fontRegular, COLORS.textLight);
         drawText(value, col4, y, 9, fontBold, COLORS.textMain, 'right');
       }
    };

    drawInfoRow('Pemohon', request.requester?.name ?? '-', currentY);
    drawInfoRow('Tgl. Pengajuan', FORMATS.date.format(new Date(request.createdAt)), currentY, true);
    
    currentY -= 18;
    drawInfoRow('Departemen', request.department?.name ?? '-', currentY);
    drawInfoRow('Tgl. Diperlukan', request.neededAt ? FORMATS.date.format(new Date(request.neededAt)) : '-', currentY, true);

    currentY -= 40;

    // --- TABEL BARANG ---
    
    // Definisi Kolom
    const tableTop = currentY;
    const cols = {
      no: { x: margin, w: 30 },
      desc: { x: margin + 35, w: 230 },
      qty: { x: margin + 270, w: 45 },
      unit: { x: margin + 320, w: 50 },
      price: { x: margin + 375, w: 65 },
      total: { x: width - margin, w: 0 }, // Rata kanan ke margin
    };

    // Background Header Tabel
    page.drawRectangle({
      x: margin, y: tableTop - 25, width: contentWidth, height: 25,
      color: COLORS.primary
    });

    // Header Tabel (Teks Putih)
    const headerY = tableTop - 18;
    const textWhite = COLORS.white;
    
    drawText('No', cols.no.x + 5, headerY, 9, fontBold, textWhite);
    drawText('Deskripsi Barang / Jasa', cols.desc.x, headerY, 9, fontBold, textWhite);
    drawText('Kuantitas', cols.qty.x + cols.qty.w, headerY, 9, fontBold, textWhite, 'right'); // Rata Kanan
    drawText('Satuan', cols.unit.x, headerY, 9, fontBold, textWhite);
    drawText('Harga Satuan', cols.price.x + cols.price.w, headerY, 9, fontBold, textWhite, 'right'); // Rata Kanan
    drawText('Total (Rp)', cols.total.x - 5, headerY, 9, fontBold, textWhite, 'right');

    currentY -= 25;

    // Isi Tabel
    const rowHeight = 24;
    
    request.items.forEach((item, index) => {
      // Warna selang-seling (Zebra striping)
      if (index % 2 === 0) {
        page.drawRectangle({
          x: margin, y: currentY - rowHeight, width: contentWidth, height: rowHeight,
          color: COLORS.accent
        });
      }

      const rowTextY = currentY - 16;
      const total = (item.estimatedUnitPrice ?? 0) * item.quantity;
      
      // Potong deskripsi jika terlalu panjang
      let desc = item.description + (item.remarks ? ` (${item.remarks})` : '');
      if (fontRegular.widthOfTextAtSize(desc, 9) > cols.desc.w) {
         const maxChars = 45; 
         desc = desc.substring(0, maxChars) + '...';
      }

      drawText(String(index + 1), cols.no.x + 5, rowTextY, 9, fontRegular);
      drawText(desc, cols.desc.x, rowTextY, 9, fontRegular);
      // Angka rata kanan agar rapi
      drawText(String(item.quantity), cols.qty.x + cols.qty.w, rowTextY, 9, fontRegular, COLORS.textMain, 'right');
      drawText(item.unit, cols.unit.x, rowTextY, 9, fontRegular);
      drawText(FORMATS.currency.format(item.estimatedUnitPrice ?? 0), cols.price.x + cols.price.w, rowTextY, 9, fontRegular, COLORS.textMain, 'right');
      drawText(FORMATS.currency.format(total), cols.total.x - 5, rowTextY, 9, fontBold, COLORS.textMain, 'right');

      currentY -= rowHeight;
    });

    // Garis Bawah Tabel
    drawLine(currentY, COLORS.primary);

    // --- TOTAL & VENDOR ---
    currentY -= 10;
    
    // Kotak Total (Kanan)
    const totalBoxY = currentY - 30;
    page.drawRectangle({
      x: width - margin - 220, y: totalBoxY, width: 220, height: 35,
      color: COLORS.accent,
      borderColor: COLORS.border, borderWidth: 1
    });
    
    drawText('TOTAL ESTIMASI', width - margin - 210, totalBoxY + 12, 10, fontRegular, COLORS.textLight);
    drawText(`Rp ${FORMATS.currency.format(request.totalEstimatedAmount ?? 0)}`, width - margin - 10, totalBoxY + 10, 14, fontBold, COLORS.primary, 'right');

    // Info Vendor (Kiri)
    if (request.chosenVendor || request.suggestedVendor) {
        const vendor = request.chosenVendor || request.suggestedVendor;
        const vLabel = request.chosenVendor ? 'Vendor Terpilih' : 'Vendor Disarankan';
        
        drawText(vLabel, margin, totalBoxY + 20, 8, fontRegular, COLORS.textLight);
        drawText(vendor!.name, margin, totalBoxY + 8, 10, fontBold, COLORS.textMain);
    }

    currentY -= 80;

    // --- KOLOM TANDA TANGAN ---
    drawText('LEMBAR PERSETUJUAN', margin, currentY, 11, fontBold, COLORS.primary);
    drawLine(currentY - 5, COLORS.border);
    currentY -= 20;

    const sigBoxWidth = (contentWidth - 20) / 2;
    const sigHeight = 100;
    
    // Fungsi pembantu gambar kotak tanda tangan
    const drawSigBox = async (
      x: number, 
      role: string, 
      name: string, 
      date: Date | null, 
      signatureBase64: string | null, 
      status: string | null = null
    ) => {
        // Border Kotak
        page.drawRectangle({
            x, y: currentY - sigHeight, width: sigBoxWidth, height: sigHeight,
            borderColor: COLORS.border, borderWidth: 1, color: COLORS.white
        });

        // Header Jabatan
        page.drawRectangle({
            x, y: currentY - 25, width: sigBoxWidth, height: 25,
            color: COLORS.accent
        });
        drawText(role, x + (sigBoxWidth/2), currentY - 17, 9, fontBold, COLORS.primary, 'center');

        // Gambar Tanda Tangan
        if (signatureBase64) {
             try {
                const base64Data = signatureBase64.replace(/^data:image\/\w+;base64,/, '');
                const img = await pdfDoc.embedPng(base64Data);
                const dims = img.scale(0.25);
                const imgX = x + (sigBoxWidth - dims.width) / 2;
                const imgY = currentY - 70;
                page.drawImage(img, { x: imgX, y: imgY, width: dims.width, height: dims.height });
             } catch (e) { console.error('Gagal memuat gambar ttd', e); }
        } else {
            drawText('(Belum ditandatangani)', x + (sigBoxWidth/2), currentY - 60, 8, fontRegular, COLORS.textLight, 'center');
        }

        // Nama Penandatangan
        drawText(name, x + (sigBoxWidth/2), currentY - 85, 9, fontBold, COLORS.textMain, 'center');
        
        // Tanggal Tanda Tangan
        const dateStr = date ? FORMATS.date.format(new Date(date)) : '-';
        drawText(dateStr, x + (sigBoxWidth/2), currentY - 95, 7, fontRegular, COLORS.textLight, 'center');

        // Badge Status (Untuk Approver)
        if (status) {
            let badgeColor = COLORS.status.pending;
            if (status === 'APPROVED') badgeColor = COLORS.status.approved;
            if (status === 'REJECTED') badgeColor = COLORS.status.rejected;

            // Terjemahkan status database ke Bahasa Indonesia
            const statusText = STATUS_LABELS[status] || status; 

            const badgeWidth = 70; // Sedikit lebih lebar untuk teks Indonesia
            page.drawRectangle({
                x: x + sigBoxWidth - badgeWidth - 5, y: currentY - 20, width: badgeWidth, height: 14,
                color: badgeColor, opacity: 0.1
            });
            drawText(statusText, x + sigBoxWidth - badgeWidth + 35, currentY - 16, 7, fontBold, badgeColor, 'center');
        }
    };

    // 1. Kotak Pemohon
    await drawSigBox(
        margin, 
        'PEMOHON', 
        request.requester?.name ?? '-', 
        request.requesterSignedAt, 
        request.requesterSignatureImage
    );

    // 2. Kotak Penyetuju (Manajer/Direktur)
    const managerApproval = request.approvals.find((a) => a.role === 'MANAGER' || a.role === 'DIRECTOR');
    const approverName = managerApproval?.approver?.name ?? '-';
    // Terjemahkan Role
    const approverRole = managerApproval?.role === 'DIRECTOR' ? 'DIREKTUR' : 'MANAJER';
    
    await drawSigBox(
        margin + sigBoxWidth + 20,
        approverRole,
        approverName,
        managerApproval?.decidedAt ?? null,
        managerApproval?.signatureImage ?? null,
        managerApproval?.status ?? 'PENDING'
    );

    // --- FOOTER / KAKI HALAMAN ---
    const footerY = 30;
    drawLine(footerY + 15, COLORS.border, 0.5);
    drawText(`Dokumen ini dibuat secara otomatis oleh sistem | Halaman 1 dari 1`, width / 2, footerY, 8, fontRegular, COLORS.textLight, 'center');

    // Simpan PDF
    const pdfBytes = await pdfDoc.save();
    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="PP-${request.number}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Gagal membuat PDF', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat membuat PDF' }, { status: 500 });
  }
}