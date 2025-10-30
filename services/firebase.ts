import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { CONFIG } from '../config';

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = [
    { key: 'apiKey', value: CONFIG.FIREBASE.apiKey },
    { key: 'authDomain', value: CONFIG.FIREBASE.authDomain },
    { key: 'projectId', value: CONFIG.FIREBASE.projectId },
  ];

  const missingFields = requiredFields.filter(
    field => !field.value || field.value.includes('Dummy') || field.value.includes('your-project')
  );

  if (missingFields.length > 0) {
    console.error('❌ Firebase Configuration Error!');
    console.error('Missing or invalid Firebase credentials:');
    missingFields.forEach(field => {
      console.error(`  - ${field.key}: ${field.value || 'NOT SET'}`);
    });
    console.error('\n📝 To fix this:');
    console.error('1. Go to https://console.firebase.google.com/');
    console.error('2. Select your project (or create a new one)');
    console.error('3. Go to Project Settings > General');
    console.error('4. Copy your Firebase config values');
    console.error('5. Update the .env file in your project root');
    console.error('6. Restart the development server\n');
    
    throw new Error(
      'Invalid Firebase API Key. Please update your .env file with valid Firebase credentials.'
    );
  }
};

// Firebase configuration
const firebaseConfig = {
  apiKey: CONFIG.FIREBASE.apiKey,
  authDomain: CONFIG.FIREBASE.authDomain,
  projectId: CONFIG.FIREBASE.projectId,
  storageBucket: CONFIG.FIREBASE.storageBucket,
  messagingSenderId: CONFIG.FIREBASE.messagingSenderId,
  appId: CONFIG.FIREBASE.appId,
  measurementId: CONFIG.FIREBASE.measurementId,
};

// Validate before initializing
validateFirebaseConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth (AsyncStorage persistence is handled automatically in React Native)
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

console.log('✅ Firebase initialized with automatic AsyncStorage persistence');

export { app, auth, db };
export default app;
