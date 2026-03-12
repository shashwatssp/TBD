import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type TaskStatus = "not_started" | "in_progress" | "completed";
export type TaskPriority = "high" | "medium" | "low";

export interface User {
  id: string;
  name: string;
  phone: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  functionId: string;
  title: string;
  description: string;
  dueDate: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  subtasks: Subtask[];
  createdAt: string;
}

export interface WeddingFunction {
  id: string;
  eventId: string;
  name: string;
  date: string | null;
  description: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface WeddingEvent {
  id: string;
  name: string;
  brideName: string;
  groomName: string;
  weddingCity: string;
  weddingDate: string;
  description: string;
  eventCode: string;
  managerId: string;
  participants: string[];
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "task_assigned" | "deadline" | "status_change" | "new_function";
  read: boolean;
  createdAt: string;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  events: WeddingEvent[];
  currentEvent: WeddingEvent | null;
  setCurrentEvent: (event: WeddingEvent | null) => void;
  functions: WeddingFunction[];
  tasks: Task[];
  notifications: Notification[];
  createEvent: (event: Omit<WeddingEvent, "id" | "eventCode" | "participants" | "createdAt">) => WeddingEvent;
  joinEvent: (code: string) => WeddingEvent | null;
  createFunction: (fn: Omit<WeddingFunction, "id" | "createdAt">) => WeddingFunction;
  createTask: (task: Omit<Task, "id" | "createdAt">) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  updateSubtask: (taskId: string, subtaskId: string, completed: boolean) => void;
  addSubtask: (taskId: string, title: string) => void;
  markNotificationRead: (id: string) => void;
  addNotification: (n: Omit<Notification, "id" | "createdAt" | "read">) => void;
  unreadCount: number;
}

const AppContext = createContext<AppContextType | null>(null);

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function generateEventCode(): string {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

const FUNCTION_PRESETS = [
  { name: "Engagement", icon: "diamond-outline", color: "#9B59B6" },
  { name: "Haldi", icon: "flower-outline", color: "#F39C12" },
  { name: "Mehendi", icon: "leaf-outline", color: "#27AE60" },
  { name: "Sangeet", icon: "musical-notes-outline", color: "#E91E63" },
  { name: "Wedding Ceremony", icon: "heart-outline", color: "#C0392B" },
  { name: "Reception", icon: "star-outline", color: "#D4A017" },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [currentEvent, setCurrentEventState] = useState<WeddingEvent | null>(null);
  const [functions, setFunctions] = useState<WeddingFunction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [u, e, ce, f, t, n] = await Promise.all([
          AsyncStorage.getItem("@vivah_user"),
          AsyncStorage.getItem("@vivah_events"),
          AsyncStorage.getItem("@vivah_current_event"),
          AsyncStorage.getItem("@vivah_functions"),
          AsyncStorage.getItem("@vivah_tasks"),
          AsyncStorage.getItem("@vivah_notifications"),
        ]);
        if (u) setUserState(JSON.parse(u));
        if (e) setEvents(JSON.parse(e));
        if (ce) setCurrentEventState(JSON.parse(ce));
        if (f) setFunctions(JSON.parse(f));
        if (t) setTasks(JSON.parse(t));
        if (n) setNotifications(JSON.parse(n));
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const persist = useCallback(async (key: string, value: unknown) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, []);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    persist("@vivah_user", u);
  }, [persist]);

  const setCurrentEvent = useCallback((ev: WeddingEvent | null) => {
    setCurrentEventState(ev);
    persist("@vivah_current_event", ev);
  }, [persist]);

  const createEvent = useCallback((eventData: Omit<WeddingEvent, "id" | "eventCode" | "participants" | "createdAt">): WeddingEvent => {
    const newEvent: WeddingEvent = {
      ...eventData,
      id: generateId(),
      eventCode: generateEventCode(),
      participants: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [...events, newEvent];
    setEvents(updated);
    persist("@vivah_events", updated);
    setCurrentEvent(newEvent);

    const defaultFunctions: WeddingFunction[] = FUNCTION_PRESETS.map((preset) => ({
      id: generateId(),
      eventId: newEvent.id,
      name: preset.name,
      date: null,
      description: "",
      icon: preset.icon,
      color: preset.color,
      createdAt: new Date().toISOString(),
    }));
    const updatedFunctions = [...functions, ...defaultFunctions];
    setFunctions(updatedFunctions);
    persist("@vivah_functions", updatedFunctions);

    return newEvent;
  }, [events, functions, persist, setCurrentEvent]);

  const joinEvent = useCallback((code: string): WeddingEvent | null => {
    const found = events.find((e) => e.eventCode === code.toUpperCase());
    if (found) {
      setCurrentEvent(found);
      return found;
    }
    return null;
  }, [events, setCurrentEvent]);

  const createFunction = useCallback((fnData: Omit<WeddingFunction, "id" | "createdAt">): WeddingFunction => {
    const newFn: WeddingFunction = {
      ...fnData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...functions, newFn];
    setFunctions(updated);
    persist("@vivah_functions", updated);
    return newFn;
  }, [functions, persist]);

  const createTask = useCallback((taskData: Omit<Task, "id" | "createdAt">): Task => {
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    persist("@vivah_tasks", updated);
    return newTask;
  }, [tasks, persist]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    const updated = tasks.map((t) => t.id === taskId ? { ...t, ...updates } : t);
    setTasks(updated);
    persist("@vivah_tasks", updated);
  }, [tasks, persist]);

  const updateSubtask = useCallback((taskId: string, subtaskId: string, completed: boolean) => {
    const updated = tasks.map((t) => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: t.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, completed } : st
        ),
      };
    });
    setTasks(updated);
    persist("@vivah_tasks", updated);
  }, [tasks, persist]);

  const addSubtask = useCallback((taskId: string, title: string) => {
    const updated = tasks.map((t) => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: [
          ...t.subtasks,
          { id: generateId(), title, completed: false },
        ],
      };
    });
    setTasks(updated);
    persist("@vivah_tasks", updated);
  }, [tasks, persist]);

  const addNotification = useCallback((n: Omit<Notification, "id" | "createdAt" | "read">) => {
    const newN: Notification = {
      ...n,
      id: generateId(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [newN, ...notifications].slice(0, 50);
    setNotifications(updated);
    persist("@vivah_notifications", updated);
  }, [notifications, persist]);

  const markNotificationRead = useCallback((id: string) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    persist("@vivah_notifications", updated);
  }, [notifications, persist]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!loaded) return null;

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        events,
        currentEvent,
        setCurrentEvent,
        functions,
        tasks,
        notifications,
        createEvent,
        joinEvent,
        createFunction,
        createTask,
        updateTask,
        updateSubtask,
        addSubtask,
        markNotificationRead,
        addNotification,
        unreadCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
