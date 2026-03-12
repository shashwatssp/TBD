import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/notifications", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const notifs = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, userId as string));
    return res.json(notifs.reverse());
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/notifications", async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;
    if (!userId || !title || !message || !type) return res.status(400).json({ error: "Missing required fields" });
    const [notif] = await db.insert(notificationsTable).values({ userId, title, message, type }).returning();
    return res.status(201).json(notif);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/notifications/:notifId/read", async (req, res) => {
  try {
    const { notifId } = req.params;
    const [updated] = await db
      .update(notificationsTable)
      .set({ read: true })
      .where(eq(notificationsTable.id, notifId))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
