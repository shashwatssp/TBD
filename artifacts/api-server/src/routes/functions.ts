import { Router } from "express";
import { db } from "@workspace/db";
import { functionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/functions", async (req, res) => {
  try {
    const { eventId } = req.query;
    if (!eventId) return res.status(400).json({ error: "eventId is required" });
    const fns = await db.select().from(functionsTable).where(eq(functionsTable.eventId, eventId as string));
    return res.json(fns);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/functions", async (req, res) => {
  try {
    const { eventId, name, date, description, icon, color } = req.body;
    if (!eventId || !name) return res.status(400).json({ error: "eventId and name required" });
    const [fn] = await db
      .insert(functionsTable)
      .values({ eventId, name, date: date || null, description: description || "", icon: icon || "calendar-outline", color: color || "#C0392B" })
      .returning();
    return res.status(201).json(fn);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
