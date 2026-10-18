import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verify } from "@/lib/session";

// Next.js 16 calls the middleware file "proxy". Every page except /login needs a valid session.
export async function proxy(req: NextRequest) {
  const name = await verify(req.cookies.get(COOKIE)?.value);
  const onLogin = req.nextUrl.pathname === "/login";
  const to = (pathname: string) => { const u = req.nextUrl.clone(); u.pathname = pathname; return NextResponse.redirect(u); };
  if (!name && !onLogin) return to("/login");
  if (name && onLogin) return to("/");
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|apple-icon.png).*)"] };
