const BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export type UserRole = "manager" | "participant";

export interface ApiUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  createdAt: string;
}

export interface ApiEvent {
  id: string;
  name: string;
  brideName: string;
  groomName: string;
  weddingCity: string;
  weddingDate: string;
  description: string;
  eventCode: string;
  managerId: string;
  createdAt: string;
}

export interface ApiFunction {
  id: string;
  eventId: string;
  name: string;
  date: string | null;
  description: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface ApiSubtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface ApiTask {
  id: string;
  functionId: string;
  title: string;
  description: string;
  dueDate: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  priority: "high" | "medium" | "low";
  status: "not_started" | "in_progress" | "completed";
  createdAt: string;
  subtasks: ApiSubtask[];
}

export interface ApiNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "task_assigned" | "deadline" | "status_change" | "new_function";
  read: boolean;
  createdAt: string;
}

export const api = {
  upsertUser: (body: { phone: string; name: string; role?: UserRole }) =>
    req<ApiUser>("/auth/users", { method: "POST", body: JSON.stringify(body) }),

  updateUser: (userId: string, body: { role?: UserRole; name?: string }) =>
    req<ApiUser>(`/auth/users/${userId}`, { method: "PATCH", body: JSON.stringify(body) }),

  createEvent: (body: {
    name: string; brideName: string; groomName: string;
    weddingCity: string; weddingDate: string; description?: string; managerId: string;
  }) => req<ApiEvent>("/events", { method: "POST", body: JSON.stringify(body) }),

  joinEvent: (body: { eventCode: string; userId: string }) =>
    req<ApiEvent>("/events/join", { method: "POST", body: JSON.stringify(body) }),

  getEvent: (eventId: string) => req<ApiEvent>(`/events/${eventId}`),

  getParticipants: (eventId: string) => req<ApiUser[]>(`/events/${eventId}/participants`),

  getFunctions: (eventId: string) =>
    req<ApiFunction[]>(`/functions?eventId=${eventId}`),

  createFunction: (body: {
    eventId: string; name: string; date?: string | null;
    description?: string; icon: string; color: string;
  }) => req<ApiFunction>("/functions", { method: "POST", body: JSON.stringify(body) }),

  getTasks: (params: { functionId?: string; assignedTo?: string; eventId?: string }) => {
    const q = new URLSearchParams();
    if (params.functionId) q.set("functionId", params.functionId);
    if (params.assignedTo) q.set("assignedTo", params.assignedTo);
    if (params.eventId) q.set("eventId", params.eventId);
    return req<ApiTask[]>(`/tasks?${q.toString()}`);
  },

  createTask: (body: {
    functionId: string; title: string; description?: string;
    dueDate?: string | null; assignedTo?: string | null; assignedToName?: string | null;
    priority: "high" | "medium" | "low"; status: "not_started" | "in_progress" | "completed";
  }) => req<ApiTask>("/tasks", { method: "POST", body: JSON.stringify(body) }),

  updateTask: (taskId: string, body: Partial<{
    title: string; description: string; dueDate: string | null;
    assignedTo: string | null; assignedToName: string | null;
    priority: "high" | "medium" | "low"; status: "not_started" | "in_progress" | "completed";
  }>) => req<ApiTask>(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(body) }),

  addSubtask: (taskId: string, title: string) =>
    req<ApiSubtask>(`/tasks/${taskId}/subtasks`, { method: "POST", body: JSON.stringify({ title }) }),

  toggleSubtask: (subtaskId: string, completed: boolean) =>
    req<ApiSubtask>(`/subtasks/${subtaskId}`, { method: "PATCH", body: JSON.stringify({ completed }) }),

  getNotifications: (userId: string) =>
    req<ApiNotification[]>(`/notifications?userId=${userId}`),

  createNotification: (body: {
    userId: string; title: string; message: string;
    type: "task_assigned" | "deadline" | "status_change" | "new_function";
  }) => req<ApiNotification>("/notifications", { method: "POST", body: JSON.stringify(body) }),

  markNotifRead: (notifId: string) =>
    req<ApiNotification>(`/notifications/${notifId}/read`, { method: "PATCH" }),
};
