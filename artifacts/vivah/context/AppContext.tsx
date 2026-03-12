import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { api, ApiEvent, ApiFunction, ApiNotification, ApiSubtask, ApiTask, ApiUser, UserRole } from "@/lib/api";

export type TaskStatus = "not_started" | "in_progress" | "completed";
export type TaskPriority = "high" | "medium" | "low";
export type { UserRole };

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
}

export type Subtask = ApiSubtask;
export type Task = ApiTask;
export type WeddingFunction = ApiFunction;
export type WeddingEvent = ApiEvent;
export type Notification = ApiNotification;

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => Promise<void>;
  updateUserRole: (role: UserRole) => Promise<void>;
  currentEvent: WeddingEvent | null;
  setCurrentEvent: (event: WeddingEvent | null) => Promise<void>;
  participants: ApiUser[];
  functions: WeddingFunction[];
  tasks: Task[];
  notifications: Notification[];
  loadingFunctions: boolean;
  loadingTasks: boolean;
  createEvent: (event: {
    name: string; brideName: string; groomName: string;
    weddingCity: string; weddingDate: string; description?: string;
  }) => Promise<WeddingEvent>;
  joinEvent: (code: string) => Promise<WeddingEvent>;
  createFunction: (fn: {
    name: string; date?: string | null; description?: string; icon: string; color: string;
  }) => Promise<WeddingFunction>;
  refreshFunctions: () => Promise<void>;
  loadTasksForFunction: (functionId: string) => Promise<Task[]>;
  createTask: (task: {
    functionId: string; title: string; description?: string; dueDate?: string | null;
    assignedTo?: string | null; assignedToName?: string | null;
    priority: TaskPriority; status: TaskStatus;
  }) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<Task>;
  addSubtask: (taskId: string, title: string) => Promise<Subtask>;
  toggleSubtask: (taskId: string, subtaskId: string, completed: boolean) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  addNotification: (n: { userId: string; title: string; message: string; type: Notification["type"] }) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshParticipants: () => Promise<void>;
  unreadCount: number;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [currentEvent, setCurrentEventState] = useState<WeddingEvent | null>(null);
  const [participants, setParticipants] = useState<ApiUser[]>([]);
  const [functions, setFunctions] = useState<WeddingFunction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingFunctions, setLoadingFunctions] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const eventIdRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [u, ce] = await Promise.all([
          AsyncStorage.getItem("@vivah_user"),
          AsyncStorage.getItem("@vivah_current_event"),
        ]);
        if (u) setUserState(JSON.parse(u));
        if (ce) setCurrentEventState(JSON.parse(ce));
      } catch {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!currentEvent || !user) return;
    const eid = currentEvent.id;
    if (eventIdRef.current === eid) return;
    eventIdRef.current = eid;
    loadFunctions(eid);
    loadParticipants(eid);
  }, [currentEvent?.id, user]);

  useEffect(() => {
    if (!user) return;
    loadNotifications(user.id);
  }, [user?.id]);

  const loadFunctions = async (eventId: string) => {
    setLoadingFunctions(true);
    try {
      const fns = await api.getFunctions(eventId);
      setFunctions(fns);
    } catch (e) {
      console.error("loadFunctions error", e);
    } finally {
      setLoadingFunctions(false);
    }
  };

  const loadParticipants = async (eventId: string) => {
    try {
      const p = await api.getParticipants(eventId);
      setParticipants(p);
    } catch (e) {
      console.error("loadParticipants error", e);
    }
  };

  const loadNotifications = async (userId: string) => {
    try {
      const n = await api.getNotifications(userId);
      setNotifications(n);
    } catch {}
  };

  const setUser = useCallback(async (u: User | null) => {
    setUserState(u);
    if (u) await AsyncStorage.setItem("@vivah_user", JSON.stringify(u));
    else await AsyncStorage.removeItem("@vivah_user");
  }, []);

  const updateUserRole = useCallback(async (role: UserRole) => {
    if (!user) return;
    try {
      const updated = await api.updateUser(user.id, { role });
      const newUser = { ...user, role: updated.role };
      setUserState(newUser);
      await AsyncStorage.setItem("@vivah_user", JSON.stringify(newUser));
    } catch (e) {
      console.error("updateUserRole error", e);
    }
  }, [user]);

  const setCurrentEvent = useCallback(async (ev: WeddingEvent | null) => {
    setCurrentEventState(ev);
    if (ev) await AsyncStorage.setItem("@vivah_current_event", JSON.stringify(ev));
    else await AsyncStorage.removeItem("@vivah_current_event");
  }, []);

  const createEvent = useCallback(async (data: {
    name: string; brideName: string; groomName: string;
    weddingCity: string; weddingDate: string; description?: string;
  }): Promise<WeddingEvent> => {
    if (!user) throw new Error("Not logged in");
    const event = await api.createEvent({ ...data, managerId: user.id });
    await setCurrentEvent(event);
    eventIdRef.current = null;
    return event;
  }, [user, setCurrentEvent]);

  const joinEvent = useCallback(async (code: string): Promise<WeddingEvent> => {
    if (!user) throw new Error("Not logged in");
    const event = await api.joinEvent({ eventCode: code, userId: user.id });
    await setCurrentEvent(event);
    eventIdRef.current = null;
    return event;
  }, [user, setCurrentEvent]);

  const createFunction = useCallback(async (fn: {
    name: string; date?: string | null; description?: string; icon: string; color: string;
  }): Promise<WeddingFunction> => {
    if (!currentEvent) throw new Error("No event selected");
    const created = await api.createFunction({ ...fn, eventId: currentEvent.id });
    setFunctions((prev) => [...prev, created]);
    return created;
  }, [currentEvent]);

  const refreshFunctions = useCallback(async () => {
    if (!currentEvent) return;
    await loadFunctions(currentEvent.id);
  }, [currentEvent]);

  const loadTasksForFunction = useCallback(async (functionId: string): Promise<Task[]> => {
    setLoadingTasks(true);
    try {
      const t = await api.getTasks({ functionId });
      setTasks((prev) => {
        const without = prev.filter((x) => x.functionId !== functionId);
        return [...without, ...t];
      });
      return t;
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  const createTask = useCallback(async (task: {
    functionId: string; title: string; description?: string; dueDate?: string | null;
    assignedTo?: string | null; assignedToName?: string | null;
    priority: TaskPriority; status: TaskStatus;
  }): Promise<Task> => {
    const created = await api.createTask({ description: "", ...task });
    setTasks((prev) => [...prev, created]);
    return created;
  }, []);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    const updated = await api.updateTask(taskId, updates);
    setTasks((prev) => prev.map((t) => t.id === taskId ? updated : t));
    return updated;
  }, []);

  const addSubtask = useCallback(async (taskId: string, title: string): Promise<Subtask> => {
    const subtask = await api.addSubtask(taskId, title);
    setTasks((prev) => prev.map((t) => {
      if (t.id !== taskId) return t;
      return { ...t, subtasks: [...t.subtasks, subtask] };
    }));
    return subtask;
  }, []);

  const toggleSubtask = useCallback(async (taskId: string, subtaskId: string, completed: boolean) => {
    await api.toggleSubtask(subtaskId, completed);
    setTasks((prev) => prev.map((t) => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: t.subtasks.map((st) => st.id === subtaskId ? { ...st, completed } : st),
      };
    }));
  }, []);

  const addNotification = useCallback(async (n: {
    userId: string; title: string; message: string; type: Notification["type"];
  }) => {
    try {
      const created = await api.createNotification(n);
      setNotifications((prev) => [created, ...prev]);
    } catch {}
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await api.markNotifRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch {}
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    await loadNotifications(user.id);
  }, [user]);

  const refreshParticipants = useCallback(async () => {
    if (!currentEvent) return;
    await loadParticipants(currentEvent.id);
  }, [currentEvent]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!loaded) return null;

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        updateUserRole,
        currentEvent,
        setCurrentEvent,
        participants,
        functions,
        tasks,
        notifications,
        loadingFunctions,
        loadingTasks,
        createEvent,
        joinEvent,
        createFunction,
        refreshFunctions,
        loadTasksForFunction,
        createTask,
        updateTask,
        addSubtask,
        toggleSubtask,
        markNotificationRead,
        addNotification,
        refreshNotifications,
        refreshParticipants,
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
