import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { eq } from "drizzle-orm";
import { admins } from "../../drizzle/schema";
import { getDb } from "../db";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

export const adminRouter = router({
  /**
   * Login with username and password
   */
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Find admin by username
      const admin = await db
        .select()
        .from(admins)
        .where(eq(admins.username, input.username))
        .limit(1);

      if (admin.length === 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "اسم المستخدم أو كلمة المرور غير صحيحة",
        });
      }

      // Verify password
      const isValid = await bcrypt.compare(input.password, admin[0].password);
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "اسم المستخدم أو كلمة المرور غير صحيحة",
        });
      }

      // Return admin info (without password)
      return {
        id: admin[0].id,
        username: admin[0].username,
      };
    }),

  /**
   * Seed initial admins (for setup only)
   * This should be called once to create the 2 admin accounts
   */
  seedAdmins: publicProcedure
    .input(
      z.object({
        admins: z.array(
          z.object({
            username: z.string(),
            password: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Check if admins already exist
      const existingAdmins = await db.select().from(admins);
      if (existingAdmins.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Admins already exist",
        });
      }

      // Hash passwords and insert
      const hashedAdmins = await Promise.all(
        input.admins.map(async (admin) => ({
          username: admin.username,
          password: await bcrypt.hash(admin.password, 10),
        }))
      );

      await db.insert(admins).values(hashedAdmins);

      return { success: true, count: hashedAdmins.length };
    }),
});
