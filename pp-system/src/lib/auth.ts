import { NextRequest, NextResponse } from 'next/server';

export function parseUserId(source: string | undefined | null): number | null {
  if (!source) return null;
  const parsed = Number(source);
  return Number.isNaN(parsed) ? null : parsed;
}

export function getUserId(req: NextRequest, fallback?: number): number | null {
  const fromCookie = parseUserId(req.cookies.get('userId')?.value);
  if (fromCookie !== null) return fromCookie;

  const fromHeader = parseUserId(req.headers.get('x-user-id'));
  if (fromHeader !== null) return fromHeader;

  return fallback ?? null;
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}
