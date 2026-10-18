"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, call } from "@/lib/api";
import { COOKIE, MAX_AGE, sign } from "@/lib/session";

export async function signIn(_: string | null, form: FormData): Promise<string | null> {
  const name = String(form.get("name") ?? "");
  const password = String(form.get("password") ?? "");
  if (!name) return "Pick an account.";
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) return "Login is not configured";
  try {
    await call("/login", { method: "POST", body: JSON.stringify({ name, password }) });
  } catch (e) {
    if (e instanceof ApiError) return e.message;
    throw e;
  }
  const secure = (await headers()).get("x-forwarded-proto") ?.split(",")[0].trim() === "https";
  (await cookies()).set(COOKIE, await sign(name), { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: MAX_AGE });
  redirect("/");
}

export async function signOut() {
  (await cookies()).delete(COOKIE);
  redirect("/login");
}
