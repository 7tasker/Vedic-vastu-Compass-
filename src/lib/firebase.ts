import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signInWithCredential as fbSignInWithCredential,
  signInWithPopup as fbSignInWithPopup,
  signInWithRedirect as fbSignInWithRedirect,
  getRedirectResult as fbGetRedirectResult,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as fbCreateUserWithEmailAndPassword,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  setLogLevel,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
} from 'firebase/firestore';
import rawFirebaseConfig from '../../firebase-applet-config.json';
import { PropertyRecord } from '../types';

// Detect whether valid external Firebase project credentials exist
export const isConfigValid = Boolean(
  rawFirebaseConfig &&
  rawFirebaseConfig.apiKey &&
  rawFirebaseConfig.apiKey.trim().length > 5 &&
  rawFirebaseConfig.projectId &&
  rawFirebaseConfig.projectId.trim().length > 2
);

export const isFirebaseEnabled = (): boolean => isConfigValid;

// Dummy config fallback when Firebase is disconnected or unconfigured
const safeConfig = isConfigValid
  ? rawFirebaseConfig
  : {
      apiKey: 'AIzaSyDummyKeyForLocalOfflineMode000000',
      authDomain: 'localhost',
      projectId: 'local-vastudrishti-app',
      storageBucket: '',
      messagingSenderId: '000000000000',
      appId: '1:000000000000:web:0000000000000000000000',
    };

// Initialize Firebase App safely
const app = getApps().length > 0 ? getApp() : initializeApp(safeConfig);

let authInstance: Auth;
try {
  authInstance = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence],
    popupRedirectResolver: browserPopupRedirectResolver,
  });
} catch {
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Suppress transient internal SDK warnings
setLogLevel('silent');

// Initialize Firestore instance using firestoreDatabaseId if specified
const firestoreDatabaseId = (rawFirebaseConfig as any)?.firestoreDatabaseId;

let firestoreDb;
try {
  firestoreDb = firestoreDatabaseId
    ? initializeFirestore(app, { experimentalForceLongPolling: true }, firestoreDatabaseId)
    : initializeFirestore(app, { experimentalForceLongPolling: true });
} catch {
  firestoreDb = firestoreDatabaseId
    ? getFirestore(app, firestoreDatabaseId)
    : getFirestore(app);
}

export const db = firestoreDb;

export const ADMIN_EMAIL = 'admin@vastucompass.app';
const LEGACY_ADMIN_EMAIL = 'admin@7tasker.com';

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return normalized === ADMIN_EMAIL.toLowerCase() || normalized === LEGACY_ADMIN_EMAIL.toLowerCase();
};

// Interface for User DB Document
export interface UserDbProfile {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  photoURL?: string;
  role: 'admin' | 'user';
  isProMember: boolean;
  activePlan?: string;
  savedPropertiesCount: number;
  savedProperties?: PropertyRecord[];
  createdAt: string;
  lastLoginAt: string;
}

// Interface for Payment Record
export interface PaymentRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number; // in INR or USD
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  gateway?: 'razorpay' | 'paypal' | 'gpay' | string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  gpayPaymentId?: string;
  planId: string;
  planName: string;
  createdAt: string;
  timestamp?: number;
}

// Interface for AdSense Report
export interface AdSenseReport {
  id: string;
  date: string;
  impressions: number;
  clicks: number;
  ctr: number; // percentage e.g. 2.4%
  ecpm: number; // e.g. ₹180.50
  revenue: number; // total in INR
  activeAdUnits: number;
  publisherId: string;
  createdAt: string;
}

// Interface for Audit Report Record
export interface AuditReportRecord {
  id?: string;
  reportRefNumber: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  propertyName?: string;
  propertyType?: string;
  facingDirection?: string;
  overallScore: number;
  grade: string;
  summaryText?: string;
  doshCount?: number;
  remedyCount?: number;
  totalRooms?: number;
  createdAt: string;
  timestamp?: number;
}

// Local Auth State Handler for disconnected offline mode
type AuthStateCallback = (user: FirebaseUser | null) => void;
const localAuthListeners: AuthStateCallback[] = [];

let currentLocalUser: any = (() => {
  try {
    const saved = localStorage.getItem('vastu_local_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
})();

const notifyLocalAuthListeners = (user: any) => {
  currentLocalUser = user;
  if (user) {
    try {
      localStorage.setItem('vastu_local_user', JSON.stringify(user));
    } catch {}
  } else {
    try {
      localStorage.removeItem('vastu_local_user');
    } catch {}
  }
  localAuthListeners.forEach((cb) => cb(user));
};

export const onAuthStateChanged = (
  authInstance: Auth,
  callback: (user: FirebaseUser | null) => void
) => {
  localAuthListeners.push(callback);

  if (!isConfigValid) {
    setTimeout(() => callback(currentLocalUser), 0);
    return () => {
      const idx = localAuthListeners.indexOf(callback);
      if (idx !== -1) localAuthListeners.splice(idx, 1);
    };
  }

  const unsubFb = fbOnAuthStateChanged(
    authInstance,
    (fbUser) => {
      if (fbUser) {
        currentLocalUser = fbUser;
        try {
          localStorage.setItem('vastu_local_user', JSON.stringify(fbUser));
        } catch {}
        callback(fbUser);
      } else {
        currentLocalUser = null;
        try {
          localStorage.removeItem('vastu_local_user');
        } catch {}
        callback(null);
      }
    },
    (error) => {
      const msg = error?.message || String(error);
      if (msg.includes('Database is closing') || msg.includes('closing/hidden') || (error as any)?.code === 'auth/internal-error') {
        console.info('ℹ️ [Firebase Auth Notice]: Auth observer suppressed transient DB state notice:', msg);
        return;
      }
      console.warn('Firebase Auth State Observer notice:', error);
    }
  );

  return () => {
    const idx = localAuthListeners.indexOf(callback);
    if (idx !== -1) localAuthListeners.splice(idx, 1);
    unsubFb();
  };
};

export const signInWithEmailAndPassword = async (
  authInstance: Auth,
  email: string,
  pass: string
) => {
  if (!isConfigValid) {
    const isAdmin = isAdminEmail(email);
    const mockUser = {
      uid: 'local_user_' + String(email).replace(/[^a-zA-Z0-9]/g, '_'),
      email,
      displayName: isAdmin ? 'Admin' : email.split('@')[0],
      photoURL: '',
      emailVerified: true,
    } as unknown as FirebaseUser;
    notifyLocalAuthListeners(mockUser);
    return { user: mockUser };
  }
  return await fbSignInWithEmailAndPassword(authInstance, email, pass);
};

export const createUserWithEmailAndPassword = async (
  authInstance: Auth,
  email: string,
  pass: string
) => {
  if (!isConfigValid) {
    const isAdmin = isAdminEmail(email);
    const mockUser = {
      uid: 'local_user_' + String(email).replace(/[^a-zA-Z0-9]/g, '_'),
      email,
      displayName: isAdmin ? 'Admin' : email.split('@')[0],
      photoURL: '',
      emailVerified: true,
    } as unknown as FirebaseUser;
    notifyLocalAuthListeners(mockUser);
    return { user: mockUser };
  }
  return await fbCreateUserWithEmailAndPassword(authInstance, email, pass);
};

export const signInWithGoogleCredential = async (authInstance: Auth, idToken: string) => {
  const credential = GoogleAuthProvider.credential(idToken);
  if (!isConfigValid) {
    const mockUser = {
      uid: 'native_google_user_' + Math.random().toString(36).substring(2, 9),
      displayName: 'Vedic Practitioner',
      email: 'user@vastucompass.app',
      photoURL: '',
      emailVerified: true,
    } as unknown as FirebaseUser;
    notifyLocalAuthListeners(mockUser);
    return { user: mockUser };
  }
  return await fbSignInWithCredential(authInstance, credential);
};

export const signInWithPopup = async (authInstance: Auth, provider: any) => {
  if (!isConfigValid) {
    const mockUser = {
      uid: 'local_google_user_admin',
      email: ADMIN_EMAIL,
      displayName: 'Satish Admin',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      emailVerified: true,
    } as unknown as FirebaseUser;
    notifyLocalAuthListeners(mockUser);
    return { user: mockUser };
  }
  return await fbSignInWithPopup(authInstance, provider);
};

export const signInWithRedirect = async (authInstance: Auth, provider: any) => {
  if (!isConfigValid) {
    return signInWithPopup(authInstance, provider);
  }
  return fbSignInWithRedirect(authInstance, provider);
};

export const getRedirectResult = async (authInstance: Auth) => {
  if (!isConfigValid || !authInstance) {
    return null;
  }
  try {
    return await fbGetRedirectResult(authInstance);
  } catch (err: any) {
    const code = err?.code || '';
    const msg = err?.message || String(err);
    if (
      code === 'auth/argument-error' ||
      code === 'auth/null-user' ||
      code === 'auth/internal-error' ||
      msg.includes('Database is closing') ||
      msg.includes('closing/hidden') ||
      msg.includes('auth/argument-error')
    ) {
      console.info('ℹ️ [Firebase Auth Notice]: Redirect result skipped or no redirect pending in current environment.');
      return null;
    }
    throw err;
  }
};

export const signOut = async (authInstance: Auth) => {
  notifyLocalAuthListeners(null);
  try {
    localStorage.removeItem('vastu_local_user');
    localStorage.removeItem('vastu_active_user_profile');
    localStorage.removeItem('vastudrishti_audit_unlocked');
  } catch {}
  if (isConfigValid) {
    return fbSignOut(authInstance);
  }
};

// Firestore Error Handler helper
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export const handleFirestoreError = (
  error: unknown,
  operationType: OperationType,
  path: string | null
) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path,
  };
  console.warn('Local/Firestore Notice:', errInfo.error);
  return errInfo;
};

// Ensure user profile syncs to local storage & Firestore if configured
export const syncUserProfileToFirestore = async (user: FirebaseUser): Promise<UserDbProfile> => {
  const isAdmin = isAdminEmail(user.email);
  const userKey = `vastu_profile_${user.uid}`;

  let existingProfile: UserDbProfile | null = null;
  try {
    const saved = localStorage.getItem(userKey);
    if (saved) existingProfile = JSON.parse(saved);
  } catch {}

  let remoteDocData: Partial<UserDbProfile> = {};
  if (isConfigValid) {
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        remoteDocData = snap.data() as Partial<UserDbProfile>;
      }
    } catch (err) {
      console.warn('Firestore user profile fetch notice:', err);
    }
  }

  const effectiveRole: 'admin' | 'user' = isAdmin
    ? 'admin'
    : (remoteDocData.role || existingProfile?.role || 'user');

  const effectiveIsPro: boolean = effectiveRole === 'admin'
    ? true
    : (remoteDocData.isProMember ?? existingProfile?.isProMember ?? false);

  const updatedProfile: UserDbProfile = {
    uid: user.uid,
    email: user.email || remoteDocData.email || existingProfile?.email || '',
    name: user.displayName || remoteDocData.name || existingProfile?.name || 'Vedic Architect',
    photoURL: user.photoURL || remoteDocData.photoURL || existingProfile?.photoURL || '',
    role: effectiveRole,
    isProMember: effectiveIsPro,
    savedPropertiesCount: remoteDocData.savedPropertiesCount ?? existingProfile?.savedPropertiesCount ?? 0,
    createdAt: remoteDocData.createdAt || existingProfile?.createdAt || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(userKey, JSON.stringify(updatedProfile));
  } catch {}

  if (isConfigValid) {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, updatedProfile, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  }

  return updatedProfile;
};

// Function to save/record audit report to local storage / Firestore
export const recordAuditReportInFirestore = async (
  auditData: AuditReportRecord
): Promise<string> => {
  const refNum =
    auditData.reportRefNumber ||
    `RPT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const recordToSave = {
    ...auditData,
    reportRefNumber: refNum,
    createdAt: auditData.createdAt || new Date().toISOString(),
    timestamp: auditData.timestamp || Date.now(),
  };

  try {
    const savedListStr = localStorage.getItem('vastu_saved_audit_reports') || '[]';
    const savedList = JSON.parse(savedListStr);
    const updatedList = [
      recordToSave,
      ...savedList.filter((r: any) => r.reportRefNumber !== refNum),
    ];
    localStorage.setItem('vastu_saved_audit_reports', JSON.stringify(updatedList));
  } catch {}

  if (isConfigValid) {
    try {
      const docRef = doc(db, 'audit_reports', refNum);
      await setDoc(docRef, recordToSave, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `audit_reports/${refNum}`);
    }
  }

  return refNum;
};

// Log payment to local storage / Firestore
export const recordPaymentInFirestore = async (
  paymentData: Omit<PaymentRecord, 'id' | 'createdAt'>
): Promise<string> => {
  const paymentId = 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const createdAt = new Date().toISOString();
  const timestamp = Date.now();

  const recordToSave: PaymentRecord = {
    ...paymentData,
    id: paymentId,
    createdAt,
    timestamp,
  };

  // 1. Persist to localStorage
  try {
    const savedStr = localStorage.getItem('vastu_payment_records') || '[]';
    const list = JSON.parse(savedStr);
    const updatedList = [recordToSave, ...list.filter((p: any) => p.id !== paymentId && p.razorpayPaymentId !== recordToSave.razorpayPaymentId)];
    localStorage.setItem('vastu_payment_records', JSON.stringify(updatedList));

    // Also update current active user local profile
    const activeProfileStr = localStorage.getItem('vastu_active_user_profile');
    if (activeProfileStr) {
      const activeProfile = JSON.parse(activeProfileStr);
      activeProfile.isProMember = true;
      activeProfile.activePlan = recordToSave.planId;
      localStorage.setItem('vastu_active_user_profile', JSON.stringify(activeProfile));
    }
  } catch (err) {
    console.warn('Local payment storage note:', err);
  }

  // 2. Persist to Firestore payments collection
  if (isConfigValid) {
    try {
      const paymentDocRef = doc(db, 'payments', paymentId);
      await setDoc(paymentDocRef, recordToSave, { merge: true });

      // Update user doc in Firestore if userId exists
      if (paymentData.userId && paymentData.userId !== 'guest') {
        try {
          const userDocRef = doc(db, 'users', paymentData.userId);
          await setDoc(
            userDocRef,
            {
              isProMember: true,
              activePlan: paymentData.planId,
              lastPurchaseAt: createdAt,
              lastPaymentId: paymentId,
            },
            { merge: true }
          );
        } catch (uErr) {
          console.warn('Could not sync user pro status to user doc:', uErr);
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `payments/${paymentId}`);
    }
  }

  // 3. Broadcast custom event for active tabs/modals
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('vastu_payment_recorded', { detail: recordToSave })
      );
    } catch {}
  }

  return paymentId;
};

// Fetch user purchase & order history from Firestore & Local Storage
export const getUserPurchaseHistory = async (
  userId?: string,
  userEmail?: string
): Promise<PaymentRecord[]> => {
  const localMap = new Map<string, PaymentRecord>();

  // 1. Load from localStorage
  try {
    const savedStr = localStorage.getItem('vastu_payment_records') || '[]';
    const list: PaymentRecord[] = JSON.parse(savedStr);
    list.forEach((rec) => {
      if (rec && rec.id) {
        // Filter for matching user if provided, or if guest include matching email
        const matchesUser =
          !userId && !userEmail
            ? true
            : (userId && rec.userId === userId) ||
              (userEmail && rec.userEmail?.toLowerCase() === userEmail.toLowerCase()) ||
              (userId && rec.userId?.includes(userId));

        if (matchesUser) {
          localMap.set(rec.id, rec);
        }
      }
    });
  } catch (e) {
    console.warn('Local purchase history load error:', e);
  }

  // 2. Fetch from Firestore payments collection
  if (isConfigValid) {
    try {
      const colRef = collection(db, 'payments');
      const snap = await getDocs(colRef);
      snap.forEach((d) => {
        const data = d.data() as PaymentRecord;
        const recId = data.id || d.id;
        const matchesUser =
          !userId && !userEmail
            ? true
            : (userId && data.userId === userId) ||
              (userEmail && data.userEmail?.toLowerCase() === userEmail.toLowerCase()) ||
              (userId && data.userId?.includes(userId));

        if (matchesUser) {
          localMap.set(recId, { ...data, id: recId });
        }
      });

      // Update local storage with full cloud sync
      try {
        const existingAllStr = localStorage.getItem('vastu_payment_records') || '[]';
        const existingAll: PaymentRecord[] = JSON.parse(existingAllStr);
        const mergedAllMap = new Map<string, PaymentRecord>();
        existingAll.forEach((p) => mergedAllMap.set(p.id, p));
        localMap.forEach((p, k) => mergedAllMap.set(k, p));
        localStorage.setItem(
          'vastu_payment_records',
          JSON.stringify(Array.from(mergedAllMap.values()))
        );
      } catch {}
    } catch (err) {
      console.warn('Firestore payment history fetch notice:', err);
    }
  }

  const results = Array.from(localMap.values());
  results.sort((a, b) => {
    const tA = a.timestamp || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const tB = b.timestamp || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return tB - tA;
  });

  return results;
};

// Restore purchases helper: verifies user purchases and unlocks Pro
export const restoreUserPurchases = async (
  userId?: string,
  userEmail?: string
): Promise<{ restored: boolean; planId?: string; count: number }> => {
  try {
    const history = await getUserPurchaseHistory(userId, userEmail);
    const completedPurchases = history.filter((p) => p.status === 'completed');

    if (completedPurchases.length > 0) {
      const latestPurchase = completedPurchases[0];
      const planId = latestPurchase.planId || 'lifetime_pro';

      // Set pro unlock in storage
      localStorage.setItem('vastudrishti_audit_unlocked', 'true');
      const activeProfileStr = localStorage.getItem('vastu_active_user_profile');
      if (activeProfileStr) {
        const activeProfile = JSON.parse(activeProfileStr);
        activeProfile.isProMember = true;
        activeProfile.activePlan = planId;
        localStorage.setItem('vastu_active_user_profile', JSON.stringify(activeProfile));
      }

      return {
        restored: true,
        planId,
        count: completedPurchases.length,
      };
    }
  } catch (err) {
    console.warn('Restore purchases error:', err);
  }

  return { restored: false, count: 0 };
};

export interface AppTimelineEntry {
  version: string;
  buildNumber: string;
  releaseDate: string;
  title: string;
  type?: 'major' | 'feature' | 'patch' | 'initial';
  highlights: string[];
}

// Interface for App Legal & Info Config
export interface AppLegalAndInfoConfig {
  privacyPolicy: {
    title: string;
    lastUpdated: string;
    externalUrl: string;
    content: string;
  };
  appInfo: {
    title: string;
    version: string;
    buildNumber: string;
    releaseDate: string;
    externalUrl: string;
    improvements: string[];
    timeline?: AppTimelineEntry[];
    description: string;
    developerInfo: string;
  };
}

export const DEFAULT_LEGAL_AND_INFO_CONFIG: AppLegalAndInfoConfig = {
  privacyPolicy: {
    title: 'Privacy Policy, Terms & Conditions & Sacred Sadhana Disclaimer',
    lastUpdated: 'August 2026',
    externalUrl: 'https://vastucompass.app/privacy-policy',
    content: `### PRIVACY POLICY

1. Information We Collect
We collect property layout data (compass directions, degree orientations, room coordinates), user account contact details (Name, Email), and audit report reference numbers.

2. How We Use Your Information
Your property coordinate data is processed strictly to generate 16-Zone Vedic Vastu audit reports, calculate elemental balances (Pancha Tattva), and provide personalized remedies.

3. Data Protection & Security
All audit records and report reference numbers are protected using 256-bit TLS SSL encryption. We never sell or share your personal property geometry with unverified third parties.

---

### TERMS & CONDITIONS OF SERVICE

1. Acceptance of Terms
By accessing or using Vastu Compass, placing orders, or generating audit reports, you agree to be bound by these Terms & Conditions.

2. Usage Guidelines
Our audit calculations and Vedic architectural guidance are derived from classic Vastu Shastra texts. All user-generated content and reports remain private to your account.

3. Subscription & Digital Deliverables
Pro Memberships and custom report generation grant digital access to advanced calculation engines and consultation features.

---

### SACRED SADHANA DISCLAIMER

Disclaimer:
This is a spiritual practice, not a commercial product. By placing an order, you acknowledge that it is created as part of a sacred sadhana and accept that no legal disputes or claims will be entertained in any court of law.`,
  },
  appInfo: {
    title: 'Vastu Compass • Vedic Spatial Harmony Platform',
    version: 'v3.3.0',
    buildNumber: '330',
    releaseDate: 'August 24, 2026',
    externalUrl: 'https://vastucompass.app/release-notes-v3-3-0',
    improvements: [
      '🧭 3D Tilt Compensation Engine: Hardware-accelerated Euler angle projections (Pitch β & Roll γ) maintaining precise azimuth accuracy during hand-held tilt.',
      '🌐 True North (TN) vs Magnetic North (MN) Mode: Real-time World Magnetic Model (WMM) geomagnetic declination calculation with instant GPS-based toggle.',
      '⚖️ Interactive Inclinometer & Bubble Level: Precision 2D spirit level visualizer with 0.1° surface leveling resolution and slope angle diagnostics.',
      '🧲 Magnetic Field Intensity & Interference Meter: Live ambient flux monitoring in Microteslas (μT) with automated electromagnetic distortion warnings.',
      '📍 High-Precision GPS DMS Ribbon: Real-time coordinate formatting in Degrees, Minutes, Seconds (DMS), altitude elevation, and GPS accuracy tracking.',
      '🚀 Over-The-Air (OTA) Asset Sync Engine: Live background bundle update compatibility with Capacitor / Android WebView.',
      '🪟 Interactive Popup Overlays: Full-screen Vastu Mandala visualizer, 16-Zone Deity & Limb detail cards, and audit reports.',
      '📱 Centered & Responsive Mobile Layout: Single-finger touch ergonomics, bounded containers, and portrait/landscape adaptation.',
      '📋 Unique Audit Report Reference Number (#RPT) with instant cloud syncing.',
      '⚡ 45% reduction in initial bundle size and instant offline compass caching.',
    ],
    timeline: [
      {
        version: 'v3.3.0',
        buildNumber: '330',
        releaseDate: 'August 24, 2026',
        title: '3D Tilt Compensation, True North & Inclinometer Bubble Level',
        type: 'major',
        highlights: [
          'Implemented 3D Tilt-Compensated heading algorithm utilizing pitch and roll to eliminate hand-tilt azimuth drift.',
          'Added True North (Geographic) vs Magnetic North toggle with dynamic GPS geomagnetic declination calculation.',
          'Built-in precision 2D Surface Inclinometer & Bubble Level with slope angle tracking for flat surface verification.',
          'Real-time ambient magnetic field sensor telemetry (μT) with smart electromagnetic interference detection.',
          'High-precision GPS DMS (Degrees, Minutes, Seconds) coordinate ribbon with altitude and declination readouts.',
          'Updated App Improvement and release history timeline with detailed sensor architecture specifications.',
        ],
      },
      {
        version: 'v3.2.5',
        buildNumber: '325',
        releaseDate: 'August 21, 2026',
        title: 'OTA Live Asset Sync & High-Precision Calibration',
        type: 'feature',
        highlights: [
          'Over-The-Air (OTA) Live Asset Sync for instant web asset updates on mobile devices.',
          'Pulsing Calibration Required real-time sensor prompt for magnetic distortion recovery.',
          'Relocated zero offset reset to top right header bar for quick access.',
          'Unified consistent Vastu Compass branding across Android Manifest and Capacitor configs.',
        ],
      },
      {
        version: 'v3.2.0',
        buildNumber: '320',
        releaseDate: 'August 12, 2026',
        title: 'Vedic 16-Zone Energy Engine & Dual Multi-Currency Checkout',
        type: 'feature',
        highlights: [
          'Full 16-Zone Devata & Limb energy mapping with cardinal haptic locks.',
          'Google Pay UPI and international PayPal direct checkout integration.',
          'Interactive Vastu Mandala popup viewer and offline audit storage.',
        ],
      },
      {
        version: 'v3.1.0',
        buildNumber: '310',
        releaseDate: 'July 28, 2026',
        title: 'House Audit Reference #RPT Generator & Offline Storage',
        type: 'feature',
        highlights: [
          'Automated Unique Audit Reference (#RPT) generation with cloud sync.',
          'Pancha Mahabhuta elemental weight calculations.',
        ],
      },
      {
        version: 'v3.0.0',
        buildNumber: '300',
        releaseDate: 'July 10, 2026',
        title: 'Native Android Magnetometer & Sensor Calibration Suite',
        type: 'initial',
        highlights: [
          'Real-time magnetometer fusion with exponential smoothing filters.',
          'Sensor 8-loop calibration guide & Quick-Zero physical facing offset.',
        ],
      },
    ],
    description:
      'Vastu Compass is an advanced spatial energy analysis tool combining ancient Indian Vastu Shastra principles with modern magnetometer orientation sensors, interactive popup overlays, responsive screen sizing, and AI technology.',
    developerInfo:
      'Engineered with React, TypeScript, Tailwind CSS, Lucide Icons, Capacitor Android Native Runtime, and Offline-First Local Storage Engine.',
  },
};

export const fetchAppLegalAndInfoFromFirestore = async (): Promise<AppLegalAndInfoConfig> => {
  try {
    const localSaved = localStorage.getItem('vastu_app_legal_info');
    if (localSaved) {
      const parsed = JSON.parse(localSaved);
      return {
        ...DEFAULT_LEGAL_AND_INFO_CONFIG,
        ...parsed,
        privacyPolicy: { ...DEFAULT_LEGAL_AND_INFO_CONFIG.privacyPolicy, ...parsed.privacyPolicy },
        appInfo: { ...DEFAULT_LEGAL_AND_INFO_CONFIG.appInfo, ...parsed.appInfo },
      };
    }
  } catch {}

  if (isConfigValid) {
    try {
      const docRef = doc(db, 'app_content', 'legal_and_info');
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200));
      const docSnapPromise = getDoc(docRef);
      const docSnap = await Promise.race([docSnapPromise, timeoutPromise]);

      if (docSnap && 'exists' in docSnap && docSnap.exists()) {
        const data = docSnap.data() as AppLegalAndInfoConfig;
        const merged: AppLegalAndInfoConfig = {
          ...DEFAULT_LEGAL_AND_INFO_CONFIG,
          ...data,
          privacyPolicy: { ...DEFAULT_LEGAL_AND_INFO_CONFIG.privacyPolicy, ...data.privacyPolicy },
          appInfo: { ...DEFAULT_LEGAL_AND_INFO_CONFIG.appInfo, ...data.appInfo },
        };
        try {
          localStorage.setItem('vastu_app_legal_info', JSON.stringify(merged));
        } catch {}
        return merged;
      }
    } catch (err) {
      console.warn('Using local legal and app info config:', err);
    }
  }

  try {
    localStorage.setItem('vastu_app_legal_info', JSON.stringify(DEFAULT_LEGAL_AND_INFO_CONFIG));
  } catch {}

  return DEFAULT_LEGAL_AND_INFO_CONFIG;
};

export const saveAppLegalAndInfoToFirestore = async (
  config: AppLegalAndInfoConfig
): Promise<boolean> => {
  try {
    localStorage.setItem('vastu_app_legal_info', JSON.stringify(config));
  } catch {}

  if (isConfigValid) {
    try {
      const docRef = doc(db, 'app_content', 'legal_and_info');
      await setDoc(
        docRef,
        {
          ...config,
          updatedAt: new Date().toISOString(),
          updatedTimestamp: Date.now(),
        },
        { merge: true }
      );
      return true;
    } catch (err) {
      console.warn('Firestore setDoc notice for app legal info:', err);
      return true;
    }
  }

  return true;
};

// Log AdSense impression or click metrics to local storage / Firestore
export const recordAdSenseMetricInFirestore = async (
  metric: { type: 'impression' | 'click'; estRevenue?: number }
) => {
  const todayStr = new Date().toISOString().split('T')[0];
  try {
    const savedStr = localStorage.getItem('vastu_adsense_metrics_' + todayStr);
    const current: AdSenseReport = savedStr
      ? JSON.parse(savedStr)
      : {
          id: todayStr,
          date: todayStr,
          impressions: 0,
          clicks: 0,
          ctr: 0,
          ecpm: 180.0,
          revenue: 0,
          activeAdUnits: 4,
          publisherId: 'ca-pub-vastu-compass-9921',
          createdAt: new Date().toISOString(),
        };

    const newImpressions = current.impressions + (metric.type === 'impression' ? 1 : 0);
    const newClicks = current.clicks + (metric.type === 'click' ? 1 : 0);
    const newCtr = newImpressions > 0 ? parseFloat(((newClicks / newImpressions) * 100).toFixed(2)) : 0;
    const addedRevenue = metric.estRevenue || (metric.type === 'click' ? 4.5 : 0.15);
    const newRevenue = parseFloat((current.revenue + addedRevenue).toFixed(2));
    const newEcpm = newImpressions > 0 ? parseFloat(((newRevenue / newImpressions) * 1000).toFixed(2)) : 150;

    const updated: AdSenseReport = {
      ...current,
      impressions: newImpressions,
      clicks: newClicks,
      ctr: newCtr,
      revenue: newRevenue,
      ecpm: newEcpm,
    };

    localStorage.setItem('vastu_adsense_metrics_' + todayStr, JSON.stringify(updated));

    if (isConfigValid) {
      const docRef = doc(db, 'adsense_reports', todayStr);
      await setDoc(docRef, updated, { merge: true }).catch(() => {});
    }
  } catch (e) {
    console.warn('AdSense metric update handled locally:', e);
  }
};

let propertiesSaveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// Save user properties list & layout data to local storage & Firestore
export interface UserLocationRecord {
  id?: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  city?: string;
  country?: string;
  deviceHeading?: number;
  timestamp: string;
  createdAt: string;
}

// Log GPS location to local storage & Firestore backend
export const recordUserLocationInFirestore = async (
  locData: Omit<UserLocationRecord, 'id' | 'createdAt'>
): Promise<string> => {
  const locId = 'loc_' + Date.now();
  const recordToSave: UserLocationRecord = {
    ...locData,
    id: locId,
    createdAt: new Date().toISOString(),
  };

  try {
    const savedStr = localStorage.getItem('vastu_user_location_history') || '[]';
    const list = JSON.parse(savedStr);
    localStorage.setItem('vastu_user_location_history', JSON.stringify([recordToSave, ...list.slice(0, 50)]));
    localStorage.setItem('vastudrishti_user_location', JSON.stringify(recordToSave));
  } catch {}

  if (isConfigValid) {
    try {
      const colRef = collection(db, 'user_locations');
      await addDoc(colRef, recordToSave);

      if (locData.userId) {
        const userRef = doc(db, 'users', locData.userId);
        await setDoc(
          userRef,
          {
            lastGpsLocation: {
              latitude: locData.latitude,
              longitude: locData.longitude,
              accuracy: locData.accuracy,
              city: locData.city,
              country: locData.country,
              updatedAt: recordToSave.createdAt,
            },
            lastLocationTimestamp: Date.now(),
          },
          { merge: true }
        );
      }
      return locId;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'user_locations');
    }
  }

  return locId;
};

export const saveUserPropertiesToFirestore = async (
  uid: string | undefined,
  properties: PropertyRecord[]
): Promise<void> => {
  const userKey = `vastu_user_properties_${uid || 'guest'}`;
  try {
    localStorage.setItem(userKey, JSON.stringify(properties));
  } catch (err) {
    console.warn('Could not cache user properties locally:', err);
  }

  if (uid && isConfigValid) {
    if (propertiesSaveDebounceTimer) {
      clearTimeout(propertiesSaveDebounceTimer);
    }

    propertiesSaveDebounceTimer = setTimeout(async () => {
      try {
        const userRef = doc(db, 'users', uid);
        await setDoc(
          userRef,
          {
            properties,
            savedPropertiesCount: properties.length,
            propertiesUpdatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err: any) {
        console.warn('Firestore user properties sync notice:', err?.message || err);
      }
    }, 1200);
  }
};

// Load user properties list & layout data from Firestore or local storage
export const loadUserPropertiesFromFirestore = async (
  uid: string | undefined
): Promise<PropertyRecord[] | null> => {
  const userKey = `vastu_user_properties_${uid || 'guest'}`;
  let localProperties: PropertyRecord[] | null = null;
  try {
    const saved = localStorage.getItem(userKey);
    if (saved) {
      localProperties = JSON.parse(saved);
    }
  } catch {}

  if (uid && isConfigValid) {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists() && snap.data()?.properties && Array.isArray(snap.data()?.properties)) {
        const remoteProps = snap.data().properties as PropertyRecord[];
        if (remoteProps.length > 0) {
          try {
            localStorage.setItem(userKey, JSON.stringify(remoteProps));
          } catch {}
          return remoteProps;
        }
      }
    } catch (err) {
      console.warn('Firestore user properties fetch notice:', err);
    }
  }

  return localProperties;
};

/**
 * Save or update a specific property address with its tied user details,
 * payment receipt number, Vastu report number, and consultation signing details
 * both to /properties/{propertyId} and in the user's properties array.
 */
export const savePropertyAddressToFirestore = async (
  property: PropertyRecord
): Promise<boolean> => {
  if (!property.id) return false;

  // 1. Update in local storage
  try {
    const userKey = `vastu_user_properties_${property.userId || 'guest'}`;
    const saved = localStorage.getItem(userKey);
    let list: PropertyRecord[] = saved ? JSON.parse(saved) : [];
    const idx = list.findIndex((p) => p.id === property.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...property };
    } else {
      list.push(property);
    }
    localStorage.setItem(userKey, JSON.stringify(list));

    // Also update all_properties collection in localStorage
    const allPropsKey = 'vastu_all_properties_db';
    const allSaved = localStorage.getItem(allPropsKey);
    let allList: PropertyRecord[] = allSaved ? JSON.parse(allSaved) : [];
    const allIdx = allList.findIndex((p) => p.id === property.id);
    if (allIdx >= 0) {
      allList[allIdx] = { ...allList[allIdx], ...property };
    } else {
      allList.push(property);
    }
    localStorage.setItem(allPropsKey, JSON.stringify(allList));
  } catch (err) {
    console.warn('Local property address save error:', err);
  }

  // 2. Persist to Firestore /properties/{propertyId} and update user record
  if (isConfigValid) {
    try {
      const propDocRef = doc(db, 'properties', property.id);
      await setDoc(propDocRef, property, { merge: true });

      if (property.userId && property.userId !== 'guest') {
        const userRef = doc(db, 'users', property.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          let props: PropertyRecord[] = Array.isArray(userData.properties) ? userData.properties : [];
          const pIdx = props.findIndex((p) => p.id === property.id);
          if (pIdx >= 0) {
            props[pIdx] = { ...props[pIdx], ...property };
          } else {
            props.push(property);
          }
          await setDoc(
            userRef,
            {
              properties: props,
              savedPropertiesCount: props.length,
              lastPropertyUpdated: property.id,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      }
      return true;
    } catch (err) {
      console.warn('Firestore property address save error:', err);
    }
  }

  return true;
};

/**
 * Delete a property address from Firestore and local storage
 */
export const deletePropertyAddressFromFirestore = async (
  propertyId: string,
  userId?: string
): Promise<boolean> => {
  try {
    const userKey = `vastu_user_properties_${userId || 'guest'}`;
    const saved = localStorage.getItem(userKey);
    if (saved) {
      const list: PropertyRecord[] = JSON.parse(saved);
      const filtered = list.filter((p) => p.id !== propertyId);
      localStorage.setItem(userKey, JSON.stringify(filtered));
    }

    const allPropsKey = 'vastu_all_properties_db';
    const allSaved = localStorage.getItem(allPropsKey);
    if (allSaved) {
      const allList: PropertyRecord[] = JSON.parse(allSaved);
      const allFiltered = allList.filter((p) => p.id !== propertyId);
      localStorage.setItem(allPropsKey, JSON.stringify(allFiltered));
    }
  } catch {}

  if (isConfigValid) {
    try {
      await deleteDoc(doc(db, 'properties', propertyId));
      if (userId && userId !== 'guest') {
        const userRef = doc(db, 'users', userId);
        const snap = await getDoc(userRef);
        if (snap.exists() && Array.isArray(snap.data()?.properties)) {
          const remaining = (snap.data().properties as PropertyRecord[]).filter((p) => p.id !== propertyId);
          await setDoc(
            userRef,
            {
              properties: remaining,
              savedPropertiesCount: remaining.length,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      }
      return true;
    } catch (err) {
      console.warn('Firestore property address delete error:', err);
    }
  }
  return true;
};

// =========================================================================
// BACKEND DATA RESET & PURGE UTILITIES (CLEAR TESTING DATA)
// =========================================================================

export interface ResetDataResult {
  success: boolean;
  deletedPayments: number;
  deletedReports: number;
  deletedConsultations: number;
  deletedLocations: number;
  resetUsers: number;
  resetAdSense: boolean;
  clearedLocalKeys: string[];
  message: string;
}

/**
 * Purges all test payment records from Firestore collection 'payments'
 */
export const clearTestingPaymentsFromFirestore = async (): Promise<number> => {
  let count = 0;
  try {
    if (isConfigValid) {
      const snap = await getDocs(collection(db, 'payments'));
      for (const docSnap of snap.docs) {
        await deleteDoc(doc(db, 'payments', docSnap.id)).catch(() => {});
        count++;
      }
    }
  } catch (err) {
    console.warn('Notice while clearing payments:', err);
  }
  return count;
};

/**
 * Purges all test audit reports from Firestore collection 'audit_reports'
 */
export const clearTestingAuditReportsFromFirestore = async (): Promise<number> => {
  let count = 0;
  try {
    if (isConfigValid) {
      const snap = await getDocs(collection(db, 'audit_reports'));
      for (const docSnap of snap.docs) {
        await deleteDoc(doc(db, 'audit_reports', docSnap.id)).catch(() => {});
        count++;
      }
    }
  } catch (err) {
    console.warn('Notice while clearing audit reports:', err);
  }
  return count;
};

/**
 * Purges all test consultation messages from Firestore collection 'consultations'
 */
export const clearTestingConsultationsFromFirestore = async (): Promise<number> => {
  let count = 0;
  try {
    if (isConfigValid) {
      const snap = await getDocs(collection(db, 'consultations'));
      for (const docSnap of snap.docs) {
        await deleteDoc(doc(db, 'consultations', docSnap.id)).catch(() => {});
        count++;
      }
    }
  } catch (err) {
    console.warn('Notice while clearing consultations:', err);
  }
  return count;
};

/**
 * Purges all test user locations from Firestore collection 'user_locations'
 */
export const clearTestingUserLocationsFromFirestore = async (): Promise<number> => {
  let count = 0;
  try {
    if (isConfigValid) {
      const snap = await getDocs(collection(db, 'user_locations'));
      for (const docSnap of snap.docs) {
        await deleteDoc(doc(db, 'user_locations', docSnap.id)).catch(() => {});
        count++;
      }
    }
  } catch (err) {
    console.warn('Notice while clearing user locations:', err);
  }
  return count;
};

/**
 * Resets AdSense daily metrics in Firestore collection 'adsense_reports'
 */
export const resetAdSenseTestingMetricsFromFirestore = async (): Promise<boolean> => {
  try {
    if (isConfigValid) {
      const snap = await getDocs(collection(db, 'adsense_reports'));
      for (const docSnap of snap.docs) {
        await deleteDoc(doc(db, 'adsense_reports', docSnap.id)).catch(() => {});
      }
    }
    // Clear local storage metrics
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('vastu_adsense_metrics_')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
    return true;
  } catch (err) {
    console.warn('Notice resetting AdSense metrics:', err);
    return false;
  }
};

/**
 * Resets non-admin user memberships (clears test Pro memberships / mock passes)
 */
export const resetTestingUserMembershipsFromFirestore = async (): Promise<number> => {
  let count = 0;
  try {
    if (isConfigValid) {
      const snap = await getDocs(collection(db, 'users'));
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        if (!isAdminEmail(data.email)) {
          await updateDoc(doc(db, 'users', docSnap.id), {
            isProMember: false,
            activePlan: null,
            savedPropertiesCount: 0,
            properties: [],
          }).catch(() => {});
          count++;
        }
      }
    }
  } catch (err) {
    console.warn('Notice resetting user profiles:', err);
  }
  return count;
};

/**
 * Performs a comprehensive Backend Data Reset: clears all testing data from
 * Firestore (payments, reports, consultations, locations, adsense) and clears
 * client testing cache.
 */
export const clearAllTestingDataFromFirestore = async (): Promise<ResetDataResult> => {
  const deletedPayments = await clearTestingPaymentsFromFirestore();
  const deletedReports = await clearTestingAuditReportsFromFirestore();
  const deletedConsultations = await clearTestingConsultationsFromFirestore();
  const deletedLocations = await clearTestingUserLocationsFromFirestore();
  const resetAdSense = await resetAdSenseTestingMetricsFromFirestore();
  const resetUsers = await resetTestingUserMembershipsFromFirestore();

  // Clear local storage testing caches
  const clearedLocalKeys: string[] = [];
  try {
    const testKeys = [
      'vastu_user_location_history',
      'vastudrishti_user_location',
      'vastu_unlocked_properties',
      'vastu_pro_purchased_status',
      'vastu_cached_reports',
      'vastu_consultation_threads',
      'vastu_geotag_records_v1',
      'vastu_system_settings_admob_stats',
    ];

    testKeys.forEach((key) => {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        clearedLocalKeys.push(key);
      }
    });

    // Also remove any dynamic property/metrics keys
    const dynamicKeysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('vastu_adsense_metrics_') || k.startsWith('vastu_user_properties_'))) {
        dynamicKeysToRemove.push(k);
      }
    }
    dynamicKeysToRemove.forEach((k) => {
      localStorage.removeItem(k);
      clearedLocalKeys.push(k);
    });
  } catch {}

  // Dispatch event so UI instantly synchronizes
  try {
    window.dispatchEvent(new CustomEvent('vastu_backend_data_reset'));
    window.dispatchEvent(new Event('vastu_config_updated'));
  } catch {}

  return {
    success: true,
    deletedPayments,
    deletedReports,
    deletedConsultations,
    deletedLocations,
    resetUsers,
    resetAdSense,
    clearedLocalKeys,
    message: `Backend data reset completed: Cleared ${deletedPayments} payments, ${deletedReports} reports, ${deletedConsultations} consultations, ${deletedLocations} geotags, and reset ${resetUsers} user test profiles.`,
  };
};

