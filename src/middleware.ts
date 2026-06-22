/**
 * 認証ガード（Edge ミドルウェア）。
 * 要件 §9.2: 全画面・全APIルートでログイン必須。未認証はログイン画面へリダイレクト/401。
 * 公開パス（/login, /api/health, 静的アセット）は matcher で除外する。
 */
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// /setup は初回アカウント作成（認証前）を含むため公開。ページ側でステップごとに認証を判定する。
const PUBLIC_PATHS = ["/login", "/setup", "/api/health"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    // API は 401、画面はログインへリダイレクト
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // _next/static, _next/image, favicon, 公開アセットを除外して全ルートを保護
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
