import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  const subdomain = hostname?.split('.')[0];
  const pathname = request.nextUrl.pathname;

  // Skip tenant validation for error pages and login
  if (pathname === '/tenant-error' || pathname === '/login' || pathname === '/_error') {
    return NextResponse.next();
  }

  // Extract tenant from subdomain
  if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-domain', subdomain);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // If no valid subdomain and not on root or login, redirect to tenant error
  if (pathname !== '/' && pathname !== '/login') {
    return NextResponse.redirect(new URL('/tenant-error', request.url));
  }

  return NextResponse.next();
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
