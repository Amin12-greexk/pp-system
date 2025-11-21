import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

function parseDate(value: string | null) {
  return value ? new Date(value) : null;
}

export async function GET(req: NextRequest) {
  const fromParam = req.nextUrl.searchParams.get('from');
  const toParam = req.nextUrl.searchParams.get('to');
  const format = req.nextUrl.searchParams.get('format') ?? 'json';

  const fromDate = parseDate(fromParam);
  const toDate = parseDate(toParam);

  if (!fromDate || !toDate || Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return NextResponse.json({ error: 'from and to (YYYY-MM-DD) are required' }, { status: 400 });
  }

  const exclusiveTo = new Date(toDate);
  exclusiveTo.setDate(exclusiveTo.getDate() + 1);

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: {
      orderDate: {
        gte: fromDate,
        lt: exclusiveTo,
      },
    },
    include: {
      vendor: true,
      purchaseRequest: {
        include: { department: true },
      },
    },
    orderBy: { orderDate: 'asc' },
  });

  const rows = purchaseOrders.map((po) => ({
    orderDate: po.orderDate.toISOString().slice(0, 10),
    poNumber: po.number,
    requestNumber: po.purchaseRequest.number,
    department: po.purchaseRequest.department?.name ?? '',
    vendorName: po.vendor.name,
    totalAmount: po.totalAmount ?? 0,
  }));

  const totalAmount = rows.reduce((sum, row) => sum + (row.totalAmount ?? 0), 0);

  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Rekap Pembelian');
    sheet.columns = [
      { header: 'Tgl Order', key: 'orderDate', width: 15 },
      { header: 'No. PO', key: 'poNumber', width: 18 },
      { header: 'No. PP', key: 'requestNumber', width: 18 },
      { header: 'Departemen', key: 'department', width: 18 },
      { header: 'Vendor', key: 'vendorName', width: 24 },
      { header: 'Total Amount', key: 'totalAmount', width: 16 },
    ];

    sheet.addRows(rows);
    const totalRow = sheet.addRow({ orderDate: 'TOTAL', totalAmount });
    totalRow.font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="rekap-purchases-${fromParam}-${toParam}.xlsx"`,
      },
    });
  }

  return NextResponse.json({
    from: fromParam,
    to: toParam,
    count: rows.length,
    totalAmount,
    rows,
  });
}
