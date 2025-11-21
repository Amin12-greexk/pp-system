import { NextRequest, NextResponse } from 'next/server';
import { RequestStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';

// GET /api/requests
export async function GET(req: NextRequest) {
  const mine = req.nextUrl.searchParams.get('mine');
  const statusParam = req.nextUrl.searchParams.get('status');
  const userId = getUserId(req);

  const where: Record<string, unknown> = {};
  if (mine === '1') {
    if (!userId) return unauthorized();
    where.requesterId = userId;
  }
  const status =
    statusParam && Object.values(RequestStatus).includes(statusParam as RequestStatus)
      ? (statusParam as RequestStatus)
      : undefined;
  if (statusParam && !status) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }
  if (status) {
    where.status = status;
  }

  const requests = await prisma.purchaseRequest.findMany({
    where,
    include: {
      department: true,
      requester: true,
      items: true,
      approvals: true,
      chosenVendor: true,
      suggestedVendor: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(requests);
}

// POST /api/requests
export async function POST(req: NextRequest) {
  const body = await req.json();
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.departmentId) {
    return NextResponse.json({ error: 'User/department not found' }, { status: 400 });
  }

  const items = (body.items ?? []) as Array<{
    description: string;
    quantity: number;
    unit: string;
    estimatedUnitPrice?: number;
    requiredDate?: string;
  }>;

  if (!items.length) {
    return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
  }

  const count = await prisma.purchaseRequest.count();
  const number = `PP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  const totalEstimatedAmount = items.reduce(
    (sum, item) => sum + (item.estimatedUnitPrice ?? 0) * item.quantity,
    0
  );

  const request = await prisma.purchaseRequest.create({
    data: {
      number,
      requesterId: user.id,
      departmentId: user.departmentId,
      status: RequestStatus.PENDING_APPROVAL,
      purpose: body.purpose ?? null,
      neededAt: body.neededAt ? new Date(body.neededAt) : null,
      suggestedVendorId: body.suggestedVendorId ?? null,
      totalEstimatedAmount,
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

  return NextResponse.json(request, { status: 201 });
}
