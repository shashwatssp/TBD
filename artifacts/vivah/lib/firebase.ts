import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration for web hosting
const firebaseConfig = {
  apiKey: "AIzaSyAwl0qHK8YXTq_dwjKiGuossgy2cG3YXQs",
  authDomain: "vivah-mgmt-app.firebaseapp.com",
  projectId: "vivah-mgmt-app",
  storageBucket: "vivah-mgmt-app.firebasestorage.app",
  messagingSenderId: "548525885761",
  appId: "1:548525885761:web:4b133ebb06865a3e6df9c0"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };