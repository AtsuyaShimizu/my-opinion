import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that require authentication
const protectedRoutes = [
  "/home",
  "/explore",
  "/themes",
  "/settings",
  "/admin",
  "/notifications",
  "/onboarding",
];

// Routes that should redirect to /home if already authenticated
const authRoutes = ["/login", "/signup", "/reset-password"];

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  // TODO: Cookie名による認証チェックは脆弱。Supabase設定によりcookie名が変わる可能性がある。
  // 将来的にはsupabase.auth.getUser()を使用してサーバーサイドでセッション検証すべき。
  const hasSession = request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes("auth-token"));

  // Redirect unauthenticated users from protected routes to login
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from auth routes to home
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
