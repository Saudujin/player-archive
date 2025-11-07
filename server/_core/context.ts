import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getAdminSession } from "../adminSession";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { users } from "../../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // First, check for admin session cookie
  const adminSessionId = opts.req.cookies?.['admin_session'];
  if (adminSessionId) {
    const adminSession = getAdminSession(adminSessionId);
    if (adminSession) {
      // Get user record for this admin
      const db = await getDb();
      if (db) {
        const adminOpenId = `admin_${adminSession.username}`;
        const userRecord = await db
          .select()
          .from(users)
          .where(eq(users.openId, adminOpenId))
          .limit(1);
        if (userRecord.length > 0) {
          user = userRecord[0];
        }
      }
    }
  }

  // If no admin session, try OAuth authentication
  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
