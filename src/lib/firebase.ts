import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  query, 
  orderBy, 
  getDocs,
  getDocFromServer
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_APIKEY,
  authDomain: import.meta.env.VITE_AUTHDOMAIN,
  projectId: import.meta.env.VITE_PROJECTID,
  storageBucket: import.meta.env.VITE_STORAGEBUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGINGSENDERID,
  firestoreDatabaseId: import.meta.env.VITE_FIRESTOREDATABASEID,
  appId: import.meta.env.VITE_APPID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
console.log("Firebase initialized with project:", firebaseConfig.projectId, "and database:", firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

// CRITICAL: Connection test as per instructions
async function testConnection() {
  try {
    // Attempt to read a doc from 'test/connection' to verify connectivity and config
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection test successful");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client appears to be offline.");
    } else {
      console.warn("Firebase connection test performed. If you see 'permission-denied', that's normal for a test path, but other errors might indicate config issues.", error);
    }
  }
}
testConnection();

auth.useDeviceLanguage();
const googleProvider = new GoogleAuthProvider();

// Log current domain for whitelisting help
if (typeof window !== 'undefined') {
  console.log("Current domain for Firebase whitelist:", window.location.hostname);
}

export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function syncUserProfile(user: FirebaseUser) {
  const userRef = doc(db, 'users', user.uid);
  try {
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      const isAdmin = user.email === 'filip.petkovski.work@gmail.com';
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        role: isAdmin ? 'admin' : 'customer',
      };
      await setDoc(userRef, {
        ...profile,
        createdAt: serverTimestamp(),
      });
      return profile;
    }
    return userSnap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    throw error; // unreachable due to handleFirestoreError throw
  }
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return syncUserProfile(result.user);
}

export async function signUpWithEmail(name: string, email: string, pass: string) {
  const res = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(res.user, { displayName: name });
  return syncUserProfile(res.user);
}

export async function loginWithEmail(email: string, pass: string) {
  const res = await signInWithEmailAndPassword(auth, email, pass);
  return syncUserProfile(res.user);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userSnap = await getDoc(doc(db, 'users', uid));
  return userSnap.exists() ? (userSnap.data() as UserProfile) : null;
}

export async function submitLead(data: { name: string; email: string; business: string; message: string; package?: string; userId: string }) {
  const path = 'leads';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function updateLeadStatus(leadId: string, status: 'pending' | 'completed') {
  const path = `leads/${leadId}`;
  try {
    await updateDoc(doc(db, 'leads', leadId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function joinWaitlist(userId: string, email: string) {
  const path = 'waitlist';
  try {
    await setDoc(doc(db, path, userId), {
      email,
      joinedAt: serverTimestamp(),
      product: 'AI TRIO MASTERCLASS'
    });

    await updateDoc(doc(db, 'stats', 'ebooks'), {
      enrollmentCount: increment(1)
    });

    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function checkWaitlistStatus(userId: string) {
  const path = `waitlist/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'waitlist', userId));
    return snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    throw error;
  }
}

export async function getLeads() {
  const path = 'leads';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
}

export async function getEnrollmentCount() {
  const path = 'stats/ebooks';
  try {
    const snap = await getDoc(doc(db, 'stats', 'ebooks'));
    if (snap.exists()) {
      return snap.data().enrollmentCount as number;
    } else {
      // Initialize if not exists
      await setDoc(doc(db, 'stats', 'ebooks'), { enrollmentCount: 87 });
      return 87;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    throw error;
  }
}
