import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected provider routes that require approval
  const protectedProviderRoutes = [
    '/dashboard/provider/request',
    '/provider/jobs',
    '/provider/browse',
  ];

  // Check if this is a protected provider route
  const isProtectedRoute = protectedProviderRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Get auth token from cookie (set by Supabase)
    const token = request.cookies.get('sb-access-token')?.value;

    if (!token) {
      // Redirect to signin if not authenticated
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // Note: Full provider approval check would require calling Supabase
    // For now, we rely on client-side checks in the component
    // In production, you'd want to verify the token and check provider_status here
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/provider/:path*',
    '/provider/:path*',
  ],
};
