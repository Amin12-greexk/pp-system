import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

// POST /api/auth/login { email, password }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const res = NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role });

  // Set cache control headers to prevent caching issues
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');

  res.cookies.set('userId', String(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
  res.cookies.set('userRole', user.role, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
  res.cookies.set('userName', user.name, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });

  return res;
}
