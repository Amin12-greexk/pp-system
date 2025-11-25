import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get cookies
  const userId = request.cookies.get('userId')?.value;
  const userRole = request.cookies.get('userRole')?.value;

  // Define protected routes
  const pathname = request.nextUrl.pathname;

  // Skip middleware for public routes
  if (
    pathname === '/login' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/logo')
  ) {
    return NextResponse.next();
  }

  // If not logged in and trying to access protected routes, redirect to login
  if (!userId || !userRole) {
    if (pathname !== '/' && pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Role-based access control
  const roleRouteAccess: Record<string, string[]> = {
    EMPLOYEE: ['/employee'],
    MANAGER: ['/manager', '/employee'],
    DIRECTOR: ['/manager', '/employee'],
    PURCHASING: ['/purchasing', '/employee'],
    FINANCE: ['/purchasing'],
    ADMIN: ['/manager', '/purchasing', '/employee'],
  };

  const allowedRoutes = roleRouteAccess[userRole] || [];

  // Check if user is trying to access a route they don't have permission for
  const isAccessingProtectedRoute = Object.keys(roleRouteAccess)
    .flatMap(role => roleRouteAccess[role])
    .some(route => pathname.startsWith(route));

  if (isAccessingProtectedRoute) {
    const hasAccess = allowedRoutes.some(route => pathname.startsWith(route));
    if (!hasAccess) {
      // Redirect to home if user doesn't have access
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Add cache control headers to prevent stale data
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, must-revalidate');
  response.headers.set('X-User-Role', userRole);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
