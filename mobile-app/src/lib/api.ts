// The backend's customer API (backend/app_api.py). Every call answers with the whole app data.
// EXPO_PUBLIC_API_URL comes from mobile-app/.env (see .env.example); Expo builds it into the app.
// Sign-in: POST /v1/claim returns a bearer token, sent on every other call. The token and the language
// are kept in localStorage (web) or AsyncStorage (native).
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { AppData } from "./types";

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
const KEY = "ilp.token";
let token = "";

// Browser storage can throw (private mode), so values also stay in memory.
const mem: Record<string, string> = {};
const raw = (k: string) => (Platform.OS === "web" ? Promise.resolve(localStorage.getItem(k)) : AsyncStorage.getItem(k));
export const storage = {
  get: async (k: string) => {
    try { return (await raw(k)) ?? mem[k] ?? null; } catch { return mem[k] ?? null; }
  },
  set: async (k: string, v: string) => {
    mem[k] = v;
    try { await (Platform.OS === "web" ? localStorage.setItem(k, v) : AsyncStorage.setItem(k, v)); } catch {}
  },
};

export type Hit = { customer_id: string; label: string; taken: boolean };

export class ApiError extends Error {
  constructor(message: string, readonly status = 0) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/v1${path}`, {
      ...init,
      headers: { ...(token && { Authorization: `Bearer ${token}` }), "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(`Cannot reach the backend at ${BASE}.`);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) forget(); // a token the backend no longer knows
    throw new ApiError(body?.error?.message ?? `The backend answered ${res.status}.`, res.status);
  }
  return body as T;
}

function forget() {
  token = "";
  void storage.set(KEY, ""); // an empty value means no token
}

// The backend answers in the app's language (backend/i18n_data.py).
let lang = "en";
const call = (path: string, init?: RequestInit) => request<AppData>(`${path}?lang=${lang}`, init);

export const api = {
  /** Reads the stored token. True when the visitor is signed in. */
  restore: async () => {
    token = (await storage.get(KEY)) ?? "";
    return token !== "";
  },
  search: (cls: string, q: string) =>
    request<{ hits: Hit[] }>(`/profiles/search?class=${encodeURIComponent(cls)}&q=${encodeURIComponent(q)}`).then((r) => r.hits),
  /** The first claim of a profile sets its password; later ones verify it. Keeps the token. */
  claim: async (customerId: string, password: string) => {
    const r = await request<{ token: string }>("/claim", { method: "POST", body: JSON.stringify({ customer_id: customerId, password }) });
    token = r.token;
    await storage.set(KEY, token);
  },
  getLang: async () => {
    const l = await storage.get("ilp.lang");
    if (l === "en" || l === "fi" || l === "sv") lang = l;
    return l;
  },
  setLang: (l: string) => {
    lang = l;
    return storage.set("ilp.lang", l);
  },
  load: () => call("/me/app"),
  book: (riskId: string, bidId: string, mode: "hire" | "diy") =>
    call("/me/bookings", { method: "POST", body: JSON.stringify({ risk_id: riskId, bid_id: bidId, mode }) }),
  advance: (riskId: string) => call(`/me/bookings/${encodeURIComponent(riskId)}/advance`, { method: "POST" }),
  addInsurance: (classId: string) => call("/me/insurances", { method: "POST", body: JSON.stringify({ class_id: classId }) }),
  setReminder: (taskId: string, on: boolean) =>
    call(`/me/reminders/${encodeURIComponent(taskId)}`, { method: "PUT", body: JSON.stringify({ on }) }),
};
