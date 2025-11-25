import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/departments - List all departments
export async function GET() {
  const departments = await prisma.department.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  return NextResponse.json(departments);
}
