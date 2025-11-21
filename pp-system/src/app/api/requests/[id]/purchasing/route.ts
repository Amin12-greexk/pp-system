import { NextRequest, NextResponse } from 'next/server';
import { ApprovalRole, ApprovalStatus, RequestStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';

type Params = { params: { id: string } };

// POST /api/requests/:id/purchasing
export async function POST(req: NextRequest, { params }: Params) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const body = await req.json();
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const requestData = await prisma.purchaseRequest.findUnique({
    where: { id },
  });

  if (!requestData) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const vendorId = Number(body.vendorId);
  if (Number.isNaN(vendorId)) {
    return NextResponse.json({ error: 'vendorId is required' }, { status: 400 });
  }

  const createPO = body.createPO === true;
  const poCount = await prisma.purchaseOrder.count();
  const poNumber = `PO-${new Date().getFullYear()}-${String(poCount + 1).padStart(4, '0')}`;

  const result = await prisma.$transaction(async (tx) => {
    const updatedReq = await tx.purchaseRequest.update({
      where: { id },
      data: {
        chosenVendorId: vendorId,
        totalFinalAmount: body.totalFinalAmount ?? null,
        status: createPO ? RequestStatus.ORDERED : RequestStatus.PURCHASING_REVIEW,
      },
    });

    let po = null as Awaited<ReturnType<typeof tx.purchaseOrder.create>> | null;
    if (createPO) {
      po = await tx.purchaseOrder.create({
        data: {
          number: poNumber,
          purchaseRequestId: id,
          vendorId,
          totalAmount: body.totalFinalAmount ?? null,
        },
      });

      await tx.approval.create({
        data: {
          purchaseRequestId: id,
          approverId: userId,
          role: ApprovalRole.PURCHASING,
          level: 99,
          status: ApprovalStatus.APPROVED,
          note: 'Vendor selected & PO created',
          decidedAt: new Date(),
        },
      });
    }

    return { request: updatedReq, po };
  });

  return NextResponse.json(result);
}
