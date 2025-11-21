import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/purchase-orders
export async function GET() {
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    include: {
      vendor: true,
      purchaseRequest: true,
    },
    orderBy: { orderDate: 'desc' },
  });

  return NextResponse.json(purchaseOrders);
}
