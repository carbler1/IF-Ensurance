// The backend's customer API (backend/app_api.py). Every call answers with the whole app data.
// EXPO_PUBLIC_API_URL comes from mobile-app/.env (see .env.example); Expo builds it into the app.
// The bearer token is per home: POST /v1/claim returns it, and it is kept in localStorage (web) or
// AsyncStorage (native).
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { AppData } from "./types";

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
const KEY = "ilp.token";
let token = "";

const storage = {
  get: async () => (Platform.OS === "web" ? localStorage.getItem(KEY) : AsyncStorage.getItem(KEY)),
  set: async (v: string) => (Platform.OS === "web" ? localStorage.setItem(KEY, v) : AsyncStorage.setItem(KEY, v)),
  del: async () => (Platform.OS === "web" ? localStorage.removeItem(KEY) : AsyncStorage.removeItem(KEY)),
};

export type HomeOption = { home_id: string; address: string; city: string; taken: boolean };

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
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init?.headers },
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

const call = (path: string, init?: RequestInit) => request<AppData>(path, init);

function forget() {
  token = "";
  void storage.del();
}

export const api = {
  /** Reads the stored token. True when the visitor already has a home. */
  restore: async () => {
    token = (await storage.get()) ?? "";
    return token !== "";
  },
  homes: () => request<{ homes: HomeOption[] }>("/homes-available").then((r) => r.homes),
  /** Claims a free home or signs in to a taken one, then keeps the token. */
  claim: async (homeId: string, password: string) => {
    const r = await request<{ token: string }>("/claim", { method: "POST", body: JSON.stringify({ home_id: homeId, password }) });
    token = r.token;
    await storage.set(token);
  },
  load: () => call("/me/app"),
  book: (riskId: string, bidId: string, mode: "hire" | "diy") =>
    call("/me/bookings", { method: "POST", body: JSON.stringify({ risk_id: riskId, bid_id: bidId, mode }) }),
  advance: (riskId: string) => call(`/me/bookings/${encodeURIComponent(riskId)}/advance`, { method: "POST" }),
  setReminder: (taskId: string, on: boolean) =>
    call(`/me/reminders/${encodeURIComponent(taskId)}`, { method: "PUT", body: JSON.stringify({ on }) }),
};
