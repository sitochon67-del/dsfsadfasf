import * as nodeCrypto from "crypto";

// Polyfill global crypto for MongoDB driver ScramSHA-256 auth in Node.js
if (typeof (globalThis as any).crypto === "undefined") {
  (globalThis as any).crypto = nodeCrypto;
}
if (!(globalThis as any).crypto?.getRandomValues) {
  (globalThis as any).crypto.getRandomValues = function (buffer: any) {
    return nodeCrypto.randomFillSync(buffer);
  };
}
if (!(globalThis as any).crypto?.randomBytes) {
  (globalThis as any).crypto.randomBytes = nodeCrypto.randomBytes;
}

import dotenv from "dotenv";
import { MongoClient, type Db } from "mongodb";

dotenv.config();

let clientPromise: Promise<MongoClient> | null = null;
let dbPromise: Promise<Db> | null = null;

function getMongoUri(): string {
  const uri =
    process.env.BODEGA_MONGO_URI?.trim() ||
    process.env.MONGODB_URI?.trim() ||
    "";

  if (!uri) {
    throw new Error("Mongo no configurado: BODEGA_MONGO_URI o MONGODB_URI");
  }

  return uri;
}

function getMongoDbName(): string {
  const explicit =
    process.env.BODEGA_MONGO_DB_NAME?.trim() ||
    process.env.MONGODB_DB_NAME?.trim();
  if (explicit) return explicit;

  const uri = getMongoUri();
  try {
    const parsed = new URL(uri);
    const pathname = parsed.pathname.replace(/^\/+/, "").trim();
    if (pathname) return pathname;
  } catch {
    // no-op
  }

  throw new Error("Mongo no configurado: BODEGA_MONGO_DB_NAME o MONGODB_DB_NAME");
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const client = new MongoClient(getMongoUri(), {
        maxPoolSize: Math.max(10, Number(process.env.BODEGA_MONGO_MAX_POOL_SIZE || 25)),
      });
      await client.connect();
      return client;
    })();
  }

  return clientPromise;
}

export async function getMongoDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const client = await getMongoClient();
      return client.db(getMongoDbName());
    })();
  }

  return dbPromise;
}
