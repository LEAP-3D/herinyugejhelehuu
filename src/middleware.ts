import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/Home-page/Lobby/join-lobby") {
    const url = request.nextUrl.clone();
    url.pathname = "/Home-page/Lobby/Join-Lobby";
    return NextResponse.redirect(url);
  }

  if (pathname === "/Home-page/Lobby/host-lobby") {
    const url = request.nextUrl.clone();
    url.pathname = "/Home-page/Lobby/Host-Lobby";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/Home-page/Lobby/:path*"],
};
