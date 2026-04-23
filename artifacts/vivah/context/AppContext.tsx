import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { BackHandler, Platform } from "react-native";
import {
  upsertUser,
  updateUser,
  createEvent as createEventFirebase,
  joinEvent as joinEventFirebase,
  getEvent,
  getParticipants,
  addParticipant as addParticipantFirebase,
  deleteParticipant as deleteParticipantFirebase,
  getFunctions,
  createFunction as createFunctionFirebase,
  updateFunction as updateFunctionFirebase,
  deleteFunction as deleteFunctionFirebase,
  getTask as getTaskFirebase,
  getTasks,
  createTask as createTaskFirebase,
  updateTask as updateTaskFirebase,
  deleteTask as deleteTaskFirebase,
  addSubtask as addSubtaskFirebase,
  toggleSubtask as toggleSubtaskFirebase,
  updateSubtask as updateSubtaskFirebase,
  deleteSubtask as deleteSubtaskFirebase,
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
  UserRole,
  Comment,
  FileAttachment,
  Poll,
  PollOption,
  getComments as getCommentsFirebase,
  addComment as addCommentFirebase,
  updateComment as updateCommentFirebase,
  deleteComment as deleteCommentFirebase,
  uploadFileAttachment as uploadFileAttachmentFirebase,
  getFileAttachments as getFileAttachmentsFirebase,
  deleteFileAttachment as deleteFileAttachmentFirebase,
  createPoll as createPollFirebase,
  getPolls as getPollsFirebase,
  getPoll as getPollFirebase,
  voteOnPoll as voteOnPollFirebase,
  closePoll as closePollFirebase,
  deletePoll as deletePollFirebase,
  getUserVote as getUserVoteFirebase,
  addManager as addManagerFirebase,
  removeManager as removeManagerFirebase,
  getManagers as getManagersFirebase,
  isEventManager as isEventManagerFirebase,
  upgradeSubscription as upgradeSubscriptionFirebase,
  downgradeSubscription as downgradeSubscriptionFirebase,
  canCreateMultipleEvents,
  canHaveMultipleManagers,
  canUseFileAttachments,
  canUsePolls,
  getMaxTasks,
  getMaxGuests,
  getMaxFunctions,
  getMaxManagers,
  SubscriptionTier
} from "@/lib/firebaseService";

export type TaskStatus = "not_started" | "in_progress" | "completed";
export type TaskPriority = "high" | "medium" | "low";
export type { UserRole, WeddingType, RSVPStatus };

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
}

export type Subtask = FirebaseSubtask;
export type Task = FirebaseTask;
export type WeddingFunction = FirebaseFunction;
export type WeddingEvent = FirebaseEvent;
export type Notification = FirebaseNotification;
export type GuestFamilyType = GuestFamily;
export type GuestType = Guest;
export type CommentType = Comment;
export type FileAttachmentType = FileAttachment;
export type PollType = Poll;
export type PollOptionType = PollOption;

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
  loadingPolls: boolean;
  polls: PollType[];
  logout: () => Promise<void>;
  createEvent: (managerIds: string[], event: {
    name: string; brideName: string; groomName: string;
    weddingCity: string; weddingDate: string; weddingType?: WeddingType | null;
    venue?: string | null; location?: string | null; budget?: number | null;
    description?: string;
  }) => Promise<WeddingEvent>;
  joinEvent: (userId: string, code: string) => Promise<WeddingEvent>;
  createFunction: (eventId: string, fn: {
    name: string; date?: string | null; description?: string; icon: string; color: string;
  }) => Promise<WeddingFunction>;
  updateFunction: (functionId: string, updates: Partial<WeddingFunction>) => Promise<WeddingFunction>;
  deleteFunction: (functionId: string) => Promise<void>;
  refreshFunctions: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  loadTasksForFunction: (functionId: string) => Promise<Task[]>;
  getTask: (taskId: string) => Promise<Task>;
  createTask: (task: {
    functionId: string; title: string; description?: string; dueDate?: string | null;
    assignedTo?: string[]; assignedToName?: string[];
    priority: TaskPriority; status: TaskStatus; budget?: number | null;
  }) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<Subtask>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  updateSubtask: (subtaskId: string, updates: { title: string }) => Promise<Subtask>;
  deleteSubtask: (subtaskId: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  addNotification: (n: { userId: string; title: string; message: string; type: Notification["type"] }) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshParticipants: () => Promise<void>;
  addParticipant: (data: {
    eventId: string;
    userId: string;
    name?: string;
    role?: UserRole;
    phoneNumber?: string;
    }) => Promise<void>;
    deleteParticipant: (eventId: string, participantId: string) => Promise<void>;
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
  // Comment Management
  getComments: (taskId: string, subtaskId?: string) => Promise<CommentType[]>;
  addComment: (commentData: {
    taskId: string;
    subtaskId?: string | null;
    userId: string;
    userName: string;
    text: string;
  }) => Promise<CommentType>;
  updateComment: (commentId: string, updates: { text: string }) => Promise<CommentType>;
  deleteComment: (commentId: string) => Promise<void>;
  // File Attachment Management
  uploadFileAttachment: (taskId: string, fileUri: string, fileName: string, fileType: string, fileSize: number, uploadedBy: string, uploadedByName: string) => Promise<FileAttachmentType>;
  getFileAttachments: (taskId: string) => Promise<FileAttachmentType[]>;
  deleteFileAttachment: (attachmentId: string) => Promise<void>;
  // Poll Management
  createPoll: (pollData: {
    eventId: string;
    question: string;
    description?: string | null;
    options: string[];
    createdBy: string;
    createdByName: string;
    deadline?: string | null;
  }) => Promise<PollType>;
  getPolls: (eventId: string) => Promise<PollType[]>;
  getPoll: (pollId: string) => Promise<PollType>;
  voteOnPoll: (pollId: string, optionId: string, userId: string, userName: string) => Promise<PollType>;
  closePoll: (pollId: string) => Promise<PollType>;
  deletePoll: (pollId: string) => Promise<void>;
  getUserVote: (pollId: string, userId: string) => Promise<string | null>;
  refreshPolls: () => Promise<void>;
  // Manager Management
  addManager: (eventId: string, managerId: string) => Promise<WeddingEvent>;
  removeManager: (eventId: string, managerId: string) => Promise<WeddingEvent>;
  getManagers: (eventId: string) => Promise<FirebaseUser[]>;
  isEventManager: (eventId: string, userId: string) => Promise<boolean>;
  // Subscription Management
  upgradeSubscription: () => Promise<User>;
  downgradeSubscription: () => Promise<User>;
  canCreateMultipleEvents: () => boolean;
  canHaveMultipleManagers: () => boolean;
  canUseFileAttachments: () => boolean;
  canUsePolls: () => boolean;
  getMaxTasks: () => number;
  getMaxGuests: () => number;
  getMaxFunctions: () => number;
  getMaxManagers: () => number;
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
  const [loadingPolls, setLoadingPolls] = useState(false);
  const [polls, setPolls] = useState<PollType[]>([]);
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
    loadPolls(eid);
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
    console.log("[AppContext] loadParticipants called", { eventId });
    try {
      const p = await getParticipants(eventId);
      console.log("[AppContext] Participants loaded:", {
        eventId,
        count: p.length,
        participants: p.map(participant => ({
          id: participant.id,
          name: participant.name,
          role: participant.role,
          phone: participant.phone
        }))
      });
      setParticipants(p);
    } catch (e) {
      console.error("[AppContext] loadParticipants error", e);
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

  const loadPolls = async (eventId: string) => {
    setLoadingPolls(true);
    try {
      const p = await getPollsFirebase(eventId);
      setPolls(p);
    } catch (e) {
      console.error("loadPolls error", e);
    } finally {
      setLoadingPolls(false);
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

  const createEvent = useCallback(async (managerIds: string[], data: {
    name: string; brideName: string; groomName: string;
    weddingCity: string; weddingDate: string; weddingType?: WeddingType | null;
    venue?: string | null; location?: string | null; budget?: number | null;
    description?: string;
  }): Promise<WeddingEvent> => {
    if (!user) throw new Error("Not logged in");
    if (!managerIds || managerIds.length === 0) {
      console.error("managerIds is undefined or empty in createEvent");
      throw new Error("At least one manager is required to create an event");
    }
    console.log("Creating event with managerIds:", managerIds);
    const event = await createEventFirebase({ ...data, managerIds });
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

  const updateFunction = useCallback(async (functionId: string, updates: Partial<WeddingFunction>): Promise<WeddingFunction> => {
    const updated = await updateFunctionFirebase(functionId, updates);
    setFunctions((prev) => prev.map((f) => f.id === functionId ? updated : f));
    return updated;
  }, []);

  const deleteFunction = useCallback(async (functionId: string): Promise<void> => {
    await deleteFunctionFirebase(functionId);
    setFunctions((prev) => prev.filter((f) => f.id !== functionId));
    setTasks((prev) => prev.filter((t) => t.functionId !== functionId));
  }, []);

  const refreshFunctions = useCallback(async () => {
    if (!currentEvent) return;
    await loadFunctions(currentEvent.id);
  }, [currentEvent]);

  const refreshTasks = useCallback(async () => {
    if (!currentEvent) return;
    setLoadingTasks(true);
    try {
      const t = await getTasks({ eventId: currentEvent.id });
      setTasks(t);
    } catch (e) {
      console.error("refreshTasks error", e);
    } finally {
      setLoadingTasks(false);
    }
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
    assignedTo?: string[]; assignedToName?: string[];
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

  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    await deleteTaskFirebase(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
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

  const updateSubtask = useCallback(async (subtaskId: string, updates: { title: string }): Promise<Subtask> => {
    const updated = await updateSubtaskFirebase(subtaskId, updates);
    setTasks((prev) => prev.map((t) => {
      if (!t.subtasks.some(st => st.id === subtaskId)) return t;
      return {
        ...t,
        subtasks: t.subtasks.map((st) => st.id === subtaskId ? updated : st),
      };
    }));
    return updated;
  }, []);

  const deleteSubtask = useCallback(async (subtaskId: string): Promise<void> => {
    await deleteSubtaskFirebase(subtaskId);
    setTasks((prev) => prev.map((t) => {
      if (!t.subtasks.some(st => st.id === subtaskId)) return t;
      return {
        ...t,
        subtasks: t.subtasks.filter((st) => st.id !== subtaskId),
      };
    }));
  }, []);

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

  const addParticipant = useCallback(async (data: {
    eventId: string;
    userId: string;
    name?: string;
    role?: UserRole;
    phoneNumber?: string;
  }): Promise<void> => {
    console.log("[AppContext] addParticipant called", {
      eventId: data.eventId,
      userId: data.userId,
      name: data.name,
      role: data.role,
      phoneNumber: data.phoneNumber,
      currentEventId: currentEvent?.id
    });
    await addParticipantFirebase(data);
    console.log("[AppContext] Participant added to Firebase, refreshing participants list...");
    // Refresh participants list
    if (currentEvent?.id === data.eventId) {
      await loadParticipants(data.eventId);
      console.log("[AppContext] Participants refreshed successfully");
    } else {
      console.warn("[AppContext] Event ID mismatch, not refreshing participants", {
        currentEventId: currentEvent?.id,
        dataEventId: data.eventId
      });
    }
  }, [currentEvent]);

  const deleteParticipant = useCallback(async (eventId: string, participantId: string): Promise<void> => {
    console.log("[AppContext] deleteParticipant called", { eventId, participantId });
    await deleteParticipantFirebase(eventId, participantId);
    console.log("[AppContext] Participant deleted from Firebase, refreshing participants list...");
    // Refresh participants list
    if (currentEvent?.id === eventId) {
      await loadParticipants(eventId);
      console.log("[AppContext] Participants refreshed successfully");
    } else {
      console.warn("[AppContext] Event ID mismatch, not refreshing participants", {
        currentEventId: currentEvent?.id,
        dataEventId: eventId
      });
    }
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

  // Comment Management Functions
  const getComments = useCallback(async (taskId: string, subtaskId?: string): Promise<CommentType[]> => {
    console.log("[AppContext] getComments called", { taskId, subtaskId });
    try {
      const comments = await getCommentsFirebase(taskId, subtaskId);
      console.log("[AppContext] getComments success", { count: comments.length });
      return comments;
    } catch (error) {
      console.error("[AppContext] getComments error", error);
      throw error;
    }
  }, []);

  const addComment = useCallback(async (commentData: {
    taskId: string;
    subtaskId?: string | null;
    userId: string;
    userName: string;
    text: string;
  }): Promise<CommentType> => {
    return await addCommentFirebase(commentData);
  }, []);

  const updateComment = useCallback(async (commentId: string, updates: { text: string }): Promise<CommentType> => {
    return await updateCommentFirebase(commentId, updates);
  }, []);

  const deleteComment = useCallback(async (commentId: string): Promise<void> => {
    await deleteCommentFirebase(commentId);
  }, []);

  // File Attachment Management Functions
  const uploadFileAttachment = useCallback(async (
    taskId: string,
    fileUri: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    uploadedBy: string,
    uploadedByName: string
  ): Promise<FileAttachmentType> => {
    return await uploadFileAttachmentFirebase(taskId, fileUri, fileName, fileType, fileSize, uploadedBy, uploadedByName);
  }, []);

  const getFileAttachments = useCallback(async (taskId: string): Promise<FileAttachmentType[]> => {
    return await getFileAttachmentsFirebase(taskId);
  }, []);

  const deleteFileAttachment = useCallback(async (attachmentId: string): Promise<void> => {
    await deleteFileAttachmentFirebase(attachmentId);
  }, []);

  // Poll Management Functions
  const createPoll = useCallback(async (pollData: {
    eventId: string;
    question: string;
    description?: string | null;
    options: string[];
    createdBy: string;
    createdByName: string;
    deadline?: string | null;
  }): Promise<PollType> => {
    const created = await createPollFirebase(pollData);
    setPolls((prev) => [created, ...prev]);
    return created;
  }, []);

  const getPolls = useCallback(async (eventId: string): Promise<PollType[]> => {
    return await getPollsFirebase(eventId);
  }, []);

  const getPoll = useCallback(async (pollId: string): Promise<PollType> => {
    return await getPollFirebase(pollId);
  }, []);

  const voteOnPoll = useCallback(async (pollId: string, optionId: string, userId: string, userName: string): Promise<PollType> => {
    const updated = await voteOnPollFirebase(pollId, optionId, userId, userName);
    setPolls((prev) => prev.map((p) => p.id === pollId ? updated : p));
    return updated;
  }, []);

  const closePoll = useCallback(async (pollId: string): Promise<PollType> => {
    const updated = await closePollFirebase(pollId);
    setPolls((prev) => prev.map((p) => p.id === pollId ? updated : p));
    return updated;
  }, []);

  const deletePoll = useCallback(async (pollId: string): Promise<void> => {
    await deletePollFirebase(pollId);
    setPolls((prev) => prev.filter((p) => p.id !== pollId));
  }, []);

  const getUserVote = useCallback(async (pollId: string, userId: string): Promise<string | null> => {
    return await getUserVoteFirebase(pollId, userId);
  }, []);

  const refreshPolls = useCallback(async () => {
    if (!currentEvent) return;
    await loadPolls(currentEvent.id);
  }, [currentEvent]);

  // Manager Management Functions
  const addManager = useCallback(async (eventId: string, managerId: string): Promise<WeddingEvent> => {
    const updated = await addManagerFirebase(eventId, managerId);
    if (currentEvent?.id === eventId) {
      await setCurrentEvent(updated);
    }
    return updated;
  }, [currentEvent, setCurrentEvent]);

  const removeManager = useCallback(async (eventId: string, managerId: string): Promise<WeddingEvent> => {
    const updated = await removeManagerFirebase(eventId, managerId);
    if (currentEvent?.id === eventId) {
      await setCurrentEvent(updated);
    }
    return updated;
  }, [currentEvent, setCurrentEvent]);

  const getManagers = useCallback(async (eventId: string): Promise<FirebaseUser[]> => {
    try {
      return await getManagersFirebase(eventId);
    } catch (error) {
      console.error("Error getting managers:", error);
      // Return empty array if event not found or any other error occurs
      return [];
    }
  }, []);

  const isEventManager = useCallback(async (eventId: string, userId: string): Promise<boolean> => {
    return await isEventManagerFirebase(eventId, userId);
  }, []);

  // Subscription Management Functions
  const upgradeSubscription = useCallback(async (): Promise<User> => {
    if (!user) throw new Error("Not logged in");
    const updated = await upgradeSubscriptionFirebase(user.id);
    const newUser = { ...user, subscriptionTier: updated.subscriptionTier };
    setUserState(newUser);
    await AsyncStorage.setItem("@vivah_user", JSON.stringify(newUser));
    return newUser;
  }, [user]);

  const downgradeSubscription = useCallback(async (): Promise<User> => {
    if (!user) throw new Error("Not logged in");
    const updated = await downgradeSubscriptionFirebase(user.id);
    const newUser = { ...user, subscriptionTier: updated.subscriptionTier };
    setUserState(newUser);
    await AsyncStorage.setItem("@vivah_user", JSON.stringify(newUser));
    return newUser;
  }, [user]);

  const canCreateMultipleEventsFn = useCallback((): boolean => {
    return user ? canCreateMultipleEvents(user.subscriptionTier) : false;
  }, [user]);

  const canHaveMultipleManagersFn = useCallback((): boolean => {
    return user ? canHaveMultipleManagers(user.subscriptionTier) : false;
  }, [user]);

  const canUseFileAttachmentsFn = useCallback((): boolean => {
    return user ? canUseFileAttachments(user.subscriptionTier) : false;
  }, [user]);

  const canUsePollsFn = useCallback((): boolean => {
    return user ? canUsePolls(user.subscriptionTier) : false;
  }, [user]);

  const getMaxTasksFn = useCallback((): number => {
    return user ? getMaxTasks(user.subscriptionTier) : 20;
  }, [user]);

  const getMaxGuestsFn = useCallback((): number => {
    return user ? getMaxGuests(user.subscriptionTier) : 50;
  }, [user]);

  const getMaxFunctionsFn = useCallback((): number => {
    return user ? getMaxFunctions(user.subscriptionTier) : 5;
  }, [user]);

  const getMaxManagersFn = useCallback((): number => {
    return user ? getMaxManagers(user.subscriptionTier) : 1;
  }, [user]);

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
      setPolls([]);
      setLoadingFunctions(false);
      setLoadingTasks(false);
      setLoadingGuests(false);
      setLoadingPolls(false);
      eventIdRef.current = null;
      
      console.log("Logout completed successfully");
      
      // Close the app on Android after logout
      if (Platform.OS === 'android') {
        console.log("Closing app on Android");
        // Use setTimeout to ensure state is cleared before exiting
        setTimeout(() => {
          BackHandler.exitApp();
        }, 500);
      }
      // On iOS, we cannot programmatically exit the app (Apple guidelines)
      // The app will navigate to login screen automatically since user state is cleared
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
        loadingPolls,
        polls,
        createEvent,
        joinEvent,
        createFunction,
        updateFunction,
        deleteFunction,
        refreshFunctions,
        refreshTasks,
        loadTasksForFunction,
        getTask,
        createTask,
        updateTask,
        deleteTask,
        addSubtask,
        toggleSubtask,
        updateSubtask,
        deleteSubtask,
        markNotificationRead,
        addNotification,
        refreshNotifications,
        refreshParticipants,
        addParticipant,
        deleteParticipant,
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
        getComments,
        addComment,
        updateComment,
        deleteComment,
        uploadFileAttachment,
        getFileAttachments,
        deleteFileAttachment,
        createPoll,
        getPolls,
        getPoll,
        voteOnPoll,
        closePoll,
        deletePoll,
        getUserVote,
        refreshPolls,
        addManager,
        removeManager,
        getManagers,
        isEventManager,
        upgradeSubscription,
        downgradeSubscription,
        canCreateMultipleEvents: canCreateMultipleEventsFn,
        canHaveMultipleManagers: canHaveMultipleManagersFn,
        canUseFileAttachments: canUseFileAttachmentsFn,
        canUsePolls: canUsePollsFn,
        getMaxTasks: getMaxTasksFn,
        getMaxGuests: getMaxGuestsFn,
        getMaxFunctions: getMaxFunctionsFn,
        getMaxManagers: getMaxManagersFn,
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
