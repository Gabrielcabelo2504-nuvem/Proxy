import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { ApiKey, apiKeys, InsertApiKey, InsertKeyActivityLog, InsertUser, keyActivityLogs, users, resellers, Reseller, InsertReseller } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

function requireDbInstance(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) {
    throw new Error("Banco de dados indisponível no momento.");
  }
  return db;
}

export async function listApiKeys() {
  const db = requireDbInstance(await getDb());
  return db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
}

export async function createApiKey(values: InsertApiKey) {
  const db = requireDbInstance(await getDb());
  await db.insert(apiKeys).values(values);
  const rows = await db.select().from(apiKeys).where(eq(apiKeys.code, values.code)).limit(1);
  return rows[0];
}

export async function getApiKeyByCode(code: string) {
  const db = requireDbInstance(await getDb());
  const rows = await db.select().from(apiKeys).where(eq(apiKeys.code, code)).limit(1);
  return rows[0];
}

export async function getApiKeyById(id: number) {
  const db = requireDbInstance(await getDb());
  const rows = await db.select().from(apiKeys).where(eq(apiKeys.id, id)).limit(1);
  return rows[0];
}

export async function getLogsForKey(apiKeyId: number) {
  const db = requireDbInstance(await getDb());
  return db
    .select()
    .from(keyActivityLogs)
    .where(eq(keyActivityLogs.apiKeyId, apiKeyId))
    .orderBy(desc(keyActivityLogs.createdAt));
}

export async function touchKeyAccess(id: number) {
  const db = requireDbInstance(await getDb());
  await db.update(apiKeys).set({ lastAccessAt: new Date() }).where(eq(apiKeys.id, id));
}

export async function deleteApiKeyById(id: number) {
  const db = requireDbInstance(await getDb());
  await db.delete(keyActivityLogs).where(eq(keyActivityLogs.apiKeyId, id));
  await db.delete(apiKeys).where(eq(apiKeys.id, id));
}

export async function updateKeyIp(apiKey: ApiKey, newIp: string, actorIp: string | null) {
  const db = requireDbInstance(await getDb());
  const previousIp = apiKey.authorizedIp ?? null;
  const log: InsertKeyActivityLog = {
    apiKeyId: apiKey.id,
    action: "sync_ip",
    previousIp,
    newIp,
    actorIp,
  };

  await db.insert(keyActivityLogs).values(log);
  await db
    .update(apiKeys)
    .set({ authorizedIp: newIp, lastAccessAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id));

  return getApiKeyById(apiKey.id);
}

export async function createReseller(name: string, password: string, createdBy: number) {
  const db = requireDbInstance(await getDb());
  await db.insert(resellers).values({ name, password, createdBy });
  const rows = await db.select().from(resellers).where(eq(resellers.name, name)).limit(1);
  return rows[0];
}

export async function listResellers() {
  const db = requireDbInstance(await getDb());
  return db.select().from(resellers).orderBy(desc(resellers.createdAt));
}

export async function getResellerById(id: number) {
  const db = requireDbInstance(await getDb());
  const rows = await db.select().from(resellers).where(eq(resellers.id, id)).limit(1);
  return rows[0];
}

export async function getResellerByName(name: string) {
  const db = requireDbInstance(await getDb());
  const rows = await db.select().from(resellers).where(eq(resellers.name, name)).limit(1);
  return rows[0];
}

export async function listApiKeysByReseller(resellerId: number) {
  const db = requireDbInstance(await getDb());
  return db.select().from(apiKeys).where(eq(apiKeys.resellerId, resellerId)).orderBy(desc(apiKeys.createdAt));
}

export async function deleteResellerById(id: number) {
  const db = requireDbInstance(await getDb());
  await db.delete(resellers).where(eq(resellers.id, id));
}
