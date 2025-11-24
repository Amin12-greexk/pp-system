import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';
import { RequestStatus } from '@prisma/client';

type Params = { params: { id: string } };

// POST /api/requests/:id/sign
export async function POST(req: NextRequest, { params }: Params) {
  const id = Number(params.id);
  if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const body = await req.json();
  const signature = (body.signature as string | undefined) || undefined;
  const signatureImage = body.signatureImage as string | undefined;
  if (!signature && !signatureImage) {
    return NextResponse.json({ error: 'Signature required' }, { status: 400 });
  }

  const requestData = await prisma.purchaseRequest.findUnique({ where: { id } });
  if (!requestData) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (requestData.requesterId !== userId) {
    return NextResponse.json({ error: 'Hanya pemohon yang boleh menandatangani' }, { status: 403 });
  }

  const updated = await prisma.purchaseRequest.update({
    where: { id },
    data: {
      requesterSignature: signature,
      requesterSignedAt: new Date(),
      requesterSignatureImage: signatureImage ?? null,
      status: requestData.status === RequestStatus.DRAFT ? RequestStatus.PENDING_APPROVAL : requestData.status,
    },
  });

  return NextResponse.json(updated);
}
