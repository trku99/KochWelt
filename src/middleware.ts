import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('sb-access-token')?.value
  const path = request.nextUrl.pathname

  const isDashboard = path.startsWith('/dashboard')
  const isKochbuch = path.startsWith('/kochbuch')
  const isAdmin = path.startsWith('/admin')

  if (!accessToken && (isDashboard || isKochbuch || isAdmin)) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/kochbuch/:path*', '/admin/:path*'],
}
