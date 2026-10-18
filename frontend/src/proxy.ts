import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verify } from "@/lib/session";

// Next.js 16 calls the middleware file "proxy". Every page except /login needs a valid session.
export async function proxy(req: NextRequest) {
  const name = await verify(req.cookies.get(COOKIE)?.value);
  const onLogin = req.nextUrl.pathname === "/login";
  if (!name && !onLogin) return NextResponse.redirect(new URL("/login", req.url));
  if (name && onLogin) return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|apple-icon.png).*)"] };
