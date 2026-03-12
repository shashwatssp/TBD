import { Router } from "express";
import { db } from "@workspace/db";
import {
  eventsTable, eventParticipantsTable, functionsTable, usersTable
} from "@workspace/db/schema";
import { eq, inArray } from "drizzle-orm";

const router = Router();

const DEFAULT_FUNCTIONS = [
  { name: "Haldi", icon: "sunny-outline", color: "#F0C040" },
  { name: "Mehendi", icon: "leaf-outline", color: "#2E8B57" },
  { name: "Sangeet", icon: "musical-notes-outline", color: "#9B59B6" },
  { name: "Wedding Ceremony", icon: "heart-outline", color: "#C0392B" },
  { name: "Reception", icon: "star-outline", color: "#D4A017" },
  { name: "Engagement", icon: "diamond-outline", color: "#1F5E8A" },
];

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

router.post("/events", async (req, res) => {
  try {
    const { name, brideName, groomName, weddingCity, weddingDate, description, managerId } = req.body;
    if (!name || !brideName || !groomName || !weddingCity || !weddingDate || !managerId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const eventCode = generateCode();
    const [event] = await db
      .insert(eventsTable)
      .values({ name, brideName, groomName, weddingCity, weddingDate, description: description || "", eventCode, managerId })
      .returning();

    await db.insert(eventParticipantsTable).values({ eventId: event.id, userId: managerId });

    for (const fn of DEFAULT_FUNCTIONS) {
      await db.insert(functionsTable).values({
        eventId: event.id,
        name: fn.name,
        icon: fn.icon,
        color: fn.color,
        description: "",
      });
    }

    return res.status(201).json(event);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/events/join", async (req, res) => {
  try {
    const { eventCode, userId } = req.body;
    if (!eventCode || !userId) return res.status(400).json({ error: "eventCode and userId required" });
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.eventCode, eventCode.toUpperCase())).limit(1);
    if (!event) return res.status(404).json({ error: "Event not found" });
    const existing = await db
      .select()
      .from(eventParticipantsTable)
      .where(eq(eventParticipantsTable.eventId, event.id))
      .limit(100);
    const alreadyJoined = existing.some((p) => p.userId === userId);
    if (!alreadyJoined) {
      await db.insert(eventParticipantsTable).values({ eventId: event.id, userId });
    }
    return res.json(event);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/events/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, eventId)).limit(1);
    if (!event) return res.status(404).json({ error: "Event not found" });
    return res.json(event);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/events/:eventId/participants", async (req, res) => {
  try {
    const { eventId } = req.params;
    const participants = await db
      .select()
      .from(eventParticipantsTable)
      .where(eq(eventParticipantsTable.eventId, eventId));
    if (!participants.length) return res.json([]);
    const userIds = participants.map((p) => p.userId);
    const users = await db.select().from(usersTable).where(inArray(usersTable.id, userIds));
    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
