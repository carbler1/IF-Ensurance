// The backend's customer API (backend/app_api.py). Every call answers with the whole app data.
// EXPO_PUBLIC_API_URL comes from mobile-app/.env (see .env.example); Expo builds it into the app.
// There is no sign-in: the backend serves the shared demo home to every call. Language is kept in
// localStorage (web) or AsyncStorage (native).
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { AppData } from "./types";

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

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
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(`Cannot reach the backend at ${BASE}.`);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(body?.error?.message ?? `The backend answered ${res.status}.`, res.status);
  }
  return body as T;
}

const call = (path: string, init?: RequestInit) => request<AppData>(path, init);

export const api = {
  getLang: () => storage.get("ilp.lang"),
  setLang: (l: string) => storage.set("ilp.lang", l),
  load: () => call("/me/app"),
  book: (riskId: string, bidId: string, mode: "hire" | "diy") =>
    call("/me/bookings", { method: "POST", body: JSON.stringify({ risk_id: riskId, bid_id: bidId, mode }) }),
  advance: (riskId: string) => call(`/me/bookings/${encodeURIComponent(riskId)}/advance`, { method: "POST" }),
  setReminder: (taskId: string, on: boolean) =>
    call(`/me/reminders/${encodeURIComponent(taskId)}`, { method: "PUT", body: JSON.stringify({ on }) }),
};
