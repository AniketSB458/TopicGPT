import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  setPersistence, 
  browserSessionPersistence, 
  inMemoryPersistence 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// Configure provider
provider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error("Error signing in with Google:", error);

    // If IndexedDB experiences closure or visibility change disconnection (Database is closing/hidden)
    if (
      msg.includes("Database is closing") ||
      msg.includes("closing/hidden") ||
      msg.includes("IndexedDB") ||
      error?.code === 'auth/internal-error'
    ) {
      try {
        console.warn("Retrying Google sign in with browserSessionPersistence fallback...");
        await setPersistence(auth, browserSessionPersistence);
        const sessionResult = await signInWithPopup(auth, provider);
        return sessionResult.user;
      } catch (sessionErr: any) {
        console.warn("Retrying Google sign in with inMemoryPersistence fallback...", sessionErr);
        await setPersistence(auth, inMemoryPersistence);
        const memResult = await signInWithPopup(auth, provider);
        return memResult.user;
      }
    }

    throw error;
  }
};
