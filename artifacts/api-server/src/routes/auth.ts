import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/auth/users", async (req, res) => {
  try {
    const { phone, name, role } = req.body;
    if (!phone || !name) {
      return res.status(400).json({ error: "phone and name are required" });
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
    if (existing.length > 0) {
      const user = existing[0];
      if (name !== user.name || (role && role !== user.role)) {
        const updated = await db
          .update(usersTable)
          .set({ name, ...(role ? { role } : {}) })
          .where(eq(usersTable.id, user.id))
          .returning();
        return res.json(updated[0]);
      }
      return res.json(user);
    }
    const created = await db
      .insert(usersTable)
      .values({ phone, name, role: role || "participant" })
      .returning();
    return res.json(created[0]);
  } catch (err) {
    console.error(err);
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
