import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';

// GET /api/vendors
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();

  // In employee view, we only return results on search; when no query, return empty
  const where =
    q.length > 0
      ? {
          isActive: true,
          OR: [
            { name: { contains: q } },
            { brand: { contains: q } },
            { name: { contains: q.toLowerCase() } },
            { brand: { contains: q.toLowerCase() } },
            { name: { contains: q.toUpperCase() } },
            { brand: { contains: q.toUpperCase() } },
          ],
        }
      : null;

  const vendors =
    where !== null
      ? await prisma.vendor.findMany({
          where,
          orderBy: { name: 'asc' },
        })
      : [];

  return NextResponse.json(vendors);
}

// POST /api/vendors
export async function POST(req: NextRequest) {
  const body = await req.json();
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  if (!body.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const vendor = await prisma.vendor.create({
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

  return NextResponse.json(vendor, { status: 201 });
}
