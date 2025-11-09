import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, players, playerImages, vectorLogos, InsertPlayer, InsertPlayerImage, InsertVectorLogo } from "../drizzle/schema";
import { ENV } from './_core/env';
import { extractSearchTerms, scorePlayer } from './smartSearch';

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

    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    await db
      .insert(users)
      .values(values)
      .onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Database operations
 */
const db = {
  async getAllPlayers() {
    const dbInstance = await getDb();
    if (!dbInstance) return [];
    return await dbInstance.select().from(players).orderBy(desc(players.createdAt));
  },

  async getPlayerById(id: number) {
    const dbInstance = await getDb();
    if (!dbInstance) return null;
    const result = await dbInstance.select().from(players).where(eq(players.id, id)).limit(1);
    return result.length > 0 ? result[0] : null;
  },

  async createPlayer(player: InsertPlayer) {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");
    const result = await dbInstance.insert(players).values(player);
    return result;
  },

  async updatePlayer(id: number, player: Partial<InsertPlayer>) {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");
    await dbInstance.update(players).set(player).where(eq(players.id, id));
  },

  async deletePlayer(id: number) {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");
    
    // Delete associated images first
    await dbInstance.delete(playerImages).where(eq(playerImages.playerId, id));
    
    // Delete player
    await dbInstance.delete(players).where(eq(players.id, id));
  },

  // Player Images
  async getPlayerImages(playerId: number) {
    const dbInstance = await getDb();
    if (!dbInstance) return [];
    return await dbInstance
      .select()
      .from(playerImages)
      .where(eq(playerImages.playerId, playerId))
      .orderBy(desc(playerImages.createdAt));
  },

  async createPlayerImage(image: InsertPlayerImage) {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");
    const result = await dbInstance.insert(playerImages).values(image);
    // drizzle-orm mysql2 returns [ResultSetHeader, FieldPacket[]]
    const insertId = (result as any)[0]?.insertId || (result as any).insertId;
    return Number(insertId);
  },

  async deletePlayerImage(id: number) {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");
    await dbInstance.delete(playerImages).where(eq(playerImages.id, id));
  },

  async updatePlayerImage(id: number, data: Partial<InsertPlayerImage>) {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");
    await dbInstance.update(playerImages).set(data).where(eq(playerImages.id, id));
  },

  // Vector Logos
  async createVectorLogo(logo: InsertVectorLogo) {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");
    const result = await dbInstance.insert(vectorLogos).values(logo);
    return result;
  },
};

export { db };

export async function getAllPlayers() {
  return await db.getAllPlayers();
}

export async function getPlayerById(id: number) {
  const result = await getDb();
  if (!result) return null;
  
  const playerResult = await result.select().from(players).where(eq(players.id, id)).limit(1);
  return playerResult.length > 0 ? playerResult[0] : null;
}

/**
 * ADVANCED INTELLIGENT SEARCH
 * - Supports Arabic and English
 * - Fuzzy matching for typos
 * - Searches in: names, team, keywords
 * - OR logic: returns players matching ANY search term
 * - Scored and ranked results
 */
export async function searchPlayers(query: string) {
  const dbInstance = await getDb();
  if (!dbInstance) return [];
  
  // Extract search terms
  const searchTerms = extractSearchTerms(query);
  console.log('[Search] Query:', query);
  console.log('[Search] Extracted terms:', searchTerms);
  
  // If no valid terms, return empty
  if (searchTerms.length === 0 || (searchTerms.length === 1 && searchTerms[0].trim().length === 0)) {
    return [];
  }
  
  // Get all players
  const allPlayers = await dbInstance.select().from(players).orderBy(desc(players.createdAt));
  
  // Score each player
  const scoredPlayers = allPlayers.map(player => ({
    player,
    score: scorePlayer(player, searchTerms)
  }));
  
  // Filter players with score > 0 and sort by score
  const matchedPlayers = scoredPlayers
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ player }) => player);
  
  console.log(`[Search] Found ${matchedPlayers.length} matches`);
  
  return matchedPlayers;
}

export async function createPlayer(player: InsertPlayer) {
  const dbInstance = await getDb();
  if (!dbInstance) throw new Error("Database not available");
  
  const result = await dbInstance.insert(players).values(player);
  return result;
}

export async function updatePlayer(id: number, player: Partial<InsertPlayer>) {
  const dbInstance = await getDb();
  if (!dbInstance) throw new Error("Database not available");
  
  await dbInstance.update(players).set(player).where(eq(players.id, id));
}

export async function deletePlayer(id: number) {
  const dbInstance = await getDb();
  if (!dbInstance) throw new Error("Database not available");
  
  // Delete associated images first
  await dbInstance.delete(playerImages).where(eq(playerImages.playerId, id));
  
  // Delete player
  await dbInstance.delete(players).where(eq(players.id, id));
}
