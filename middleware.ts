import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // TEMPORARY DEBUG: Pass everything through to check if deployment works
    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
