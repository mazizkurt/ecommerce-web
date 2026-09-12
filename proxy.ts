import { NextResponse, type NextRequest } from "next/server";

// Yalnızca iyimser kontrol: gerçek yetki kontrolü sayfalarda ve Server Action'larda yapılır.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has("sid");

  if (
    pathname.startsWith("/admin") &&
    pathname !== "/admin/giris" &&
    !hasSession
  ) {
    return NextResponse.redirect(new URL("/admin/giris", request.url));
  }

  if (pathname.startsWith("/hesabim") && !hasSession) {
    const url = new URL("/giris", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/hesabim/:path*"],
};
