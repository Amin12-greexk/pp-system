import { NextRequest, NextResponse } from 'next/server';
import { ApprovalStatus, ApprovalRole, RequestStatus, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';

type Params = { params: { id: string } };

// POST /api/requests/:id/approve
export async function POST(req: NextRequest, { params }: Params) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const body = await req.json();
  const action = body.action as 'APPROVE' | 'REJECT' | 'REVISE';
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  if (!['APPROVE', 'REJECT', 'REVISE'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 400 });
  }

  const request = await prisma.purchaseRequest.findUnique({ where: { id } });
  if (!request) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let role: ApprovalRole = ApprovalRole.MANAGER;
  let level = 1;

  if (user.role === Role.DIRECTOR) {
    role = ApprovalRole.DIRECTOR;
    level = 2;
  }

  const approvalStatus: ApprovalStatus =
    action === 'APPROVE'
      ? ApprovalStatus.APPROVED
      : action === 'REJECT'
      ? ApprovalStatus.REJECTED
      : ApprovalStatus.REVISED;

  const requestStatus: RequestStatus =
    action === 'APPROVE'
      ? RequestStatus.APPROVED
      : action === 'REJECT'
      ? RequestStatus.REJECTED
      : RequestStatus.NEEDS_REVISION;

  const result = await prisma.$transaction(async (tx) => {
    await tx.approval.create({
      data: {
        purchaseRequestId: id,
        approverId: userId,
        role,
        level,
        status: approvalStatus,
        note: body.note ?? null,
        decidedAt: new Date(),
      },
    });

    const updated = await tx.purchaseRequest.update({
      where: { id },
      data: { status: requestStatus },
    });

    return updated;
  });

  return NextResponse.json(result);
}
