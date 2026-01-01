// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if user has auth session cookie
  const session = request.cookies.get('session')?.value;
  
  // Public paths that don't require authentication
  const isPublicPath = pathname === '/login';
  
  // Redirect logic
  if (!session && !isPublicPath) {
    // No session and trying to access protected route
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (session && isPublicPath) {
    // Has session and trying to access login page
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};