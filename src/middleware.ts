import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('sb-access-token')?.value

  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const isKochbuch = request.nextUrl.pathname.startsWith('/kochbuch')

  if (!accessToken && (isDashboard || isKochbuch)) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/kochbuch/:path*'],
}
