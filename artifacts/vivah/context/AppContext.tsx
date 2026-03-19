import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  upsertUser,
  updateUser,
  createEvent as createEventFirebase,
  joinEvent as joinEventFirebase,
  getEvent,
  getParticipants,
  getFunctions,
  createFunction as createFunctionFirebase,
  getTask as getTaskFirebase,
  getTasks,
  createTask as createTaskFirebase,
  updateTask as updateTaskFirebase,
  addSubtask as addSubtaskFirebase,
  toggleSubtask as toggleSubtaskFirebase,
  getNotifications,
  createNotification as createNotificationFirebase,
  markNotificationRead as markNotificationReadFirebase,
  createGuestFamily as createGuestFamilyFirebase,
  getGuestFamilies,
  updateGuestFamily as updateGuestFamilyFirebase,
  deleteGuestFamily as deleteGuestFamilyFirebase,
  getGuestFamilyWithGuests as getGuestFamilyWithGuestsFirebase,
  createGuest as createGuestFirebase,
  getGuests,
  updateGuest as updateGuestFirebase,
  deleteGuest as deleteGuestFirebase,
  getGuestStats as getGuestStatsFirebase,
  generateInvitationData,
  WEDDING_TYPE_FUNCTIONS,
  FirebaseEvent,
  FirebaseFunction,
  FirebaseNotification,
  FirebaseSubtask,
  FirebaseTask,
  FirebaseUser,
  GuestFamily,
  Guest,
  WeddingType,
  RSVPStatus,
  UserRole
} from "@/lib/firebaseService";

export type TaskStatus = "not_started" | "in_progress" | "completed";
export type TaskPriority = "high" | "medium" | "low";
export type { UserRole, WeddingType, RSVPStatus };

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
}

export type Subtask = FirebaseSubtask;
export type Task = FirebaseTask;
export type WeddingFunction = FirebaseFunction;
export type WeddingEvent = FirebaseEvent;
export type Notification = FirebaseNotification;
export type GuestFamilyType = GuestFamily;
export type GuestType = Guest;

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => Promise<void>;
  updateUserRole: (role: UserRole) => Promise<void>;
  currentEvent: WeddingEvent | null;
  setCurrentEvent: (event: WeddingEvent | null) => Promise<void>;
  participants: FirebaseUser[];
  functions: WeddingFunction[];
  tasks: Task[];
  notifications: Notification[];
  guestFamilies: GuestFamilyType[];
  guests: GuestType[];
  loadingFunctions: boolean;
  loadingTasks: boolean;
  loadingGuests: boolean;
  logout: () => Promise<void>;
  createEvent: (managerId: string, event: {
    name: string; brideName: string; groomName: string;
    weddingCity: string; weddingDate: string; weddingType?: WeddingType | null;
    venue?: string | null; location?: string | null; budget?: number | null;
    description?: string;
  }) => Promise<WeddingEvent>;
  joinEvent: (userId: string, code: string) => Promise<WeddingEvent>;
  createFunction: (eventId: string, fn: {
    name: string; date?: string | null; description?: string; icon: string; color: string;
  }) => Promise<WeddingFunction>;
  refreshFunctions: () => Promise<void>;
  loadTasksForFunction: (functionId: string) => Promise<Task[]>;
  getTask: (taskId: string) => Promise<Task>;
  createTask: (task: {
    functionId: string; title: string; description?: string; dueDate?: string | null;
    assignedTo?: string | null; assignedToName?: string | null;
    priority: TaskPriority; status: TaskStatus; budget?: number | null;
  }) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<Task>;
  addSubtask: (taskId: string, title: string) => Promise<Subtask>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  addNotification: (n: { userId: string; title: string; message: string; type: Notification["type"] }) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshParticipants: () => Promise<void>;
  unreadCount: number;
  // Guest Management
  createGuestFamily: (data: Omit<GuestFamilyType, 'id' | 'createdAt' | 'updatedAt'>) => Promise<GuestFamilyType>;
  updateGuestFamily: (familyId: string, updates: Partial<GuestFamilyType>) => Promise<GuestFamilyType>;
  deleteGuestFamily: (familyId: string) => Promise<void>;
  getGuestFamilyWithGuests: (familyId: string) => Promise<GuestFamilyType & { guests: GuestType[] }>;
  createGuest: (data: Omit<GuestType, 'id' | 'createdAt' | 'updatedAt'>) => Promise<GuestType>;
  updateGuest: (guestId: string, updates: Partial<GuestType>) => Promise<GuestType>;
  deleteGuest: (guestId: string) => Promise<void>;
  refreshGuests: () => Promise<void>;
  getGuestStats: (eventId?: string) => Promise<{total: number; accepted: number; declined: number; pending: number; accommodationRequired: number}>;
  generateInvitation: (eventId: string, familyId?: string) => Promise<{
    wedding: WeddingEvent;
    family?: GuestFamilyType & { guests: GuestType[] };
    guests: GuestType[];
    qrCodeUrl: string;
    rsvpLink: string;
  }>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [currentEvent, setCurrentEventState] = useState<WeddingEvent | null>(null);
  const [participants, setParticipants] = useState<FirebaseUser[]>([]);
  const [functions, setFunctions] = useState<WeddingFunction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [guestFamilies, setGuestFamilies] = useState<GuestFamilyType[]>([]);
  const [guests, setGuests] = useState<GuestType[]>([]);
  const [loadingFunctions, setLoadingFunctions] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const eventIdRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [u, ce] = await Promise.all([
          AsyncStorage.getItem("@vivah_user"),
          AsyncStorage.getItem("@vivah_current_event"),
        ]);
        if (u) {
          const parsedUser = JSON.parse(u);
          // Validate user has required fields
          if (parsedUser && parsedUser.id && parsedUser.name && parsedUser.phone && parsedUser.role) {
            setUserState(parsedUser);
          } else {
            console.error("Invalid user data in AsyncStorage, clearing it");
            await AsyncStorage.removeItem("@vivah_user");
          }
        }
        if (ce) setCurrentEventState(JSON.parse(ce));
      } catch (e) {
        console.error("Error loading data from AsyncStorage:", e);
      }
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
    loadGuests(eid);
  }, [currentEvent?.id, user]);

  useEffect(() => {
    if (!user) return;
    loadNotifications(user.id);
  }, [user?.id]);

  const loadFunctions = async (eventId: string) => {
    setLoadingFunctions(true);
    try {
      const fns = await getFunctions(eventId);
      setFunctions(fns);
    } catch (e) {
      console.error("loadFunctions error", e);
    } finally {
      setLoadingFunctions(false);
    }
  };

  const loadParticipants = async (eventId: string) => {
    try {
      const p = await getParticipants(eventId);
      setParticipants(p);
    } catch (e) {
      console.error("loadParticipants error", e);
    }
  };

  const loadNotifications = async (userId: string) => {
    try {
      const n = await getNotifications(userId);
      setNotifications(n);
    } catch {}
  };

  const loadGuests = async (eventId: string) => {
    setLoadingGuests(true);
    try {
      const [families, guestList] = await Promise.all([
        getGuestFamilies(eventId),
        getGuests(eventId)
      ]);
      setGuestFamilies(families);
      setGuests(guestList);
    } catch (e) {
      console.error("loadGuests error", e);
    } finally {
      setLoadingGuests(false);
    }
  };

  const setUser = useCallback(async (u: User | null) => {
    if (u) {
      // Validate user has required fields
      if (!u.id || !u.name || !u.phone || !u.role) {
        console.error("Invalid user object, missing required fields:", u);
        throw new Error("Invalid user object: missing required fields (id, name, phone, role)");
      }
      setUserState(u);
      await AsyncStorage.setItem("@vivah_user", JSON.stringify(u));
    } else {
      setUserState(u);
      await AsyncStorage.removeItem("@vivah_user");
    }
  }, []);

  const updateUserRole = useCallback(async (role: UserRole) => {
    if (!user) return;
    try {
      const updated = await updateUser(user.id, { role });
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

  const createEvent = useCallback(async (managerId: string, data: {
    name: string; brideName: string; groomName: string;
    weddingCity: string; weddingDate: string; weddingType?: WeddingType | null;
    venue?: string | null; location?: string | null; budget?: number | null;
    description?: string;
  }): Promise<WeddingEvent> => {
    if (!user) throw new Error("Not logged in");
    if (!managerId) {
      console.error("managerId is undefined in createEvent");
      throw new Error("managerId is required to create an event");
    }
    console.log("Creating event with managerId:", managerId);
    const event = await createEventFirebase({ ...data, managerId });
    await setCurrentEvent(event);
    eventIdRef.current = null;
    return event;
  }, [user, setCurrentEvent]);

  const joinEvent = useCallback(async (userId: string, code: string): Promise<WeddingEvent> => {
    if (!user) throw new Error("Not logged in");
    const event = await joinEventFirebase(code, userId);
    await setCurrentEvent(event);
    eventIdRef.current = null;
    return event;
  }, [user, setCurrentEvent]);

  const createFunction = useCallback(async (eventId: string, fn: {
    name: string; date?: string | null; description?: string; icon: string; color: string;
  }): Promise<WeddingFunction> => {
    if (!currentEvent) throw new Error("No event selected");
    const created = await createFunctionFirebase({ ...fn, eventId });
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
      const t = await getTasks({ functionId });
      setTasks((prev) => {
        const without = prev.filter((x) => x.functionId !== functionId);
        return [...without, ...t];
      });
      return t;
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  const getTask = useCallback(async (taskId: string): Promise<Task> => {
    return await getTaskFirebase(taskId);
  }, []);

  const createTask = useCallback(async (task: {
    functionId: string; title: string; description?: string; dueDate?: string | null;
    assignedTo?: string | null; assignedToName?: string | null;
    priority: TaskPriority; status: TaskStatus; budget?: number | null;
  }): Promise<Task> => {
    const created = await createTaskFirebase({ description: "", ...task });
    setTasks((prev) => [...prev, created]);
    return created;
  }, []);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    const updated = await updateTaskFirebase(taskId, updates);
    setTasks((prev) => prev.map((t) => t.id === taskId ? updated : t));
    return updated;
  }, []);

  const addSubtask = useCallback(async (taskId: string, title: string): Promise<Subtask> => {
    const subtask = await addSubtaskFirebase(taskId, title);
    setTasks((prev) => prev.map((t) => {
      if (t.id !== taskId) return t;
      return { ...t, subtasks: [...t.subtasks, subtask] };
    }));
    return subtask;
  }, []);

  const toggleSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    const subtask = tasks.find(t => t.id === taskId)?.subtasks.find(st => st.id === subtaskId);
    if (!subtask) return;
    await toggleSubtaskFirebase(subtaskId, !subtask.completed);
    setTasks((prev) => prev.map((t) => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: t.subtasks.map((st) => st.id === subtaskId ? { ...st, completed: !st.completed } : st),
      };
    }));
  }, [tasks]);

  const addNotification = useCallback(async (n: {
    userId: string; title: string; message: string; type: Notification["type"];
  }) => {
    try {
      const created = await createNotificationFirebase(n);
      setNotifications((prev) => [created, ...prev]);
    } catch {}
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await markNotificationReadFirebase(id);
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

  // Guest Management Functions
  const createGuestFamily = useCallback(async (data: Omit<GuestFamilyType, 'id' | 'createdAt' | 'updatedAt'>): Promise<GuestFamilyType> => {
    const created = await createGuestFamilyFirebase(data);
    setGuestFamilies((prev) => [...prev, created]);
    return created;
  }, []);

  const updateGuestFamily = useCallback(async (familyId: string, updates: Partial<GuestFamilyType>): Promise<GuestFamilyType> => {
    const updated = await updateGuestFamilyFirebase(familyId, updates);
    setGuestFamilies((prev) => prev.map((f) => f.id === familyId ? updated : f));
    return updated;
  }, []);

  const deleteGuestFamily = useCallback(async (familyId: string): Promise<void> => {
    await deleteGuestFamilyFirebase(familyId);
    setGuestFamilies((prev) => prev.filter((f) => f.id !== familyId));
    setGuests((prev) => prev.filter((g) => g.familyId !== familyId));
  }, []);

  const getGuestFamilyWithGuests = useCallback(async (familyId: string): Promise<GuestFamilyType & { guests: GuestType[] }> => {
    return await getGuestFamilyWithGuestsFirebase(familyId);
  }, []);

  const createGuest = useCallback(async (data: Omit<GuestType, 'id' | 'createdAt' | 'updatedAt'>): Promise<GuestType> => {
    const created = await createGuestFirebase(data);
    setGuests((prev) => [...prev, created]);
    return created;
  }, []);

  const updateGuest = useCallback(async (guestId: string, updates: Partial<GuestType>): Promise<GuestType> => {
    const updated = await updateGuestFirebase(guestId, updates);
    setGuests((prev) => prev.map((g) => g.id === guestId ? updated : g));
    return updated;
  }, []);

  const deleteGuest = useCallback(async (guestId: string): Promise<void> => {
    await deleteGuestFirebase(guestId);
    setGuests((prev) => prev.filter((g) => g.id !== guestId));
  }, []);

  const refreshGuests = useCallback(async () => {
    if (!currentEvent) return;
    await loadGuests(currentEvent.id);
  }, [currentEvent]);

  const getGuestStats = useCallback(async (eventId?: string): Promise<{total: number; accepted: number; declined: number; pending: number; accommodationRequired: number}> => {
    const id = eventId || currentEvent?.id;
    if (!id) {
      return { total: 0, accepted: 0, declined: 0, pending: 0, accommodationRequired: 0 };
    }
    return await getGuestStatsFirebase(id);
  }, [currentEvent]);

  const generateInvitation = useCallback(async (eventId: string, familyId?: string): Promise<{
    wedding: WeddingEvent;
    family?: GuestFamilyType & { guests: GuestType[] };
    guests: GuestType[];
    qrCodeUrl: string;
    rsvpLink: string;
  }> => {
    return await generateInvitationData(eventId, familyId);
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log("Starting logout process");
      
      // Clear all AsyncStorage data
      await AsyncStorage.multiRemove([
        "@vivah_user",
        "@vivah_current_event"
      ]);
      
      // Clear all state
      setUserState(null);
      setCurrentEventState(null);
      setParticipants([]);
      setFunctions([]);
      setTasks([]);
      setNotifications([]);
      setGuestFamilies([]);
      setGuests([]);
      setLoadingFunctions(false);
      setLoadingTasks(false);
      setLoadingGuests(false);
      eventIdRef.current = null;
      
      console.log("Logout completed successfully");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }, []);

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
        guestFamilies,
        guests,
        loadingFunctions,
        loadingTasks,
        loadingGuests,
        createEvent,
        joinEvent,
        createFunction,
        refreshFunctions,
        loadTasksForFunction,
        getTask,
        createTask,
        updateTask,
        addSubtask,
        toggleSubtask,
        markNotificationRead,
        addNotification,
        refreshNotifications,
        refreshParticipants,
        unreadCount,
        createGuestFamily,
        updateGuestFamily,
        deleteGuestFamily,
        getGuestFamilyWithGuests,
        createGuest,
        updateGuest,
        deleteGuest,
        refreshGuests,
        getGuestStats,
        generateInvitation,
        logout,
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
