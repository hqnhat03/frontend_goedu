import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const token = request.cookies.get('access_token')?.value;

  // Define domains
  const adminDomain = 'goedu.demo.vn';
  const teacherDomain = 'teacher-goedu.demo.vn';
  const studentDomain = 'student-goedu.demo.vn';

  // Extract the main part of the hostname (removing port if present)
  const currentHost = hostname.split(':')[0];
  const pathname = url.pathname;

  // Helper to handle protected routes
  const handleProtectedDomain = (domainRewritingPath: string, publicRoutes: string[] = []) => {
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
    const isPublicRoute = publicRoutes.some((route) =>
      route === '/'
        ? pathname === '/' || pathname === ''
        : pathname === route || pathname.startsWith(`${route}/`)
    );
    
    // If no token and trying to access protected page, redirect to login
    if (!token && !isAuthPage && !isPublicRoute) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // If has token and trying to access auth page, redirect to home
    if (token && isAuthPage) {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // If already rewritten (path starts with domain prefix), skip rewrite to avoid loops
    if (pathname === domainRewritingPath || pathname.startsWith(`${domainRewritingPath}/`)) {
      return NextResponse.next();
    }

    // Rewrite to domain-specific path
    url.pathname = `${domainRewritingPath}${pathname}`;
    return NextResponse.rewrite(url);
  };

  // Logic for rewriting based on hostname
  if (currentHost === adminDomain) {
    // Nếu truy cập domain admin mà có prefix /admin thì redirect bỏ prefix đó đi
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      const newPathname = pathname.replace(/^\/admin/, '') || '/';
      url.pathname = newPathname;
      return NextResponse.redirect(url);
    }
    return handleProtectedDomain('/admin');
  }

  if (currentHost === teacherDomain) {
    return handleProtectedDomain('/teacher');
  }

  if (currentHost === studentDomain) {
    return handleProtectedDomain('/student', ['/', '/courses']);
  }

  // Fallback or default behavior
  return NextResponse.next();
}

// Config to match all paths except for static files and api
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
