import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const userId = getUserId(req);
  if (!userId) return unauthorized();
  const vendors = (body.vendors ?? []) as Array<{
    name: string;
    city?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    bankAccount?: string;
    brand?: string;
    websiteUrl?: string;
    catalogUrl?: string;
    imageUrl?: string;
    notes?: string;
    isActive?: boolean;
  }>;

  const validVendors = vendors.filter((v) => v?.name);

  if (!Array.isArray(vendors) || validVendors.length === 0) {
    return NextResponse.json({ error: 'vendors array required' }, { status: 400 });
  }

  const created = await prisma.$transaction(
    validVendors.map((v) =>
      prisma.vendor.create({
        data: {
          name: v.name,
          city: v.city ?? null,
          contactPerson: v.contactPerson ?? null,
          phone: v.phone ?? null,
          email: v.email ?? null,
          bankAccount: v.bankAccount ?? null,
          brand: v.brand ?? null,
          websiteUrl: v.websiteUrl ?? null,
          catalogUrl: v.catalogUrl ?? null,
          imageUrl: v.imageUrl ?? null,
          notes: v.notes ?? null,
          isActive: v.isActive ?? true,
        },
      })
    )
  );

  return NextResponse.json({ count: created.length }, { status: 201 });
}
