// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';


const firebaseConfig = {
  apiKey: "AIzaSyBxZQ1LTUVLhprJ08epat4U6Y8Fbu_D8Rk",
  authDomain: "safepawsapp-4c8d1.firebaseapp.com",
  projectId: "safepawsapp-4c8d1",
  storageBucket: "safepawsapp-4c8d1.firebasestorage.app",
  messagingSenderId: "498365665784",
  appId: "1:498365665784:web:36b17774f71227e403860d"
};

const app = initializeApp(firebaseConfig);

// For native (iOS, Android), use AsyncStorage for persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { app, auth, db };

