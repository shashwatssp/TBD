import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/auth/users", async (req, res) => {
  console.log(`[Auth Route] POST /auth/users called`);
  try {
    const { phone, name, role } = req.body;
    console.log(`[Auth Route] Request body:`, { phone, name, role });
    
    if (!phone || !name) {
      console.log(`[Auth Route] Validation failed: missing phone or name`);
      return res.status(400).json({ error: "phone and name are required" });
    }
    
    console.log(`[Auth Route] Checking for existing user with phone: ${phone}`);
    const existing = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
    console.log(`[Auth Route] Existing users found:`, existing.length);
    
    if (existing.length > 0) {
      const user = existing[0];
      console.log(`[Auth Route] Existing user:`, user);
      
      if (name !== user.name || (role && role !== user.role)) {
        console.log(`[Auth Route] Updating user`);
        const updated = await db
          .update(usersTable)
          .set({ name, ...(role ? { role } : {}) })
          .where(eq(usersTable.id, user.id))
          .returning();
        console.log(`[Auth Route] Updated user:`, updated[0]);
        return res.json(updated[0]);
      }
      console.log(`[Auth Route] Returning existing user (no update needed)`);
      return res.json(user);
    }
    
    console.log(`[Auth Route] Creating new user`);
    const created = await db
      .insert(usersTable)
      .values({ phone, name, role: role || "participant" })
      .returning();
    console.log(`[Auth Route] Created user:`, created[0]);
    return res.json(created[0]);
  } catch (err) {
    console.error(`[Auth Route] Error:`, err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/auth/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, name } = req.body;
    const updates: Record<string, string> = {};
    if (role) updates.role = role;
    if (name) updates.name = name;
    const updated = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
    if (!updated.length) return res.status(404).json({ error: "User not found" });
    return res.json(updated[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
