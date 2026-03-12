import { pgTable, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["manager", "participant"]);
export const taskStatusEnum = pgEnum("task_status", ["not_started", "in_progress", "completed"]);
export const taskPriorityEnum = pgEnum("task_priority", ["high", "medium", "low"]);
export const notifTypeEnum = pgEnum("notif_type", ["task_assigned", "deadline", "status_change", "new_function"]);

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const usersTable = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(generateId),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  role: userRoleEnum("role").notNull().default("participant"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventsTable = pgTable("events", {
  id: text("id").primaryKey().$defaultFn(generateId),
  name: text("name").notNull(),
  brideName: text("bride_name").notNull(),
  groomName: text("groom_name").notNull(),
  weddingCity: text("wedding_city").notNull(),
  weddingDate: text("wedding_date").notNull(),
  description: text("description").notNull().default(""),
  eventCode: text("event_code").notNull().unique(),
  managerId: text("manager_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventParticipantsTable = pgTable("event_participants", {
  id: text("id").primaryKey().$defaultFn(generateId),
  eventId: text("event_id").notNull().references(() => eventsTable.id),
  userId: text("user_id").notNull().references(() => usersTable.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const functionsTable = pgTable("functions", {
  id: text("id").primaryKey().$defaultFn(generateId),
  eventId: text("event_id").notNull().references(() => eventsTable.id),
  name: text("name").notNull(),
  date: text("date"),
  description: text("description").notNull().default(""),
  icon: text("icon").notNull().default("calendar-outline"),
  color: text("color").notNull().default("#C0392B"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasksTable = pgTable("tasks", {
  id: text("id").primaryKey().$defaultFn(generateId),
  functionId: text("function_id").notNull().references(() => functionsTable.id),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  dueDate: text("due_date"),
  assignedTo: text("assigned_to").references(() => usersTable.id),
  assignedToName: text("assigned_to_name"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  status: taskStatusEnum("status").notNull().default("not_started"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subtasksTable = pgTable("subtasks", {
  id: text("id").primaryKey().$defaultFn(generateId),
  taskId: text("task_id").notNull().references(() => tasksTable.id),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationsTable = pgTable("notifications", {
  id: text("id").primaryKey().$defaultFn(generateId),
  userId: text("user_id").notNull().references(() => usersTable.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: notifTypeEnum("type").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true, createdAt: true });
export const insertFunctionSchema = createInsertSchema(functionsTable).omit({ id: true, createdAt: true });
export const insertTaskSchema = createInsertSchema(tasksTable).omit({ id: true, createdAt: true });
export const insertSubtaskSchema = createInsertSchema(subtasksTable).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true, createdAt: true });

export type User = typeof usersTable.$inferSelect;
export type Event = typeof eventsTable.$inferSelect;
export type EventParticipant = typeof eventParticipantsTable.$inferSelect;
export type WeddingFunction = typeof functionsTable.$inferSelect;
export type Task = typeof tasksTable.$inferSelect;
export type Subtask = typeof subtasksTable.$inferSelect;
export type Notification = typeof notificationsTable.$inferSelect;
