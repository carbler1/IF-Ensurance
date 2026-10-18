// A signed session cookie: base64url(JSON {name, exp}) + "." + HMAC-SHA256. Web Crypto only, so the proxy
// and the server actions share it. The secret is SESSION_SECRET (required, 16+ characters).
export const COOKIE = "session";
export const MAX_AGE = 60 * 60 * 12; // seconds

const enc = new TextEncoder();
const b64 = (b: Uint8Array) => Buffer.from(b).toString("base64url");

async function hmac(data: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error("SESSION_SECRET is not set (16+ characters).");
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

export async function sign(name: string): Promise<string> {
  const body = b64(enc.encode(JSON.stringify({ name, exp: Date.now() + MAX_AGE * 1000 })));
  return `${body}.${b64(await hmac(body))}`;
}

/** The company name in a valid, unexpired cookie value; otherwise null. */
export async function verify(token: string | undefined): Promise<string | null> {
  const [body, mac] = (token ?? "").split(".");
  if (!body || !mac) return null;
  const want = Buffer.from(await hmac(body));
  const got = Buffer.from(mac, "base64url");
  if (!want.equals(got)) return null;
  try {
    const { name, exp } = JSON.parse(Buffer.from(body, "base64url").toString());
    return typeof name === "string" && exp > Date.now() ? name : null;
  } catch {
    return null;
  }
}
