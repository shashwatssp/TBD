import { Router } from "express";
import { db } from "@workspace/db";
import { tasksTable, subtasksTable, functionsTable } from "@workspace/db/schema";
import { eq, and, inArray } from "drizzle-orm";

const router = Router();

async function getTaskWithSubtasks(taskId: string) {
  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, taskId)).limit(1);
  if (!task) return null;
  const subtasks = await db.select().from(subtasksTable).where(eq(subtasksTable.taskId, taskId));
  return { ...task, subtasks };
}

router.get("/tasks", async (req, res) => {
  try {
    const { functionId, assignedTo, eventId } = req.query;
    let tasks;
    if (functionId) {
      tasks = await db.select().from(tasksTable).where(eq(tasksTable.functionId, functionId as string));
    } else if (assignedTo && eventId) {
      const fns = await db.select().from(functionsTable).where(eq(functionsTable.eventId, eventId as string));
      if (!fns.length) return res.json([]);
      const fnIds = fns.map((f) => f.id);
      tasks = await db
        .select()
        .from(tasksTable)
        .where(and(eq(tasksTable.assignedTo, assignedTo as string), inArray(tasksTable.functionId, fnIds)));
    } else {
      return res.status(400).json({ error: "functionId or (assignedTo + eventId) required" });
    }
    const result = await Promise.all(
      tasks.map(async (t) => {
        const subtasks = await db.select().from(subtasksTable).where(eq(subtasksTable.taskId, t.id));
        return { ...t, subtasks };
      })
    );
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/tasks", async (req, res) => {
  try {
    const { functionId, title, description, dueDate, assignedTo, assignedToName, priority, status } = req.body;
    if (!functionId || !title) return res.status(400).json({ error: "functionId and title required" });
    const [task] = await db
      .insert(tasksTable)
      .values({
        functionId,
        title,
        description: description || "",
        dueDate: dueDate || null,
        assignedTo: assignedTo || null,
        assignedToName: assignedToName || null,
        priority: priority || "medium",
        status: status || "not_started",
      })
      .returning();
    return res.status(201).json({ ...task, subtasks: [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/tasks/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates: Record<string, unknown> = {};
    const fields = ["title", "description", "dueDate", "assignedTo", "assignedToName", "priority", "status"];
    for (const f of fields) {
      if (f in req.body) updates[f === "dueDate" ? "dueDate" : f === "assignedTo" ? "assignedTo" : f === "assignedToName" ? "assignedToName" : f] = req.body[f];
    }
    await db.update(tasksTable).set(updates).where(eq(tasksTable.id, taskId));
    const result = await getTaskWithSubtasks(taskId);
    if (!result) return res.status(404).json({ error: "Task not found" });
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/tasks/:taskId/subtasks", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "title required" });
    const [subtask] = await db.insert(subtasksTable).values({ taskId, title }).returning();
    return res.status(201).json(subtask);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/subtasks/:subtaskId", async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const { completed } = req.body;
    const [updated] = await db
      .update(subtasksTable)
      .set({ completed: Boolean(completed) })
      .where(eq(subtasksTable.id, subtaskId))
      .returning();
    if (!updated) return res.status(404).json({ error: "Subtask not found" });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
