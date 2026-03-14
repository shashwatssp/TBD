import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export type UserRole = "manager" | "participant";

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
    createdAt: serverTimestamp()
  };
  
  const docRef = await addDoc(eventsRef, newEvent);
  return {
    id: docRef.id,
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
}): Promise<FirebaseTask> => {
  const tasksRef = collection(db, 'tasks');
  
  const newTask = {
    ...taskData,
    description: taskData.description || '',
    dueDate: taskData.dueDate || null,
    assignedTo: taskData.assignedTo || null,
    assignedToName: taskData.assignedToName || null,
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