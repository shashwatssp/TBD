import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export type UserRole = "manager" | "participant";

export type WeddingType = "north_indian" | "south_indian" | "bengali" | "gujarati" |
                        "punjabi" | "marathi" | "tamil" | "telugu" | "kerala" | "rajasthani";

export type RSVPStatus = "pending" | "accepted" | "declined";

export interface FirebaseUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  createdAt: Timestamp;
}

export interface FirebaseEvent {
  id: string;
  name: string;
  brideName: string;
  groomName: string;
  weddingCity: string;
  weddingDate: string;
  weddingType: WeddingType | null;
  venue: string | null;
  location: string | null;
  budget: number | null;
  description: string;
  eventCode: string;
  managerId: string;
  createdAt: Timestamp;
}

export interface FirebaseFunction {
  id: string;
  eventId: string;
  name: string;
  date: string | null;
  description: string;
  icon: string;
  color: string;
  budget: number | null;
  createdAt: Timestamp;
}

export interface FirebaseSubtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  createdAt: Timestamp;
}

export interface FirebaseTask {
  id: string;
  functionId: string;
  title: string;
  description: string;
  dueDate: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  priority: "high" | "medium" | "low";
  status: "not_started" | "in_progress" | "completed";
  budget: number | null;
  createdAt: Timestamp;
  subtasks: FirebaseSubtask[];
}

export interface FirebaseNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "task_assigned" | "deadline" | "status_change" | "new_function";
  read: boolean;
  createdAt: string;
}

export interface GuestFamily {
  id: string;
  eventId: string;
  name: string;
  hotelRoom: string | null;
  accommodationRequired: boolean;
  rsvpStatus: RSVPStatus;
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Guest {
  id: string;
  eventId: string;
  familyId: string | null;
  name: string;
  phone: string | null;
  relationship: string | null;
  rsvpStatus: RSVPStatus;
  accommodationRequired: boolean;
  dietaryRestrictions: string | null;
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Wedding Type Configurations with Default Functions
export const WEDDING_TYPE_FUNCTIONS: Record<WeddingType, Array<{name: string, icon: string, color: string}>> = {
  north_indian: [
    { name: "Haldi", icon: "sunny-outline", color: "#F0C040" },
    { name: "Mehendi", icon: "leaf-outline", color: "#2E8B57" },
    { name: "Sangeet", icon: "musical-notes-outline", color: "#9B59B6" },
    { name: "Wedding Ceremony", icon: "heart-outline", color: "#C0392B" },
    { name: "Reception", icon: "star-outline", color: "#D4A017" },
    { name: "Engagement", icon: "diamond-outline", color: "#1F5E8A" },
  ],
  south_indian: [
    { name: "Nischayam", icon: "calendar-outline", color: "#E67E22" },
    { name: "Mehendi", icon: "leaf-outline", color: "#2E8B57" },
    { name: "Muhurtham", icon: "heart-outline", color: "#C0392B" },
    { name: "Reception", icon: "star-outline", color: "#D4A017" },
  ],
  bengali: [
    { name: "Aashirbad", icon: "hand-left-outline", color: "#E67E22" },
    { name: "Mehendi", icon: "leaf-outline", color: "#2E8B57" },
    { name: "Gaye Holud", icon: "flower-outline", color: "#F39C12" },
    { name: "Wedding", icon: "heart-outline", color: "#C0392B" },
    { name: "Reception", icon: "star-outline", color: "#D4A017" },
  ],
  gujarati: [
    { name: "Gol Dhana", icon: "calendar-outline", color: "#E67E22" },
    { name: "Mehendi", icon: "leaf-outline", color: "#2E8B57" },
    { name: "Mandap Muhurat", icon: "home-outline", color: "#9B59B6" },
    { name: "Wedding", icon: "heart-outline", color: "#C0392B" },
    { name: "Reception", icon: "star-outline", color: "#D4A017" },
  ],
  punjabi: [
    { name: "Roka", icon: "calendar-outline", color: "#E67E22" },
    { name: "Mehendi", icon: "leaf-outline", color: "#2E8B57" },
    { name: "Sangeet", icon: "musical-notes-outline", color: "#9B59B6" },
    { name: "Wedding", icon: "heart-outline", color: "#C0392B" },
    { name: "Reception", icon: "star-outline", color: "#D4A017" },
  ],
  marathi: [
    { name: "Sakhar Puda", icon: "calendar-outline", color: "#E67E22" },
    { name: "Mehendi", icon: "leaf-outline", color: "#2E8B57" },
    { name: "Wedding", icon: "heart-outline", color: "#C0392B" },
    { name: "Reception", icon: "star-outline", color: "#D4A017" },
  ],
  tamil: [
    { name: "Nischayam", icon: "calendar-outline", color: "#E67E22" },
    { name: "Mehendi", icon: "leaf-outline", color: "#2E8B57" },
    { name: "Muhurtham", icon: "heart-outline", color: "#C0392B" },
    { name: "Reception", icon: "star-outline", color: "#D4A017" },
  ],
  telugu: [
    { name: "Nischayam", icon: "calendar-outline", color: "#E67E22" },
    { name: "Mehendi", icon: "leaf-outline", color: "#2E8B57" },
    { name: "Muhurtham", icon: "heart-outline", color: "#C0392B" },
    { name: "Reception", icon: "star-outline", color: "#D4A017" },
  ],
  kerala: [
    { name: "Nischayam", icon: "calendar-outline", color: "#E67E22" },
    { name: "Mehendi", icon: "leaf-outline", color: "#2E8B57" },
    { name: "Wedding", icon: "heart-outline", color: "#C0392B" },
    { name: "Reception", icon: "star-outline", color: "#D4A017" },
  ],
  rajasthani: [
    { name: "Tilak", icon: "calendar-outline", color: "#E67E22" },
    { name: "Mehendi", icon: "leaf-outline", color: "#2E8B57" },
    { name: "Sangeet", icon: "musical-notes-outline", color: "#9B59B6" },
    { name: "Wedding", icon: "heart-outline", color: "#C0392B" },
    { name: "Reception", icon: "star-outline", color: "#D4A017" },
  ],
};

// Helper function to convert Firestore timestamp to string
const timestampToString = (timestamp: Timestamp | undefined): string => {
  if (!timestamp) return new Date().toISOString();
  return timestamp.toDate().toISOString();
};

// Helper function to convert string to Firestore timestamp
const stringToTimestamp = (dateString: string | null): Timestamp | null => {
  if (!dateString) return null;
  return Timestamp.fromDate(new Date(dateString));
};

// User Operations
export const upsertUser = async (phone: string, name: string, role?: UserRole): Promise<FirebaseUser> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('phone', '==', phone));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    // User exists, update name if provided
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as FirebaseUser;
    
    if (name && userData.name !== name) {
      await updateDoc(doc(db, 'users', userDoc.id), { name });
      userData.name = name;
    }
    
    if (role && userData.role !== role) {
      await updateDoc(doc(db, 'users', userDoc.id), { role });
      userData.role = role;
    }
    
    // Add the document ID to the user data
    return {
      ...userData,
      id: userDoc.id
    } as FirebaseUser;
  }
  
  // Create new user
  const newUser = {
    phone,
    name,
    role: role || 'participant',
    createdAt: serverTimestamp()
  };
  
  const docRef = await addDoc(usersRef, newUser);
  return {
    id: docRef.id,
    ...newUser,
    createdAt: Timestamp.now()
  } as FirebaseUser;
};

export const updateUser = async (userId: string, updates: { role?: UserRole; name?: string }): Promise<FirebaseUser> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, updates);
  
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  return {
    ...userDoc.data(),
    id: userDoc.id
  } as FirebaseUser;
};

// Event Operations
export const createEvent = async (eventData: {
  name: string;
  brideName: string;
  groomName: string;
  weddingCity: string;
  weddingDate: string;
  weddingType?: WeddingType | null;
  venue?: string | null;
  location?: string | null;
  budget?: number | null;
  description?: string;
  managerId: string;
}): Promise<FirebaseEvent> => {
  const eventsRef = collection(db, 'events');
  
  // Generate a 6-character event code
  const eventCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const newEvent = {
    ...eventData,
    eventCode,
    description: eventData.description || '',
    weddingType: eventData.weddingType || null,
    venue: eventData.venue || null,
    location: eventData.location || null,
    budget: eventData.budget || null,
    createdAt: serverTimestamp()
  };
  
  const docRef = await addDoc(eventsRef, newEvent);
  const eventId = docRef.id;
  
  // Create default functions based on wedding type (only if weddingType is provided)
  if (eventData.weddingType) {
    const defaultFunctions = WEDDING_TYPE_FUNCTIONS[eventData.weddingType] || [];
    const functionsRef = collection(db, 'functions');
    
    await Promise.all(
      defaultFunctions.map((func) =>
        addDoc(functionsRef, {
          eventId,
          name: func.name,
          icon: func.icon,
          color: func.color,
          date: null,
          description: '',
          budget: null,
          createdAt: serverTimestamp()
        })
      )
    );
  }
  
  return {
    id: eventId,
    ...newEvent,
    createdAt: Timestamp.now()
  } as FirebaseEvent;
};

export const joinEvent = async (eventCode: string, userId: string): Promise<FirebaseEvent> => {
  const eventsRef = collection(db, 'events');
  const q = query(eventsRef, where('eventCode', '==', eventCode.toUpperCase()));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    throw new Error('Event not found');
  }
  
  const eventDoc = querySnapshot.docs[0];
  const eventData = eventDoc.data() as FirebaseEvent;
  
  // Add user to event participants
  const participantsRef = collection(db, 'participants');
  await addDoc(participantsRef, {
    eventId: eventDoc.id,
    userId,
    joinedAt: serverTimestamp()
  });
  
  // Get user details for notification
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();
  const userName = userData?.name || 'A helper';
  
  // Create notification for the manager
  const notificationsRef = collection(db, 'notifications');
  await addDoc(notificationsRef, {
    userId: eventData.managerId,
    title: 'New Helper Joined',
    message: `${userName} has joined your wedding event!`,
    type: 'task_assigned',
    read: false,
    createdAt: serverTimestamp()
  });
  
  return {
    ...eventData,
    id: eventDoc.id
  } as FirebaseEvent;
};

export const getEvent = async (eventId: string): Promise<FirebaseEvent> => {
  const eventRef = doc(db, 'events', eventId);
  const eventDoc = await getDoc(eventRef);
  
  if (!eventDoc.exists()) {
    throw new Error('Event not found');
  }
  
  return {
    ...eventDoc.data(),
    id: eventDoc.id
  } as FirebaseEvent;
};

export const getParticipants = async (eventId: string): Promise<FirebaseUser[]> => {
  const participantsRef = collection(db, 'participants');
  const q = query(participantsRef, where('eventId', '==', eventId));
  const querySnapshot = await getDocs(q);
  
  const userIds = querySnapshot.docs.map(doc => doc.data().userId);
  
  if (userIds.length === 0) return [];
  
  // Get user details
  const usersRef = collection(db, 'users');
  const usersQuery = query(usersRef, where('__name__', 'in', userIds));
  const usersSnapshot = await getDocs(usersQuery);
  
  return usersSnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as FirebaseUser));
};

// Function Operations
export const getFunctions = async (eventId: string): Promise<FirebaseFunction[]> => {
  const functionsRef = collection(db, 'functions');
  const q = query(functionsRef, where('eventId', '==', eventId));
  const querySnapshot = await getDocs(q);
  
  const functions = querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as FirebaseFunction));
  
  // Sort by createdAt in descending order (newest first)
  return functions.sort((a, b) => {
    const aTime = a.createdAt?.toMillis() || 0;
    const bTime = b.createdAt?.toMillis() || 0;
    return bTime - aTime;
  });
};

export const createFunction = async (functionData: {
  eventId: string;
  name: string;
  date?: string | null;
  description?: string;
  icon: string;
  color: string;
}): Promise<FirebaseFunction> => {
  const functionsRef = collection(db, 'functions');
  
  const newFunction = {
    ...functionData,
    description: functionData.description || '',
    date: functionData.date || null,
    createdAt: serverTimestamp()
  };
  
  const docRef = await addDoc(functionsRef, newFunction);
  return {
    id: docRef.id,
    ...newFunction,
    createdAt: Timestamp.now()
  } as FirebaseFunction;
};

// Task Operations
export const getTask = async (taskId: string): Promise<FirebaseTask> => {
  const taskRef = doc(db, 'tasks', taskId);
  const taskDoc = await getDoc(taskRef);
  
  if (!taskDoc.exists()) {
    throw new Error('Task not found');
  }
  
  const taskData = taskDoc.data() as FirebaseTask;
  
  // Get subtasks
  const subtasksRef = collection(db, 'subtasks');
  const subtasksQuery = query(subtasksRef, where('taskId', '==', taskId));
  const subtasksSnapshot = await getDocs(subtasksQuery);
  
  return {
    ...taskData,
    id: taskDoc.id,
    subtasks: subtasksSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as FirebaseSubtask))
  };
};

export const getTasks = async (params: {
  functionId?: string;
  assignedTo?: string;
  eventId?: string;
}): Promise<FirebaseTask[]> => {
  const tasksRef = collection(db, 'tasks');
  let q = query(tasksRef);
  
  if (params.functionId) {
    q = query(tasksRef, where('functionId', '==', params.functionId));
  } else if (params.assignedTo) {
    q = query(tasksRef, where('assignedTo', '==', params.assignedTo));
  } else if (params.eventId) {
    // Get all functions for the event first
    const functions = await getFunctions(params.eventId);
    const functionIds = functions.map(f => f.id);
    
    if (functionIds.length === 0) return [];
    
    q = query(tasksRef, where('functionId', 'in', functionIds));
  }
  
  const querySnapshot = await getDocs(q);
  const tasks = querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as FirebaseTask));
  
  // Get subtasks for each task
  const tasksWithSubtasks = await Promise.all(
    tasks.map(async (task) => {
      const subtasksRef = collection(db, 'subtasks');
      const subtasksQuery = query(subtasksRef, where('taskId', '==', task.id));
      const subtasksSnapshot = await getDocs(subtasksQuery);
      
      return {
        ...task,
        subtasks: subtasksSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        } as FirebaseSubtask))
      };
    })
  );
  
  return tasksWithSubtasks;
};

export const createTask = async (taskData: {
  functionId: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  assignedTo?: string | null;
  assignedToName?: string | null;
  priority: "high" | "medium" | "low";
  status: "not_started" | "in_progress" | "completed";
  budget?: number | null;
}): Promise<FirebaseTask> => {
  const tasksRef = collection(db, 'tasks');
  
  const newTask = {
    ...taskData,
    description: taskData.description || '',
    dueDate: taskData.dueDate || null,
    assignedTo: taskData.assignedTo || null,
    assignedToName: taskData.assignedToName || null,
    budget: taskData.budget || null,
    createdAt: serverTimestamp()
  };
  
  const docRef = await addDoc(tasksRef, newTask);
  return {
    id: docRef.id,
    ...newTask,
    createdAt: Timestamp.now(),
    subtasks: []
  } as FirebaseTask;
};

// Guest Family Operations
export const createGuestFamily = async (familyData: {
  eventId: string;
  name: string;
  hotelRoom?: string | null;
  accommodationRequired?: boolean;
  notes?: string;
}): Promise<GuestFamily> => {
  const familiesRef = collection(db, 'guestFamilies');
  
  const newFamily = {
    ...familyData,
    hotelRoom: familyData.hotelRoom || null,
    accommodationRequired: familyData.accommodationRequired ?? false,
    notes: familyData.notes || '',
    rsvpStatus: 'pending' as RSVPStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  const docRef = await addDoc(familiesRef, newFamily);
  return {
    id: docRef.id,
    ...newFamily,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  } as GuestFamily;
};

export const getGuestFamilies = async (eventId: string): Promise<GuestFamily[]> => {
  const familiesRef = collection(db, 'guestFamilies');
  const q = query(familiesRef, where('eventId', '==', eventId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as GuestFamily));
};

export const updateGuestFamily = async (familyId: string, updates: Partial<GuestFamily>): Promise<GuestFamily> => {
  const familyRef = doc(db, 'guestFamilies', familyId);
  await updateDoc(familyRef, { ...updates, updatedAt: serverTimestamp() });
  
  const familyDoc = await getDoc(familyRef);
  if (!familyDoc.exists()) {
    throw new Error('Guest family not found');
  }
  
  return {
    ...familyDoc.data(),
    id: familyDoc.id
  } as GuestFamily;
};

export const deleteGuestFamily = async (familyId: string): Promise<void> => {
  const familyRef = doc(db, 'guestFamilies', familyId);
  await deleteDoc(familyRef);
  
  // Also delete all guests in this family
  const guestsRef = collection(db, 'guests');
  const q = query(guestsRef, where('familyId', '==', familyId));
  const querySnapshot = await getDocs(q);
  
  const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
};

export const getGuestFamilyWithGuests = async (familyId: string): Promise<GuestFamily & { guests: Guest[] }> => {
  const familyRef = doc(db, 'guestFamilies', familyId);
  const familyDoc = await getDoc(familyRef);
  
  if (!familyDoc.exists()) {
    throw new Error('Guest family not found');
  }
  
  const familyData = familyDoc.data() as GuestFamily;
  
  // Get guests for this family
  const guestsRef = collection(db, 'guests');
  const q = query(guestsRef, where('familyId', '==', familyId));
  const guestsSnapshot = await getDocs(q);
  
  const guests = guestsSnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as Guest));
  
  return {
    ...familyData,
    id: familyDoc.id,
    guests
  };
};

// Guest Operations
export const createGuest = async (guestData: {
  eventId: string;
  familyId?: string | null;
  name: string;
  phone?: string | null;
  relationship?: string | null;
  rsvpStatus?: RSVPStatus;
  accommodationRequired?: boolean;
  dietaryRestrictions?: string | null;
  notes?: string;
}): Promise<Guest> => {
  const guestsRef = collection(db, 'guests');
  
  const newGuest = {
    ...guestData,
    familyId: guestData.familyId || null,
    phone: guestData.phone || null,
    relationship: guestData.relationship || null,
    rsvpStatus: guestData.rsvpStatus || 'pending',
    accommodationRequired: guestData.accommodationRequired ?? false,
    dietaryRestrictions: guestData.dietaryRestrictions || null,
    notes: guestData.notes || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  const docRef = await addDoc(guestsRef, newGuest);
  return {
    id: docRef.id,
    ...newGuest,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  } as Guest;
};

export const getGuests = async (eventId: string, familyId?: string): Promise<Guest[]> => {
  const guestsRef = collection(db, 'guests');
  let q = query(guestsRef, where('eventId', '==', eventId));
  
  if (familyId) {
    q = query(guestsRef, where('eventId', '==', eventId), where('familyId', '==', familyId));
  }
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as Guest));
};

export const updateGuest = async (guestId: string, updates: Partial<Guest>): Promise<Guest> => {
  const guestRef = doc(db, 'guests', guestId);
  await updateDoc(guestRef, { ...updates, updatedAt: serverTimestamp() });
  
  const guestDoc = await getDoc(guestRef);
  if (!guestDoc.exists()) {
    throw new Error('Guest not found');
  }
  
  return {
    ...guestDoc.data(),
    id: guestDoc.id
  } as Guest;
};

export const deleteGuest = async (guestId: string): Promise<void> => {
  const guestRef = doc(db, 'guests', guestId);
  await deleteDoc(guestRef);
};

export const getGuestStats = async (eventId: string): Promise<{
  total: number;
  accepted: number;
  declined: number;
  pending: number;
  accommodationRequired: number;
}> => {
  const guests = await getGuests(eventId);
  
  return {
    total: guests.length,
    accepted: guests.filter(g => g.rsvpStatus === 'accepted').length,
    declined: guests.filter(g => g.rsvpStatus === 'declined').length,
    pending: guests.filter(g => g.rsvpStatus === 'pending').length,
    accommodationRequired: guests.filter(g => g.accommodationRequired).length
  };
};

// Invitation Generation
export const generateInvitationData = async (eventId: string, familyId?: string): Promise<{
  wedding: FirebaseEvent;
  family?: GuestFamily & { guests: Guest[] };
  guests: Guest[];
  qrCodeUrl: string;
  rsvpLink: string;
}> => {
  const wedding = await getEvent(eventId);
  let family: (GuestFamily & { guests: Guest[] }) | undefined;
  let guests: Guest[] = [];
  
  if (familyId) {
    family = await getGuestFamilyWithGuests(familyId);
    guests = family.guests;
  } else {
    guests = await getGuests(eventId);
  }
  
  // Generate QR code URL (using Google Maps API for location)
  const locationQuery = encodeURIComponent(wedding.location || wedding.weddingCity);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${locationQuery}`;
  
  // Generate RSVP link (deep link to app)
  const rsvpLink = `vivah://rsvp/${eventId}${familyId ? `?family=${familyId}` : ''}`;
  
  return {
    wedding,
    family,
    guests,
    qrCodeUrl,
    rsvpLink
  };
};

export const updateTask = async (taskId: string, updates: Partial<FirebaseTask>): Promise<FirebaseTask> => {
  const taskRef = doc(db, 'tasks', taskId);
  await updateDoc(taskRef, updates);
  
  const taskDoc = await getDoc(taskRef);
  if (!taskDoc.exists()) {
    throw new Error('Task not found');
  }
  
  const taskData = taskDoc.data() as FirebaseTask;
  
  // Get subtasks
  const subtasksRef = collection(db, 'subtasks');
  const subtasksQuery = query(subtasksRef, where('taskId', '==', taskId));
  const subtasksSnapshot = await getDocs(subtasksQuery);
  
  return {
    ...taskData,
    id: taskDoc.id,
    subtasks: subtasksSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as FirebaseSubtask))
  };
};

export const addSubtask = async (taskId: string, title: string): Promise<FirebaseSubtask> => {
  const subtasksRef = collection(db, 'subtasks');
  
  const newSubtask = {
    taskId,
    title,
    completed: false,
    createdAt: serverTimestamp()
  };
  
  const docRef = await addDoc(subtasksRef, newSubtask);
  return {
    id: docRef.id,
    ...newSubtask,
    createdAt: Timestamp.now()
  } as FirebaseSubtask;
};

export const toggleSubtask = async (subtaskId: string, completed: boolean): Promise<FirebaseSubtask> => {
  const subtaskRef = doc(db, 'subtasks', subtaskId);
  await updateDoc(subtaskRef, { completed });
  
  const subtaskDoc = await getDoc(subtaskRef);
  if (!subtaskDoc.exists()) {
    throw new Error('Subtask not found');
  }
  
  return {
    ...subtaskDoc.data(),
    id: subtaskDoc.id
  } as FirebaseSubtask;
};

// Notification Operations
export const getNotifications = async (userId: string): Promise<FirebaseNotification[]> => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(notificationsRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  
  const notifications = querySnapshot.docs.map(doc => {
    const rawData = doc.data() as any;
    return {
      ...rawData,
      id: doc.id,
      createdAt: timestampToString(rawData.createdAt)
    } as FirebaseNotification;
  });
  
  // Sort by createdAt in descending order (newest first)
  return notifications.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

export const createNotification = async (notificationData: {
  userId: string;
  title: string;
  message: string;
  type: "task_assigned" | "deadline" | "status_change" | "new_function";
}): Promise<FirebaseNotification> => {
  const notificationsRef = collection(db, 'notifications');
  
  const newNotification = {
    ...notificationData,
    read: false,
    createdAt: serverTimestamp()
  };
  
  const docRef = await addDoc(notificationsRef, newNotification);
  return {
    id: docRef.id,
    ...newNotification,
    createdAt: new Date().toISOString()
  } as FirebaseNotification;
};

export const markNotificationRead = async (notificationId: string): Promise<FirebaseNotification> => {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, { read: true });
  
  const notificationDoc = await getDoc(notificationRef);
  if (!notificationDoc.exists()) {
    throw new Error('Notification not found');
  }
  
  const rawData = notificationDoc.data() as any;
  return {
    ...rawData,
    id: notificationDoc.id,
    createdAt: timestampToString(rawData.createdAt)
  } as FirebaseNotification;
};