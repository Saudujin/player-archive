import { eq, desc, asc, like, or, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, players, playerImages, vectorLogos, InsertPlayer, InsertPlayerImage, InsertVectorLogo } from "../drizzle/schema";
import { ENV } from './_core/env';
import { extractNames, normalizeArabic, normalizeEnglish } from './smartSearch';

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

// Player queries
export async function getAllPlayers() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(players).orderBy(desc(players.createdAt));
}

export async function getPlayerById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(players).where(eq(players.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function searchPlayers(query: string) {
  const db = await getDb();
  if (!db) return [];
  
  // Extract names from natural language query
  const names = extractNames(query);
  console.log('[Search] Query:', query);
  console.log('[Search] Extracted names:', names);
  
  // Get all players
  const allPlayers = await db.select().from(players).orderBy(desc(players.createdAt));
  
  // If no names extracted, return empty
  if (names.length === 0) return [];
  
  // Track which players match which search terms
  const playerMatches = new Map<number, number>();
  
  // Filter players that match ALL extracted names (AND logic)
  const matchedPlayers = allPlayers.filter(player => {
    // Parse keywords if it's JSON
    let keywordsArray: string[] = [];
    try {
      const parsed = player.keywords ? JSON.parse(player.keywords) : [];
      keywordsArray = Array.isArray(parsed) ? parsed : [];
    } catch {
      keywordsArray = [];
    }
    
    // Build searchable fields separately for better matching
    const searchFields = [
      player.nameArabic || '',
      player.nameEnglish || '',
      player.alternativeNames || '',
      player.teamName || '',
      ...keywordsArray
    ];
    
    // Normalize all fields
    const normalizedFields = searchFields.map(field => {
      const lower = field.toLowerCase();
      return normalizeArabic(lower) + ' ' + normalizeEnglish(lower);
    });
    
    // Check if ALL names match (each name must match at least one field)
    const allNamesMatch = names.every(name => {
      const normalizedName = normalizeArabic(name.toLowerCase()) + ' ' + normalizeEnglish(name.toLowerCase());
      return normalizedFields.some(field => field.includes(normalizedName));
    });
    
    if (allNamesMatch) {
      // Count how many search terms matched
      const matchCount = names.filter(name => {
        const normalizedName = normalizeArabic(name.toLowerCase()) + ' ' + normalizeEnglish(name.toLowerCase());
        return normalizedFields.some(field => field.includes(normalizedName));
      }).length;
      playerMatches.set(player.id, matchCount);
    }
    
    return allNamesMatch;
  });
  
  // Sort by number of matches (more matches = higher relevance)
  return matchedPlayers.sort((a, b) => {
    const matchesA = playerMatches.get(a.id) || 0;
    const matchesB = playerMatches.get(b.id) || 0;
    return matchesB - matchesA;
  });
}

export async function createPlayer(player: InsertPlayer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(players).values(player);
  return result[0].insertId;
}

export async function updatePlayer(id: number, player: Partial<InsertPlayer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(players).set(player).where(eq(players.id, id));
}

export async function deletePlayer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete related images first
  await db.delete(playerImages).where(eq(playerImages.playerId, id));
  await db.delete(vectorLogos).where(eq(vectorLogos.playerId, id));
  
  // Delete player
  await db.delete(players).where(eq(players.id, id));
}

// Player images queries
export async function getPlayerImages(playerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(playerImages)
    .where(eq(playerImages.playerId, playerId))
    .orderBy(desc(playerImages.uploadedAt));
}

export async function getImageById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(playerImages).where(eq(playerImages.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createPlayerImage(image: InsertPlayerImage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(playerImages).values(image);
  return result[0].insertId;
}

export async function deletePlayerImage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(playerImages).where(eq(playerImages.id, id));
}

// Vector logos queries
export async function getPlayerVectorLogos(playerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(vectorLogos)
    .where(eq(vectorLogos.playerId, playerId))
    .orderBy(desc(vectorLogos.createdAt));
}

export async function createVectorLogo(logo: InsertVectorLogo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(vectorLogos).values(logo);
  return result[0].insertId;
}

export async function deleteVectorLogo(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(vectorLogos).where(eq(vectorLogos.id, id));
}
