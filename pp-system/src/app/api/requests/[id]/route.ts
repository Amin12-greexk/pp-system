import { NextRequest, NextResponse } from 'next/server';
import { RequestStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type Params = { params: { id: string } };

// GET /api/requests/:id
export async function GET(_req: NextRequest, { params }: Params) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

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
      purchaseOrders: true,
    },
  });

  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(request);
}

// PATCH /api/requests/:id
export async function PATCH(req: NextRequest, { params }: Params) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const body = await req.json();
  const current = await prisma.purchaseRequest.findUnique({ where: { id } });

  if (!current) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (current.status !== RequestStatus.NEEDS_REVISION) {
    return NextResponse.json({ error: 'Request is not in revision state' }, { status: 400 });
  }

  const items = (body.items ?? []) as Array<{
    description: string;
    quantity: number;
    unit: string;
    estimatedUnitPrice?: number;
    requiredDate?: string;
  }>;

  if (!items.length) {
    return NextResponse.json({ error: 'Items are required' }, { status: 400 });
  }

  const totalEstimatedAmount = items.reduce(
    (sum, item) => sum + (item.estimatedUnitPrice ?? 0) * item.quantity,
    0
  );

  const updated = await prisma.$transaction(async (tx) => {
    await tx.purchaseRequestItem.deleteMany({ where: { purchaseRequestId: id } });

    const r = await tx.purchaseRequest.update({
      where: { id },
      data: {
        purpose: body.purpose ?? null,
        neededAt: body.neededAt ? new Date(body.neededAt) : null,
        suggestedVendorId: body.suggestedVendorId ?? null,
        totalEstimatedAmount,
        status: RequestStatus.PENDING_APPROVAL,
        items: {
          create: items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unit: i.unit,
            estimatedUnitPrice: i.estimatedUnitPrice ?? null,
            requiredDate: i.requiredDate ? new Date(i.requiredDate) : null,
          })),
        },
      },
      include: { items: true },
    });

    return r;
  });

  return NextResponse.json(updated);
}
