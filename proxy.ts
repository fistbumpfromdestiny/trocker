import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('[PROXY] Checking auth for:', pathname);

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
    cookieName: process.env.NODE_ENV === 'production'
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token',
  });

  console.log('[PROXY] Token:', { hasToken: !!token, email: token?.email, role: token?.role });

  // Allow access to login page and API routes
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    console.log('[PROXY] Allowing public route');
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!token) {
    console.log('[PROXY] No token - redirecting to login');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin routes
  if (pathname.startsWith('/admin') && token.role !== 'ADMIN') {
    console.log('[PROXY] Non-admin accessing admin route - redirecting');
    return NextResponse.redirect(new URL('/', request.url));
  }

  console.log('[PROXY] Auth check passed');
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon\\.svg|icon\\.png|public).*)',
  ],
};
