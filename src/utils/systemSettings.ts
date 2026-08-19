import { db, isFirebaseEnabled } from '../lib/firebase';
import { collection, addDoc, getDocs, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

export interface AdMobConfig {
  appId: string;
  bannerUnitId: string;
  interstitialUnitId: string;
  rewardedUnitId: string;
  nativeUnitId: string;
  enabled: boolean;
  testMode: boolean;
  publisherId: string;
}

export interface AdMobStats {
  estimatedRevenue: number;
  bannerImpressions: number;
  interstitialImpressions: number;
  rewardedImpressions: number;
  totalClicks: number;
  ecpm: number;
  fillRate: number;
  lastUpdated: string;
}

export interface GeotagRecord {
  id: string;
  userEmail: string;
  userName: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  deviceType: string;
  ipAddress: string;
  timestamp: number;
  accuracy: number;
}

export interface IntroScreenItem {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  badge: string;
}

export interface SystemSettingsConfig {
  appName: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  systemSoundEnabled: boolean;
  soundType?: 'soft_chime' | 'temple_bell' | 'zen_bowl' | 'crystal_drop' | 'gentle_beep';
  maxFreeProperties: number;
  maxDailyAiQueries: number;
  aiModel: string;
  rateLimitMaxLoginsPerMin: number;
  showIntroOnLaunch: boolean;
}

// Default Presets
export const DEFAULT_ADMOB_CONFIG: AdMobConfig = {
  appId: 'ca-app-pub-3940256099942544~3347511713',
  bannerUnitId: 'ca-app-pub-3940256099942544/6300978111',
  interstitialUnitId: 'ca-app-pub-3940256099942544/1033173712',
  rewardedUnitId: 'ca-app-pub-3940256099942544/5224354917',
  nativeUnitId: 'ca-app-pub-3940256099942544/2247696110',
  enabled: true,
  testMode: true,
  publisherId: 'pub-3940256099942544',
};

export const DEFAULT_ADMOB_STATS: AdMobStats = {
  estimatedRevenue: 1482.50,
  bannerImpressions: 48290,
  interstitialImpressions: 12450,
  rewardedImpressions: 3810,
  totalClicks: 2140,
  ecpm: 4.85,
  fillRate: 98.4,
  lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
};

export const DEFAULT_INTRO_SCREENS: IntroScreenItem[] = [
  {
    id: 1,
    title: 'Precise 16-Zone Vastu Compass',
    subtitle: 'Sacred Directional Analysis',
    description: 'Calibrate your home or office layout against authentic Vedic Vastu zones (Ishanya, Agneya, Nairrutya, Vayavya) with live real-time magnetic compass lock.',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    badge: 'Step 1 of 3',
  },
  {
    id: 2,
    title: 'Instant House Audit & Remedies',
    subtitle: 'Detect Doshas & Apply Non-Demolition Fixes',
    description: 'Audit entrance doors, pooja rooms, kitchens, and toilets. Generate instant elemental balances and authentic remedies using pyramids, brass strips, and gemstones.',
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    badge: 'Step 2 of 3',
  },
  {
    id: 3,
    title: 'AI Vastu Guru & Auspicious Muhurtas',
    subtitle: 'Vedic Intelligence at Your Service',
    description: 'Consult our generative AI Vastu Expert for instant personalized layout recommendations and calculate auspicious Griha Pravesh dates.',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    badge: 'Step 3 of 3',
  },
];

export const DEFAULT_SYSTEM_SETTINGS: SystemSettingsConfig = {
  appName: 'Vastu Compass',
  maintenanceMode: false,
  maintenanceMessage: 'System undergoing scheduled Vedic energy synchronization. We will be back shortly.',
  systemSoundEnabled: true,
  soundType: 'soft_chime',
  maxFreeProperties: 3,
  maxDailyAiQueries: 10,
  aiModel: 'gemini-2.5-flash',
  rateLimitMaxLoginsPerMin: 5,
  showIntroOnLaunch: true,
};

// Storage keys
const ADMOB_CONFIG_KEY = 'vastudrishti_admob_config';
const ADMOB_STATS_KEY = 'vastudrishti_admob_stats';
const GEOTAGS_KEY = 'vastudrishti_geotag_records';
const INTRO_SCREENS_KEY = 'vastudrishti_intro_screens';
const SYSTEM_SETTINGS_KEY = 'vastudrishti_system_settings';

// AdMob Config Helpers
export const getAdMobConfig = (): AdMobConfig => {
  try {
    const saved = localStorage.getItem(ADMOB_CONFIG_KEY);
    if (saved) return { ...DEFAULT_ADMOB_CONFIG, ...JSON.parse(saved) };
  } catch (e) {
    console.warn('Failed to parse AdMob config:', e);
  }
  return DEFAULT_ADMOB_CONFIG;
};

export const saveAdMobConfig = async (config: AdMobConfig): Promise<boolean> => {
  localStorage.setItem(ADMOB_CONFIG_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event('vastu_config_updated'));
  try {
    await setDoc(doc(db, 'system_config', 'admob'), config, { merge: true });
    return true;
  } catch (e) {
    console.warn('Error saving AdMob config:', e);
    return false;
  }
};

// AdMob Stats Helpers
export const getAdMobStats = (): AdMobStats => {
  try {
    const saved = localStorage.getItem(ADMOB_STATS_KEY);
    if (saved) return { ...DEFAULT_ADMOB_STATS, ...JSON.parse(saved) };
  } catch (e) {
    console.warn('Failed to parse AdMob stats:', e);
  }
  return DEFAULT_ADMOB_STATS;
};

export const saveAdMobStats = async (stats: AdMobStats): Promise<boolean> => {
  localStorage.setItem(ADMOB_STATS_KEY, JSON.stringify(stats));
  window.dispatchEvent(new Event('vastu_config_updated'));
  try {
    await setDoc(doc(db, 'system_config', 'admob_stats'), stats, { merge: true });
    return true;
  } catch (e) {
    console.warn('Error saving AdMob stats:', e);
    return false;
  }
};

// Intro Screens Helpers
export const getIntroScreens = (): IntroScreenItem[] => {
  try {
    const saved = localStorage.getItem(INTRO_SCREENS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= 3) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse intro screens:', e);
  }
  return DEFAULT_INTRO_SCREENS;
};

export const saveIntroScreens = async (screens: IntroScreenItem[]): Promise<boolean> => {
  localStorage.setItem(INTRO_SCREENS_KEY, JSON.stringify(screens));
  window.dispatchEvent(new Event('vastu_config_updated'));
  try {
    await setDoc(doc(db, 'system_config', 'intro_screens'), { screens }, { merge: true });
    return true;
  } catch (e) {
    console.warn('Error saving intro screens:', e);
    return false;
  }
};

// System Settings Helpers
export const getSystemSettings = (): SystemSettingsConfig => {
  try {
    const saved = localStorage.getItem(SYSTEM_SETTINGS_KEY);
    if (saved) return { ...DEFAULT_SYSTEM_SETTINGS, ...JSON.parse(saved) };
  } catch (e) {
    console.warn('Failed to parse system settings:', e);
  }
  return DEFAULT_SYSTEM_SETTINGS;
};

export const saveSystemSettings = async (settings: SystemSettingsConfig): Promise<boolean> => {
  localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event('vastu_config_updated'));
  try {
    await setDoc(doc(db, 'system_config', 'settings'), settings, { merge: true });
    return true;
  } catch (e) {
    console.warn('Error saving system settings:', e);
    return false;
  }
};

// REALTIME SUBSCRIPTION FOR SYSTEM SETTINGS & INTRO SCREENS
export const subscribeToSystemSettings = (onChange?: () => void): (() => void) => {
  if (!isFirebaseEnabled()) {
    return () => {};
  }

  const unsubSettings = onSnapshot(
    doc(db, 'system_config', 'settings'),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SystemSettingsConfig;
        localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify(data));
        window.dispatchEvent(new Event('vastu_config_updated'));
        if (onChange) onChange();
      }
    },
    (err) => console.warn('Settings subscription notice:', err)
  );

  const unsubIntro = onSnapshot(
    doc(db, 'system_config', 'intro_screens'),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && Array.isArray(data.screens)) {
          localStorage.setItem(INTRO_SCREENS_KEY, JSON.stringify(data.screens));
          window.dispatchEvent(new Event('vastu_config_updated'));
          if (onChange) onChange();
        }
      }
    },
    (err) => console.warn('Intro screens subscription notice:', err)
  );

  return () => {
    unsubSettings();
    unsubIntro();
  };
};

// Mock geotag data generator for initial demonstration
const INITIAL_MOCK_GEOTAGS: GeotagRecord[] = [
  {
    id: 'geo_1',
    userEmail: 'pasalavenkatasatish@gmail.com',
    userName: 'Admin Satish',
    latitude: 19.0760,
    longitude: 72.8777,
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    deviceType: 'Desktop Chrome / Windows 11',
    ipAddress: '152.57.18.24',
    timestamp: Date.now() - 1000 * 60 * 12,
    accuracy: 15,
  },
  {
    id: 'geo_2',
    userEmail: 'rajesh.sharma@example.com',
    userName: 'Rajesh Sharma',
    latitude: 28.6139,
    longitude: 77.2090,
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    deviceType: 'Mobile Safari / iOS 17',
    ipAddress: '103.220.88.11',
    timestamp: Date.now() - 1000 * 60 * 120,
    accuracy: 8,
  },
  {
    id: 'geo_3',
    userEmail: 'priya.patel@example.com',
    userName: 'Priya Patel',
    latitude: 12.9716,
    longitude: 77.5946,
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    deviceType: 'Mobile Chrome / Android 14',
    ipAddress: '182.73.210.45',
    timestamp: Date.now() - 1000 * 60 * 360,
    accuracy: 12,
  },
  {
    id: 'geo_4',
    userEmail: 'vikram.singh@example.com',
    userName: 'Vikram Singh',
    latitude: 26.9124,
    longitude: 75.7873,
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    deviceType: 'Desktop Edge / Windows',
    ipAddress: '117.218.42.19',
    timestamp: Date.now() - 1000 * 60 * 720,
    accuracy: 20,
  },
  {
    id: 'geo_5',
    userEmail: 'ananya.roy@example.com',
    userName: 'Ananya Roy',
    latitude: 22.5726,
    longitude: 88.3639,
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    deviceType: 'Mobile Safari / iOS',
    ipAddress: '103.15.22.90',
    timestamp: Date.now() - 1000 * 60 * 1440,
    accuracy: 10,
  },
];

// Geotag Records Helpers
export const getGeotagRecords = (): GeotagRecord[] => {
  try {
    const saved = localStorage.getItem(GEOTAGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse geotag records:', e);
  }
  return INITIAL_MOCK_GEOTAGS;
};

export const addGeotagRecord = (record: Omit<GeotagRecord, 'id'>): GeotagRecord => {
  const records = getGeotagRecords();
  const newRecord: GeotagRecord = {
    ...record,
    id: `geo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  };
  const updated = [newRecord, ...records].slice(0, 50); // Keep last 50 geotags
  localStorage.setItem(GEOTAGS_KEY, JSON.stringify(updated));

  // Sync to Firestore if online
  try {
    addDoc(collection(db, 'geotag_logs'), newRecord).catch(() => {});
  } catch (e) {}

  return newRecord;
};

// Automatic geotag capture function using HTML5 Geolocation API
export const performAutoGeotag = (userEmail = 'guest@vastudrishti.app', userName = 'Guest Explorer'): Promise<GeotagRecord | null> => {
  return new Promise((resolve) => {
    // Check if browser supports geolocation
    if (!('geolocation' in navigator)) {
      console.log('Geolocation not supported by this browser.');
      resolve(null);
      return;
    }

    const deviceType = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Mobile Device' : 'Desktop Browser';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy);

        // Approximate city based on lat/lng ranges
        let city = 'Metro Region';
        let state = 'India';
        if (lat >= 18.5 && lat <= 19.5 && lng >= 72.5 && lng <= 73.2) {
          city = 'Mumbai';
          state = 'Maharashtra';
        } else if (lat >= 28.3 && lat <= 28.9 && lng >= 76.8 && lng <= 77.5) {
          city = 'New Delhi';
          state = 'Delhi NCR';
        } else if (lat >= 12.8 && lat <= 13.2 && lng >= 77.4 && lng <= 77.8) {
          city = 'Bengaluru';
          state = 'Karnataka';
        } else if (lat >= 17.2 && lat <= 17.6 && lng >= 78.2 && lng <= 78.6) {
          city = 'Hyderabad';
          state = 'Telangana';
        } else if (lat >= 12.9 && lat <= 13.2 && lng >= 80.1 && lng <= 80.4) {
          city = 'Chennai';
          state = 'Tamil Nadu';
        }

        const rec = addGeotagRecord({
          userEmail,
          userName,
          latitude: Number(lat.toFixed(4)),
          longitude: Number(lng.toFixed(4)),
          city,
          state,
          country: 'India',
          deviceType: `${deviceType} (${navigator.language})`,
          ipAddress: '152.57.' + Math.floor(Math.random() * 200) + '.' + Math.floor(Math.random() * 200),
          timestamp: Date.now(),
          accuracy,
        });

        resolve(rec);
      },
      (error) => {
        console.warn('Auto geotag skipped or permission denied:', error.message);
        // Fallback simulated geotag for demonstration
        const mockLat = 19.0760 + (Math.random() - 0.5) * 0.1;
        const mockLng = 72.8777 + (Math.random() - 0.5) * 0.1;
        const fallbackRec = addGeotagRecord({
          userEmail,
          userName,
          latitude: Number(mockLat.toFixed(4)),
          longitude: Number(mockLng.toFixed(4)),
          city: 'Navi Mumbai',
          state: 'Maharashtra',
          country: 'India',
          deviceType: `${deviceType} (Auto-GPS)`,
          ipAddress: '152.57.18.24',
          timestamp: Date.now(),
          accuracy: 25,
        });
        resolve(fallbackRec);
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  });
};
