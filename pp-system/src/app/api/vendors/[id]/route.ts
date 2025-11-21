import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';

type Params = { params: { id: string } };

// GET /api/vendors/:id
export async function GET(_req: NextRequest, { params }: Params) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(vendor);
}

// PUT /api/vendors/:id
export async function PUT(req: NextRequest, { params }: Params) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const body = await req.json();

  const vendor = await prisma.vendor.update({
    where: { id },
    data: {
      name: body.name,
      city: body.city ?? null,
      contactPerson: body.contactPerson ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      bankAccount: body.bankAccount ?? null,
      brand: body.brand ?? null,
      websiteUrl: body.websiteUrl ?? null,
      catalogUrl: body.catalogUrl ?? null,
      imageUrl: body.imageUrl ?? null,
      notes: body.notes ?? null,
      isActive: body.isActive ?? true,
    },
  });

  return NextResponse.json(vendor);
}

// DELETE /api/vendors/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const userId = getUserId(_req);
  if (!userId) return unauthorized();

  await prisma.vendor.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
