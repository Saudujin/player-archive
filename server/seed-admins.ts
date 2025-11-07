import { getDb } from "./db";
import { admins } from "../drizzle/schema";
import bcrypt from "bcryptjs";

/**
 * Auto-seed admin accounts on startup
 * This ensures the 2 admin accounts always exist
 */
export async function seedAdmins() {
  try {
    const db = await getDb();
    if (!db) {
      console.log("⚠️  Database not available, skipping admin seed");
      return;
    }

    // Check if admins already exist
    const existingAdmins = await db.select().from(admins);
    
    if (existingAdmins.length >= 2) {
      console.log("✅ Admin accounts already exist");
      return;
    }

    // Delete any existing admins to start fresh
    if (existingAdmins.length > 0) {
      await db.delete(admins);
      console.log("🗑️  Cleared existing admin accounts");
    }

    // Create the 2 admin accounts with hashed passwords
    const adminAccounts = [
      {
        username: "SEF1",
        password: await bcrypt.hash("b;?eJiOv]~^H<V-$lXR3aU)5)SGO?#6%/7BT$N", 10),
      },
      {
        username: "SEF2",
        password: await bcrypt.hash("#yOR{1Ue-4Bp764S~Mo2]Q}6oE|I8d*D]\"$<(X", 10),
      },
    ];

    await db.insert(admins).values(adminAccounts);
    
    console.log("✅ Admin accounts created successfully:");
    console.log("   - SEF1");
    console.log("   - SEF2");
  } catch (error) {
    console.error("❌ Failed to seed admin accounts:", error);
  }
}
