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
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Cloudinary configuration
const CLOUDINARY_URL = 'cloudinary://273278358597965:oV3g1_DAcgadzXG7XNGw7UPClno@dvm6d9t35';
const CLOUDINARY_CLOUD_NAME = 'dvm6d9t35';
const CLOUDINARY_API_KEY = '273278358597965';
const CLOUDINARY_API_SECRET = 'oV3g1_DAcgadzXG7XNGw7UPClno';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const CLOUDINARY_DESTROY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`;

// Types
export type UserRole = "manager" | "participant";

export type WeddingType = "north_indian" | "south_indian" | "bengali" | "gujarati" |
                        "punjabi" | "marathi" | "tamil" | "telugu" | "kerala" | "rajasthani" | "custom";

export type RSVPStatus = "pending" | "accepted" | "declined";

export type SubscriptionTier = "free" | "premium";

export interface FirebaseUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
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
  managerIds: string[]; // Array of manager IDs (multiple organizers)
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
  assignedTo: string[]; // Array of user IDs (max 2)
  assignedToName: string[]; // Array of user names (max 2)
  priority: "high" | "medium" | "low";
  status: "not_started" | "in_progress" | "completed";
  budget: number | null;
  createdAt: Timestamp;
  subtasks: FirebaseSubtask[];
  attachments: FileAttachment[];
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

export interface Comment {
  id: string;
  taskId: string;
  subtaskId: string | null;
  userId: string;
  userName: string;
  text: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FileAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  downloadUrl: string;
  publicId?: string; // Cloudinary public ID for deletion
  uploadedBy: string;
  uploadedByName: string;
  createdAt: Timestamp;
}

export interface Poll {
  id: string;
  eventId: string;
  question: string;
  description: string | null;
  options: PollOption[];
  createdBy: string;
  createdByName: string;
  status: "active" | "closed";
  deadline: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[]; // Array of user IDs who voted for this option
}

export interface PollVote {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
  userName: string;
  votedAt: Timestamp;
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
  custom: [], // No default functions for custom wedding type
};

// Default subtasks for different function types
export const FUNCTION_DEFAULT_SUBTASKS: Record<string, string[]> = {
  "Haldi": [
    "Book venue",
    "Book decorations",
    "Buy flowers",
    "Arrange catering",
    "Book photographer",
    "Arrange makeup artist",
    "Arrange transport",
  ],
  "Mehendi": [
    "Book mehendi artist",
    "Book venue",
    "Book decorations",
    "Arrange seating",
    "Arrange snacks",
    "Book photographer",
  ],
  "Sangeet": [
    "Book venue",
    "Book DJ/Band",
    "Arrange decorations",
    "Arrange catering",
    "Book photographer",
    "Arrange dance performances",
    "Arrange sound system",
  ],
  "Wedding Ceremony": [
    "Book venue",
    "Book decorations",
    "Arrange priest/pandit",
    "Book photographer",
    "Arrange catering",
    "Arrange transport",
    "Book makeup artist",
  ],
  "Reception": [
    "Book venue",
    "Book decorations",
    "Arrange catering",
    "Book DJ/Band",
    "Book photographer",
    "Arrange seating",
    "Arrange welcome drinks",
  ],
  "Engagement": [
    "Book venue",
    "Book decorations",
    "Arrange catering",
    "Book photographer",
    "Arrange rings",
    "Arrange gifts",
  ],
  "Nischayam": [
    "Book venue",
    "Arrange priest",
    "Arrange catering",
    "Book photographer",
    "Arrange gifts",
  ],
  "Muhurtham": [
    "Book venue",
    "Arrange priest",
    "Arrange catering",
    "Book photographer",
    "Arrange decorations",
  ],
  "Aashirbad": [
    "Book venue",
    "Arrange priest",
    "Arrange catering",
    "Book photographer",
    "Arrange gifts",
  ],
  "Gaye Holud": [
    "Book venue",
    "Book decorations",
    "Arrange catering",
    "Book photographer",
    "Arrange makeup artist",
  ],
  "Gol Dhana": [
    "Book venue",
    "Arrange priest",
    "Arrange catering",
    "Book photographer",
    "Arrange gifts",
  ],
  "Mandap Muhurat": [
    "Book venue",
    "Arrange priest",
    "Arrange catering",
    "Book photographer",
    "Arrange decorations",
  ],
  "Roka": [
    "Book venue",
    "Arrange catering",
    "Book photographer",
    "Arrange gifts",
  ],
  "Sakhar Puda": [
    "Book venue",
    "Arrange priest",
    "Arrange catering",
    "Book photographer",
    "Arrange gifts",
  ],
  "Tilak": [
    "Book venue",
    "Arrange priest",
    "Arrange catering",
    "Book photographer",
    "Arrange gifts",
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
    subscriptionTier: 'free' as SubscriptionTier,
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

// Subscription Management Functions
export const upgradeSubscription = async (userId: string): Promise<FirebaseUser> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { subscriptionTier: 'premium' });
  
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  return {
    ...userDoc.data(),
    id: userDoc.id
  } as FirebaseUser;
};

export const downgradeSubscription = async (userId: string): Promise<FirebaseUser> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { subscriptionTier: 'free' });
  
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  return {
    ...userDoc.data(),
    id: userDoc.id
  } as FirebaseUser;
};

// Feature availability checks based on subscription tier
export const canCreateMultipleEvents = (subscriptionTier: SubscriptionTier): boolean => {
  return subscriptionTier === 'premium';
};

export const canHaveMultipleManagers = (subscriptionTier: SubscriptionTier): boolean => {
  return subscriptionTier === 'premium';
};

export const canUseFileAttachments = (subscriptionTier: SubscriptionTier): boolean => {
  return subscriptionTier === 'premium';
};

export const canUsePolls = (subscriptionTier: SubscriptionTier): boolean => {
  return subscriptionTier === 'premium';
};

export const getMaxTasks = (subscriptionTier: SubscriptionTier): number => {
  return subscriptionTier === 'premium' ? Infinity : 20;
};

export const getMaxGuests = (subscriptionTier: SubscriptionTier): number => {
  return subscriptionTier === 'premium' ? Infinity : 50;
};

export const getMaxFunctions = (subscriptionTier: SubscriptionTier): number => {
  return subscriptionTier === 'premium' ? Infinity : 5;
};

export const getMaxManagers = (subscriptionTier: SubscriptionTier): number => {
  return subscriptionTier === 'premium' ? 5 : 1;
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
  managerIds: string[]; // Array of manager IDs
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
  
  // Create notification for all managers
  const notificationsRef = collection(db, 'notifications');
  await Promise.all(
    eventData.managerIds.map(managerId =>
      addDoc(notificationsRef, {
        userId: managerId,
        title: 'New Helper Joined',
        message: `${userName} has joined your wedding event!`,
        type: 'task_assigned',
        read: false,
        createdAt: serverTimestamp()
      })
    )
  );
  
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

// Manager Management Functions
export const addManager = async (eventId: string, managerId: string): Promise<FirebaseEvent> => {
  const eventRef = doc(db, 'events', eventId);
  const eventDoc = await getDoc(eventRef);
  
  if (!eventDoc.exists()) {
    throw new Error('Event not found');
  }
  
  const eventData = eventDoc.data() as FirebaseEvent;
  
  // Check if user is already a manager
  if (eventData.managerIds.includes(managerId)) {
    throw new Error('User is already a manager');
  }
  
  // Add the new manager
  await updateDoc(eventRef, {
    managerIds: [...eventData.managerIds, managerId]
  });
  
  // Get updated event
  const updatedEventDoc = await getDoc(eventRef);
  return {
    ...updatedEventDoc.data(),
    id: updatedEventDoc.id
  } as FirebaseEvent;
};

export const removeManager = async (eventId: string, managerId: string): Promise<FirebaseEvent> => {
  const eventRef = doc(db, 'events', eventId);
  const eventDoc = await getDoc(eventRef);
  
  if (!eventDoc.exists()) {
    throw new Error('Event not found');
  }
  
  const eventData = eventDoc.data() as FirebaseEvent;
  
  // Check if user is a manager
  if (!eventData.managerIds.includes(managerId)) {
    throw new Error('User is not a manager');
  }
  
  // Ensure at least one manager remains
  if (eventData.managerIds.length <= 1) {
    throw new Error('Cannot remove the last manager');
  }
  
  // Remove the manager
  await updateDoc(eventRef, {
    managerIds: eventData.managerIds.filter(id => id !== managerId)
  });
  
  // Get updated event
  const updatedEventDoc = await getDoc(eventRef);
  return {
    ...updatedEventDoc.data(),
    id: updatedEventDoc.id
  } as FirebaseEvent;
};

export const getManagers = async (eventId: string): Promise<FirebaseUser[]> => {
  const eventRef = doc(db, 'events', eventId);
  const eventDoc = await getDoc(eventRef);
  
  if (!eventDoc.exists()) {
    throw new Error('Event not found');
  }
  
  const eventData = eventDoc.data() as FirebaseEvent;
  
  if (eventData.managerIds.length === 0) return [];
  
  // Get user details for all managers
  const usersRef = collection(db, 'users');
  const usersQuery = query(usersRef, where('__name__', 'in', eventData.managerIds));
  const usersSnapshot = await getDocs(usersQuery);
  
  return usersSnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as FirebaseUser));
};

export const isEventManager = async (eventId: string, userId: string): Promise<boolean> => {
  const eventRef = doc(db, 'events', eventId);
  const eventDoc = await getDoc(eventRef);
  
  if (!eventDoc.exists()) {
    return false;
  }
  
  const eventData = eventDoc.data() as FirebaseEvent;
  return eventData.managerIds.includes(userId);
};

export const addParticipant = async (participantData: {
  eventId: string;
  userId: string;
  name?: string;
  role?: UserRole;
  phoneNumber?: string;
}): Promise<void> => {
  console.log("[firebaseService] addParticipant called", {
    eventId: participantData.eventId,
    userId: participantData.userId,
    name: participantData.name,
    role: participantData.role,
    phoneNumber: participantData.phoneNumber
  });
  
  // Create or update user record first
  if (participantData.phoneNumber && participantData.name) {
    console.log("[firebaseService] Creating/updating user record");
    const user = await upsertUser(
      participantData.phoneNumber,
      participantData.name,
      participantData.role || 'participant'
    );
    console.log("[firebaseService] User record created/updated", { userId: user.id, name: user.name, role: user.role });
    
    // Use the actual user ID instead of the fake pending ID
    participantData.userId = user.id;
  }
  
  const participantsRef = collection(db, 'participants');
  
  const newParticipant = {
    eventId: participantData.eventId,
    userId: participantData.userId,
    name: participantData.name || null,
    role: participantData.role || 'participant',
    phoneNumber: participantData.phoneNumber || null,
    joinedAt: serverTimestamp()
  };
  
  console.log("[firebaseService] Adding participant record", newParticipant);
  await addDoc(participantsRef, newParticipant);
  console.log("[firebaseService] Participant record added successfully");
};

export const getParticipants = async (eventId: string): Promise<FirebaseUser[]> => {
  console.log("[firebaseService] getParticipants called", { eventId });
  
  const participantsRef = collection(db, 'participants');
  const q = query(participantsRef, where('eventId', '==', eventId));
  const querySnapshot = await getDocs(q);
  
  console.log("[firebaseService] Participants query result", {
    count: querySnapshot.docs.length,
    participants: querySnapshot.docs.map(doc => ({
      id: doc.id,
      userId: doc.data().userId,
      name: doc.data().name,
      role: doc.data().role,
      phoneNumber: doc.data().phoneNumber
    }))
  });
  
  const userIds = querySnapshot.docs.map(doc => doc.data().userId);
  
  if (userIds.length === 0) {
    console.log("[firebaseService] No participants found, returning empty array");
    return [];
  }
  
  // Get user details
  const usersRef = collection(db, 'users');
  const usersQuery = query(usersRef, where('__name__', 'in', userIds));
  const usersSnapshot = await getDocs(usersQuery);
  
  console.log("[firebaseService] Users query result", {
    count: usersSnapshot.docs.length,
    users: usersSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      phone: doc.data().phone,
      role: doc.data().role
    }))
  });
  
  const result = usersSnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as FirebaseUser));
  
  console.log("[firebaseService] Returning participants", {
    count: result.length,
    participants: result.map(p => ({ id: p.id, name: p.name, role: p.role }))
  });
  
  return result;
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
  
  // Get attachments
  const attachmentsRef = collection(db, 'attachments');
  const attachmentsQuery = query(attachmentsRef, where('taskId', '==', taskId));
  const attachmentsSnapshot = await getDocs(attachmentsQuery);
  
  return {
    ...taskData,
    id: taskDoc.id,
    subtasks: subtasksSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as FirebaseSubtask)),
    attachments: attachmentsSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as FileAttachment))
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
  
  // Get subtasks and attachments for each task
  const tasksWithSubtasks = await Promise.all(
    tasks.map(async (task) => {
      const subtasksRef = collection(db, 'subtasks');
      const subtasksQuery = query(subtasksRef, where('taskId', '==', task.id));
      const subtasksSnapshot = await getDocs(subtasksQuery);
      
      const attachmentsRef = collection(db, 'attachments');
      const attachmentsQuery = query(attachmentsRef, where('taskId', '==', task.id));
      const attachmentsSnapshot = await getDocs(attachmentsQuery);
      
      return {
        ...task,
        subtasks: subtasksSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        } as FirebaseSubtask)),
        attachments: attachmentsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        } as FileAttachment))
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
  assignedTo?: string[];
  assignedToName?: string[];
  priority: "high" | "medium" | "low";
  status: "not_started" | "in_progress" | "completed";
  budget?: number | null;
}): Promise<FirebaseTask> => {
  console.log("[firebaseService] createTask called", {
    title: taskData.title,
    assignedTo: taskData.assignedTo,
    assignedToName: taskData.assignedToName
  });
  
  // Validate assignment limit (max 2 people)
  if (taskData.assignedTo && taskData.assignedTo.length > 2) {
    console.error("[firebaseService] Task assignment limit exceeded", {
      assignedTo: taskData.assignedTo,
      limit: 2
    });
    throw new Error('Maximum 2 assignees per task');
  }
  
  if (taskData.assignedToName && taskData.assignedToName.length > 2) {
    console.error("[firebaseService] Task assignment names limit exceeded", {
      assignedToName: taskData.assignedToName,
      limit: 2
    });
    throw new Error('Maximum 2 assignees per task');
  }
  
  const tasksRef = collection(db, 'tasks');
  
  const newTask = {
    ...taskData,
    description: taskData.description || '',
    dueDate: taskData.dueDate || null,
    assignedTo: taskData.assignedTo || [],
    assignedToName: taskData.assignedToName || [],
    budget: taskData.budget || null,
    createdAt: serverTimestamp()
  };
  
  const docRef = await addDoc(tasksRef, newTask);
  console.log("[firebaseService] Task created successfully", { taskId: docRef.id });
  
  return {
    id: docRef.id,
    ...newTask,
    createdAt: Timestamp.now(),
    subtasks: [],
    attachments: []
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
  try {
    console.log("Generating invitation data for event:", eventId, "family:", familyId);
    
    const wedding = await getEvent(eventId);
    console.log("Wedding data loaded:", wedding);
    
    let family: (GuestFamily & { guests: Guest[] }) | undefined;
    let guests: Guest[] = [];
    
    if (familyId) {
      console.log("Loading family with guests for familyId:", familyId);
      family = await getGuestFamilyWithGuests(familyId);
      guests = family.guests;
      console.log("Family loaded:", family.name, "with", guests.length, "guests");
    } else {
      console.log("Loading all guests for event");
      guests = await getGuests(eventId);
      console.log("Loaded", guests.length, "guests");
    }
    
    // Generate QR code URL (using Google Maps API for location)
    const locationQuery = encodeURIComponent(wedding.location || wedding.weddingCity);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${locationQuery}`;
    console.log("QR code URL generated:", qrCodeUrl);
    
    // Generate RSVP link (deep link to app)
    const rsvpLink = `vivah://rsvp/${eventId}${familyId ? `?family=${familyId}` : ''}`;
    console.log("RSVP link generated:", rsvpLink);
    
    const invitationData = {
      wedding,
      family,
      guests,
      qrCodeUrl,
      rsvpLink
    };
    
    console.log("Invitation data generated successfully");
    return invitationData;
  } catch (error) {
    console.error("Error generating invitation data:", error);
    throw error;
  }
};

export const updateTask = async (taskId: string, updates: Partial<FirebaseTask>): Promise<FirebaseTask> => {
  console.log("[firebaseService] updateTask called", {
    taskId,
    updates: {
      assignedTo: updates.assignedTo,
      assignedToName: updates.assignedToName
    }
  });
  
  // Validate assignment limit (max 2 people)
  if (updates.assignedTo && updates.assignedTo.length > 2) {
    console.error("[firebaseService] Task assignment limit exceeded", {
      taskId,
      assignedTo: updates.assignedTo,
      limit: 2
    });
    throw new Error('Maximum 2 assignees per task');
  }
  
  if (updates.assignedToName && updates.assignedToName.length > 2) {
    console.error("[firebaseService] Task assignment names limit exceeded", {
      taskId,
      assignedToName: updates.assignedToName,
      limit: 2
    });
    throw new Error('Maximum 2 assignees per task');
  }
  
  const taskRef = doc(db, 'tasks', taskId);
  await updateDoc(taskRef, updates);
  
  const taskDoc = await getDoc(taskRef);
  if (!taskDoc.exists()) {
    console.error("[firebaseService] Task not found", { taskId });
    throw new Error('Task not found');
  }
  
  const taskData = taskDoc.data() as FirebaseTask;
  console.log("[firebaseService] Task updated successfully", { taskId });
  
  // Get subtasks
  const subtasksRef = collection(db, 'subtasks');
  const subtasksQuery = query(subtasksRef, where('taskId', '==', taskId));
  const subtasksSnapshot = await getDocs(subtasksQuery);
  
  // Get attachments
  const attachmentsRef = collection(db, 'attachments');
  const attachmentsQuery = query(attachmentsRef, where('taskId', '==', taskId));
  const attachmentsSnapshot = await getDocs(attachmentsQuery);
  
  return {
    ...taskData,
    id: taskDoc.id,
    subtasks: subtasksSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as FirebaseSubtask)),
    attachments: attachmentsSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as FileAttachment))
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

// Comment Operations
export const getComments = async (taskId: string, subtaskId?: string): Promise<Comment[]> => {
  const commentsRef = collection(db, 'comments');
  let q = query(commentsRef, where('taskId', '==', taskId));
  
  if (subtaskId) {
    q = query(commentsRef, where('taskId', '==', taskId), where('subtaskId', '==', subtaskId));
  } else {
    q = query(commentsRef, where('taskId', '==', taskId), where('subtaskId', '==', null));
  }
  
  const querySnapshot = await getDocs(q);
  
  const comments = querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as Comment));
  
  // Sort by createdAt in descending order (newest first)
  return comments.sort((a, b) => {
    const aTime = a.createdAt?.toMillis() || 0;
    const bTime = b.createdAt?.toMillis() || 0;
    return bTime - aTime;
  });
};

export const addComment = async (commentData: {
  taskId: string;
  subtaskId?: string | null;
  userId: string;
  userName: string;
  text: string;
}): Promise<Comment> => {
  const commentsRef = collection(db, 'comments');
  
  const newComment = {
    ...commentData,
    subtaskId: commentData.subtaskId || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  const docRef = await addDoc(commentsRef, newComment);
  return {
    id: docRef.id,
    ...newComment,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  } as Comment;
};

export const updateComment = async (commentId: string, updates: { text: string }): Promise<Comment> => {
  const commentRef = doc(db, 'comments', commentId);
  await updateDoc(commentRef, { ...updates, updatedAt: serverTimestamp() });
  
  const commentDoc = await getDoc(commentRef);
  if (!commentDoc.exists()) {
    throw new Error('Comment not found');
  }
  
  return {
    ...commentDoc.data(),
    id: commentDoc.id
  } as Comment;
};

export const deleteComment = async (commentId: string): Promise<void> => {
  const commentRef = doc(db, 'comments', commentId);
  await deleteDoc(commentRef);
};

// File Attachment Operations

// Helper function to convert base64 string to Blob
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  // Decode base64 to binary string
  const binaryString = atob(base64);
  // Create a byte array
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  // Create blob from byte array
  return new Blob([bytes], { type: mimeType });
};

// Helper function to read file as blob (handles Android content:// URIs)
const readFileAsBlob = async (uri: string, mimeType: string): Promise<Blob> => {
  console.log("[firebaseService] readFileAsBlob called", { uri, mimeType, platform: Platform.OS });
  
  // On Android, content:// URIs need to be read using FileSystem
  if (Platform.OS === 'android' && uri.startsWith('content://')) {
    console.log("[firebaseService] Reading Android content:// URI using FileSystem");
    try {
      // Read file as base64 string
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      console.log("[firebaseService] File read successfully from content:// URI", {
        base64Length: base64.length,
      });
      // Convert base64 to blob
      return base64ToBlob(base64, mimeType);
    } catch (error) {
      console.error("[firebaseService] Error reading content:// URI:", error);
      throw new Error(`Failed to read file from content:// URI: ${error}`);
    }
  }
  
  // On iOS/web, use fetch for file:// and http:// URIs
  console.log("[firebaseService] Reading file using fetch");
  const response = await fetch(uri);
  console.log("[firebaseService] File fetch response status:", response.status);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
  }
  
  const blob = await response.blob();
  console.log("[firebaseService] File converted to blob", {
    blobType: blob.type,
    blobSize: blob.size,
  });
  
  return blob;
};

export const uploadFileAttachment = async (
  taskId: string,
  fileUri: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  uploadedBy: string,
  uploadedByName: string
): Promise<FileAttachment> => {
  try {
    console.log("[firebaseService] uploadFileAttachment called", { taskId, fileName, fileType, fileSize, fileUri });
    
    // Create a unique public ID for the file
    const timestamp = Date.now();
    const publicId = `task-attachments/${taskId}/${timestamp}_${fileName.replace(/\.[^/.]+$/, "")}`;
    
    console.log("[firebaseService] Reading file from URI...", { fileUri });
    
    // Read file as blob (handles Android content:// URIs)
    const blob = await readFileAsBlob(fileUri, fileType);
    console.log("[firebaseService] File read successfully", {
      blobType: blob.type,
      blobSize: blob.size,
      expectedSize: fileSize
    });
    
    // Create FormData for Cloudinary upload
    const formData = new FormData();
    
    // Append the blob directly to FormData
    // In React Native, we need to append the blob with the correct name
    formData.append('file', blob, fileName);
    formData.append('upload_preset', 'vivah_uploads'); // IMPORTANT: Create an unsigned upload preset named 'vivah_uploads' in Cloudinary dashboard
    // To create: Go to Cloudinary Dashboard > Settings > Upload > Upload presets > Add upload preset
    // Set mode to "Unsigned" and name it 'vivah_uploads'
    formData.append('public_id', publicId);
    formData.append('folder', 'task-attachments');
    
    console.log("[firebaseService] Uploading file to Cloudinary...", {
      uploadPreset: 'vivah_uploads',
      publicId,
      folder: 'task-attachments',
      cloudName: CLOUDINARY_CLOUD_NAME,
      uploadUrl: CLOUDINARY_UPLOAD_URL,
      fileName,
      fileType,
      fileSize
    });
    
    // Upload to Cloudinary
    // Note: Don't set Content-Type header when using FormData - React Native will set it automatically with the boundary
    const uploadResponse = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });
    
    console.log("[firebaseService] Cloudinary response status:", uploadResponse.status);
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("[firebaseService] Cloudinary upload failed:", {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        errorText,
        uploadPreset: 'vivah_uploads',
        cloudName: CLOUDINARY_CLOUD_NAME
      });
      
      // Provide helpful error message
      if (errorText.includes('Upload preset must be specified')) {
        throw new Error(
          'Cloudinary upload preset not configured. Please create an unsigned upload preset named "vivah_uploads" in your Cloudinary dashboard.\n\n' +
          'Steps:\n' +
          '1. Go to Cloudinary Dashboard\n' +
          '2. Navigate to Settings > Upload > Upload presets\n' +
          '3. Click "Add upload preset"\n' +
          '4. Set mode to "Unsigned"\n' +
          '5. Name it "vivah_uploads"\n' +
          '6. Save the preset'
        );
      }
      
      throw new Error(`Cloudinary upload failed: ${errorText}`);
    }
    
    const uploadResult = await uploadResponse.json();
    console.log("[firebaseService] Cloudinary upload successful", { publicId: uploadResult.public_id, url: uploadResult.secure_url });
    
    // Save file metadata to Firestore
    const attachmentsRef = collection(db, 'attachments');
    const newAttachment = {
      taskId,
      fileName,
      fileType,
      fileSize,
      downloadUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      uploadedBy,
      uploadedByName,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(attachmentsRef, newAttachment);
    console.log("[firebaseService] File attachment metadata saved to Firestore", { attachmentId: docRef.id });
    
    return {
      id: docRef.id,
      ...newAttachment,
      createdAt: Timestamp.now()
    } as FileAttachment;
  } catch (error) {
    console.error('[firebaseService] Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
};

export const getFileAttachments = async (taskId: string): Promise<FileAttachment[]> => {
  const attachmentsRef = collection(db, 'attachments');
  const q = query(attachmentsRef, where('taskId', '==', taskId));
  const querySnapshot = await getDocs(q);
  
  const attachments = querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as FileAttachment));
  
  // Sort by createdAt in descending order (newest first)
  return attachments.sort((a, b) => {
    const aTime = a.createdAt?.toMillis() || 0;
    const bTime = b.createdAt?.toMillis() || 0;
    return bTime - aTime;
  });
};

export const deleteFileAttachment = async (attachmentId: string): Promise<void> => {
  try {
    console.log("[firebaseService] deleteFileAttachment called", { attachmentId });
    
    // Get attachment details
    const attachmentRef = doc(db, 'attachments', attachmentId);
    const attachmentDoc = await getDoc(attachmentRef);
    
    if (!attachmentDoc.exists()) {
      throw new Error('Attachment not found');
    }
    
    const attachment = attachmentDoc.data() as FileAttachment;
    console.log("[firebaseService] Attachment found", { fileName: attachment.fileName, publicId: attachment.publicId });
    
    // Note: Cloudinary deletion requires proper HMAC-SHA256 signature generation
    // which is complex in React Native without additional libraries.
    // For now, we'll just delete the metadata from Firestore.
    // The files will remain in Cloudinary but won't be accessible since the metadata is deleted.
    // In production, you should implement proper Cloudinary deletion using a backend service
    // or install crypto-js library for signature generation.
    
    if (attachment.publicId) {
      console.log("[firebaseService] Skipping Cloudinary deletion (requires proper signature generation)");
    }
    
    // Delete attachment metadata from Firestore
    await deleteDoc(attachmentRef);
    console.log("[firebaseService] Attachment metadata deleted from Firestore");
  } catch (error) {
    console.error('[firebaseService] Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
};

// Poll Operations
export const createPoll = async (pollData: {
  eventId: string;
  question: string;
  description?: string | null;
  options: string[];
  createdBy: string;
  createdByName: string;
  deadline?: string | null;
}): Promise<Poll> => {
  const pollsRef = collection(db, 'polls');
  
  // Create poll options with unique IDs
  const pollOptions: PollOption[] = pollData.options.map((text, index) => ({
    id: `option_${Date.now()}_${index}`,
    text,
    votes: 0,
    voters: []
  }));
  
  const newPoll = {
    ...pollData,
    description: pollData.description || null,
    options: pollOptions,
    status: 'active' as const,
    deadline: pollData.deadline || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  const docRef = await addDoc(pollsRef, newPoll);
  return {
    id: docRef.id,
    ...newPoll,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  } as Poll;
};

export const getPolls = async (eventId: string): Promise<Poll[]> => {
  const pollsRef = collection(db, 'polls');
  const q = query(pollsRef, where('eventId', '==', eventId));
  const querySnapshot = await getDocs(q);
  
  const polls = querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  } as Poll));
  
  // Sort by createdAt in descending order (newest first)
  return polls.sort((a, b) => {
    const aTime = a.createdAt?.toMillis() || 0;
    const bTime = b.createdAt?.toMillis() || 0;
    return bTime - aTime;
  });
};

export const getPoll = async (pollId: string): Promise<Poll> => {
  const pollRef = doc(db, 'polls', pollId);
  const pollDoc = await getDoc(pollRef);
  
  if (!pollDoc.exists()) {
    throw new Error('Poll not found');
  }
  
  return {
    ...pollDoc.data(),
    id: pollDoc.id
  } as Poll;
};

export const voteOnPoll = async (pollId: string, optionId: string, userId: string, userName: string): Promise<Poll> => {
  const pollRef = doc(db, 'polls', pollId);
  const pollDoc = await getDoc(pollRef);
  
  if (!pollDoc.exists()) {
    throw new Error('Poll not found');
  }
  
  const poll = pollDoc.data() as Poll;
  
  // Check if poll is active
  if (poll.status !== 'active') {
    throw new Error('Poll is closed');
  }
  
  // Check if user has already voted
  const hasVoted = poll.options.some(option => option.voters.includes(userId));
  if (hasVoted) {
    throw new Error('You have already voted on this poll');
  }
  
  // Find the option and update it
  const updatedOptions = poll.options.map(option => {
    if (option.id === optionId) {
      return {
        ...option,
        votes: option.votes + 1,
        voters: [...option.voters, userId]
      };
    }
    return option;
  });
  
  // Update the poll
  await updateDoc(pollRef, {
    options: updatedOptions,
    updatedAt: serverTimestamp()
  });
  
  // Get updated poll
  const updatedPollDoc = await getDoc(pollRef);
  return {
    ...updatedPollDoc.data(),
    id: pollDoc.id
  } as Poll;
};

export const closePoll = async (pollId: string): Promise<Poll> => {
  const pollRef = doc(db, 'polls', pollId);
  await updateDoc(pollRef, {
    status: 'closed',
    updatedAt: serverTimestamp()
  });
  
  const pollDoc = await getDoc(pollRef);
  if (!pollDoc.exists()) {
    throw new Error('Poll not found');
  }
  
  return {
    ...pollDoc.data(),
    id: pollDoc.id
  } as Poll;
};

export const deletePoll = async (pollId: string): Promise<void> => {
  const pollRef = doc(db, 'polls', pollId);
  await deleteDoc(pollRef);
};

export const getUserVote = async (pollId: string, userId: string): Promise<string | null> => {
  const poll = await getPoll(pollId);
  
  for (const option of poll.options) {
    if (option.voters.includes(userId)) {
      return option.id;
    }
  }
  
  return null;
};