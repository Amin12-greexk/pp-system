import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';
import bcrypt from 'bcrypt';

// POST /api/users - Create new user (Manager/Director/Admin only)
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has permission to create users
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!currentUser || !['MANAGER', 'DIRECTOR', 'ADMIN'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Forbidden: Only managers, directors, and admins can create users' }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, password, role, departmentId } = body;

  // Validate required fields
  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: 'Name, email, password, and role are required' }, { status: 400 });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
  }

  // Validate role
  const validRoles = ['EMPLOYEE', 'MANAGER', 'DIRECTOR', 'PURCHASING', 'FINANCE', 'ADMIN'];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const newUser = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      departmentId: departmentId ? Number(departmentId) : null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  return NextResponse.json(newUser, { status: 201 });
}

// GET /api/users - List all users (Manager/Director/Admin only)
export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has permission to view users
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!currentUser || !['MANAGER', 'DIRECTOR', 'ADMIN'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Forbidden: Only managers, directors, and admins can view users' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
    orderBy: {
      id: 'asc',
    },
  });

  return NextResponse.json(users);
}
