import { PushNotificationAlert } from '../types';
import { db, isConfigValid } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { FESTIVAL_POOJA_DATA } from '../data/festivalPoojaData';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface DeviceProfile {
  type: DeviceType;
  os: string;
  browser: string;
  isStandalonePwa: boolean;
  hasNotificationSupport: boolean;
  hasVibrationSupport: boolean;
  permission: NotificationPermission;
  screenDimensions: string;
}

export interface DeviceCapSettings {
  mobileDailyCap: number; // default: 3/day on mobile
  tabletDailyCap: number; // default: 4/day on tablet
  desktopDailyCap: number; // default: 6/day on desktop
  customUserCap?: number; // optional user override
  enableQuietHours: boolean; // default: true
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "07:00"
  allowHighPriorityBypass: boolean; // default: true
  enableHaptics: boolean; // default: true
  enableChimeSound: boolean; // default: true
}

export interface DeviceDeliveryStats {
  date: string; // YYYY-MM-DD
  countToday: number;
  capForThisDevice: number;
  remainingToday: number;
  isCapReached: boolean;
  history: {
    id: string;
    title: string;
    time: string;
    priority: string;
    bypassedCap: boolean;
  }[];
}

export interface PushGatewayConfig {
  fcmServerKey: string;
  vapidPublicKey: string;
  vapidPrivateKey: string;
  apnsKeyId: string;
  apnsTeamId: string;
  enableAutoFestivalPush: boolean;
  enableAutoMuhurtaPush: boolean;
  enableAutoRahuKalamPush: boolean;
  enableAutoDailyTipsPush: boolean;
  connectedDeviceTokensCount: number;
  totalPushSentCount: number;
  avgCtrPercentage: number;
  deviceCaps: DeviceCapSettings;
}

export const DEFAULT_DEVICE_CAP_SETTINGS: DeviceCapSettings = {
  mobileDailyCap: 3, // 3 alerts/day on smartphones to prevent fatigue
  tabletDailyCap: 4, // 4 alerts/day on tablets
  desktopDailyCap: 6, // 6 alerts/day on desktops
  customUserCap: undefined,
  enableQuietHours: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  allowHighPriorityBypass: true,
  enableHaptics: true,
  enableChimeSound: true,
};

export const DEFAULT_PUSH_GATEWAY_CONFIG: PushGatewayConfig = {
  fcmServerKey: 'AAAA-VASTU-COMPASS-FCM-SERVER-KEY-8839201948271',
  vapidPublicKey: 'BEl39_VastuCompass_VAPID_PublicKey_a938217f012938a9e',
  vapidPrivateKey: 'PRI_VASTU_COMPASS_VAPID_SECRET_98231049281',
  apnsKeyId: 'APNS_KEY_VASTU_8829',
  apnsTeamId: 'TEAM_VASTU_99182',
  enableAutoFestivalPush: true,
  enableAutoMuhurtaPush: true,
  enableAutoRahuKalamPush: true,
  enableAutoDailyTipsPush: true,
  connectedDeviceTokensCount: 3410,
  totalPushSentCount: 14820,
  avgCtrPercentage: 18.5,
  deviceCaps: DEFAULT_DEVICE_CAP_SETTINGS,
};

export const generateAllFestivalPushCampaigns = (year: 2026 | 2027 = 2026): PushNotificationAlert[] => {
  return [
    {
      id: 'nagula_panchami_alert',
      title: '🐍 Nagula Panchami & Naga Devata Pujan Alert',
      body: 'Nagula Panchami is arriving! Perform Ksheerabhishekam & Chimili Naivedyam during Simha Lagna to pacify Rahu-Ketu Vastu Dosh.',
      category: 'festival',
      targetTab: 'pooja',
      targetFestivalId: 'nagula_panchami',
      countdownText: 'Upcoming',
      dateLabel: year === 2026 ? '18 Aug 2026' : '07 Aug 2027',
      iconName: 'Shield',
      isRead: false,
      priority: 'high',
      createdAt: '2026-08-14T06:00:00.000Z',
    },
    {
      id: 'vastu_jayanti_alert',
      title: '🧭 Vastu Purusha Jayanti & Shanti Pujan Alert',
      body: 'Sacred Vastu Purusha Jayanti! Consecrate Brahmasthan & North-East Mandir to harmonize all 16 directional zones.',
      category: 'festival',
      targetTab: 'pooja',
      targetFestivalId: 'vastu_jayanti',
      countdownText: 'Upcoming',
      dateLabel: year === 2026 ? '20 Aug 2026' : '10 Aug 2027',
      iconName: 'Compass',
      isRead: false,
      priority: 'high',
      createdAt: '2026-08-14T06:10:00.000Z',
    },
    {
      id: 'varalakshmi_alert',
      title: '🪔 Varalakshmi Vratam & Mangal Kalasham Alert',
      body: 'Auspicious Friday Simha Lagna for Goddess Varalakshmi Kalash Sthapana & 9-knot yellow thread blessings.',
      category: 'festival',
      targetTab: 'pooja',
      targetFestivalId: 'varalakshmi',
      countdownText: 'Upcoming',
      dateLabel: year === 2026 ? '21 Aug 2026' : '13 Aug 2027',
      iconName: 'Sparkles',
      isRead: false,
      priority: 'high',
      createdAt: '2026-08-14T06:20:00.000Z',
    },
    {
      id: 'raksha_bandhan_alert',
      title: '❤️ Raksha Bandhan & Shravani Upakarma Alert',
      body: 'Consecrate Rakhi at altar facing East before Rahu Kalam. Protects family lineage & brings lasting harmony.',
      category: 'festival',
      targetTab: 'pooja',
      targetFestivalId: 'raksha_bandhan',
      countdownText: 'Upcoming',
      dateLabel: year === 2026 ? '28 Aug 2026' : '17 Aug 2027',
      iconName: 'Heart',
      isRead: false,
      priority: 'normal',
      createdAt: '2026-08-14T06:30:00.000Z',
    },
    {
      id: 'krishna_janmashtami_alert',
      title: '🦚 Sri Krishna Janmashtami & Gokulashtami Alert',
      body: 'Midnight Nishita Kaal Janmotsav! Set up Laddu Gopal Jhula & offer fresh Makhan-Mishri in North-East altar.',
      category: 'festival',
      targetTab: 'pooja',
      targetFestivalId: 'krishna_janmashtami',
      countdownText: 'Upcoming',
      dateLabel: year === 2026 ? '03 Sep 2026' : '24 Aug 2027',
      iconName: 'Gift',
      isRead: false,
      priority: 'high',
      createdAt: '2026-08-14T06:40:00.000Z',
    },
    {
      id: 'ganesh_chaturthi_alert',
      title: '👑 Ganesh Chaturthi Sthapana & Siddhi Pujan Alert',
      body: 'Welcome Vighnaharta! Madhyahna Sthapana in North-East corner with 21 Durva grass to remove all obstacles.',
      category: 'festival',
      targetTab: 'pooja',
      targetFestivalId: 'ganesh_chaturthi',
      countdownText: 'Upcoming',
      dateLabel: year === 2026 ? '14 Sep 2026' : '04 Sep 2027',
      iconName: 'Crown',
      isRead: false,
      priority: 'high',
      createdAt: '2026-08-14T06:50:00.000Z',
    },
    {
      id: 'navratri_alert',
      title: '🌸 Sharad Navratri & Ghatasthapana Alert',
      body: 'Consecrate Maa Durga in Ishanya Mandir! Sow Jau (Barley) & light 9-day Akhand Jyoti for divine shield.',
      category: 'festival',
      targetTab: 'pooja',
      targetFestivalId: 'navratri',
      countdownText: 'Upcoming',
      dateLabel: year === 2026 ? '10 Oct 2026' : '29 Sep 2027',
      iconName: 'Sun',
      isRead: false,
      priority: 'high',
      createdAt: '2026-08-14T07:00:00.000Z',
    },
    {
      id: 'dussehra_vijayadashami_alert',
      title: '🏹 Dussehra, Vijayadashami & Shami Pujan Alert',
      body: 'Vijaya Muhurta for Shami tree worship, vehicle & instrument blessings, and initiating prosperous ventures.',
      category: 'festival',
      targetTab: 'pooja',
      targetFestivalId: 'dussehra',
      countdownText: 'Upcoming',
      dateLabel: year === 2026 ? '20 Oct 2026' : '10 Oct 2027',
      iconName: 'Crown',
      isRead: false,
      priority: 'high',
      createdAt: '2026-08-14T07:10:00.000Z',
    },
    {
      id: 'karwa_chauth_alert',
      title: '🌙 Karwa Chauth & Chandra Arghya Alert',
      body: 'Evening Gaura Pujan & Moonrise Chandra Arghya via sieve in North-West sector for marital longevity & health.',
      category: 'festival',
      targetTab: 'pooja',
      targetFestivalId: 'karwa_chauth',
      countdownText: 'Upcoming',
      dateLabel: year === 2026 ? '28 Oct 2026' : '17 Oct 2027',
      iconName: 'Moon',
      isRead: false,
      priority: 'high',
      createdAt: '2026-08-14T07:20:00.000Z',
    },
    {
      id: 'dhanteras_alert',
      title: '💰 Dhanteras, Yamadeep Daan & Kuber Pujan Alert',
      body: 'Auspicious metal purchases in North Kuber zone & South-facing Yamadeep Daan for health & perennial wealth.',
      category: 'festival',
      targetTab: 'pooja',
      targetFestivalId: 'dhanteras',
      countdownText: 'Upcoming',
      dateLabel: year === 2026 ? '06 Nov 2026' : '27 Oct 2027',
      iconName: 'Sparkles',
      isRead: false,
      priority: 'high',
      createdAt: '2026-08-14T07:30:00.000Z',
    },
    {
      id: 'diwali_alert',
      title: '🪔 Diwali & Mahalakshmi Pujan Alert',
      body: 'Diwali Pradosh Kaal & Vrishabha Lagna! Perform Ashta-Dal Kamal Kalash Sthapana & 21-diya Deep Daan across 16 zones.',
      category: 'festival',
      targetTab: 'pooja',
      targetFestivalId: 'diwali',
      countdownText: 'Upcoming',
      dateLabel: year === 2026 ? '06 Nov 2026' : '28 Oct 2027',
      iconName: 'Flame',
      isRead: false,
      priority: 'high',
      createdAt: '2026-08-14T07:40:00.000Z',
    },
    {
      id: 'sankranti_alert',
      title: '☀️ Makar Sankranti & Uttarayana Vastu Pujan Alert',
      body: 'Surya Arghya at dawn! Welcome Uttarayana cosmic energy flow with East threshold rangoli & Til-Gud offerings.',
      category: 'festival',
      targetTab: 'pooja',
      targetFestivalId: 'sankranti',
      countdownText: 'Annual Peak',
      dateLabel: year === 2026 ? '14 Jan 2026' : '14 Jan 2027',
      iconName: 'Sun',
      isRead: false,
      priority: 'high',
      createdAt: '2026-08-14T07:50:00.000Z',
    },
    {
      id: 'maha_shivaratri_alert',
      title: '🔱 Maha Shivaratri & Sacred Rudrabhishekam Alert',
      body: 'Nishita Kaal midnight Rudrabhishekam with 108 Bel Patra to dissolve Ishanya Vastu Dosh & negative karma.',
      category: 'festival',
      targetTab: 'pooja',
      targetFestivalId: 'maha_shivaratri',
      countdownText: 'Annual Peak',
      dateLabel: year === 2026 ? '15 Feb 2026' : '06 Mar 2027',
      iconName: 'Flame',
      isRead: false,
      priority: 'high',
      createdAt: '2026-08-14T08:00:00.000Z',
    },
    {
      id: 'vasanta_navratri_alert',
      title: '🌿 Vasanta Chaitra Navratri & Ugadi / Gudi Padwa Alert',
      body: 'Spring Vedic New Year! Tie Mango-Neem toran, prepare 6-taste Ugadi Pachadi & Pratipada Ghatasthapana in Ishanya.',
      category: 'festival',
      targetTab: 'pooja',
      targetFestivalId: 'vasanta_navratri',
      countdownText: 'Annual Peak',
      dateLabel: year === 2026 ? '19 Mar 2026' : '07 Apr 2027',
      iconName: 'Sparkles',
      isRead: false,
      priority: 'high',
      createdAt: '2026-08-14T08:10:00.000Z',
    },
    {
      id: 'ram_navami_alert',
      title: '🏹 Sri Rama Navami & Sita Rama Kalyanotsavam Alert',
      body: 'Madhyahna 12 PM birth celebration! Recite Sundarakanda, offer sweet Panakam & Vadapappu for solar vitality.',
      category: 'festival',
      targetTab: 'pooja',
      targetFestivalId: 'ram_navami',
      countdownText: 'Annual Peak',
      dateLabel: year === 2026 ? '27 Mar 2026' : '15 Apr 2027',
      iconName: 'Sun',
      isRead: false,
      priority: 'high',
      createdAt: '2026-08-14T08:20:00.000Z',
    },
    {
      id: 'griha_pravesh_weekend',
      title: '🏡 Griha Pravesh Shubh Muhurta Window',
      body: 'Vrishabha Lagna & Amrita Yoga window opening for auspicious housewarming, Kalash entry & Vastu Shanti.',
      category: 'muhurta',
      targetTab: 'muhurta',
      countdownText: 'This Weekend',
      dateLabel: '22 Aug 2026',
      iconName: 'Calendar',
      isRead: false,
      priority: 'high',
      createdAt: '2026-08-14T08:30:00.000Z',
    },
    {
      id: 'daily_brahma_sthan',
      title: '✨ Daily Vastu Tip: Brahma Sthan Clear',
      body: 'Ensure the central space (Brahmasthan) is kept clutter-free today to amplify cosmic energy balance.',
      category: 'daily_tip',
      targetTab: 'compass',
      countdownText: 'Daily Tip',
      dateLabel: 'Today',
      iconName: 'Zap',
      isRead: true,
      priority: 'normal',
      createdAt: '2026-08-14T08:40:00.000Z',
    },
  ];
};

export const INITIAL_ADMIN_PUSH_CAMPAIGNS: PushNotificationAlert[] = generateAllFestivalPushCampaigns(2026);

const LOCAL_STORAGE_ALERTS_KEY = 'vastu_push_alerts_list';
const LOCAL_STORAGE_GATEWAY_KEY = 'vastu_push_gateway_config';
const LOCAL_STORAGE_DEVICE_CAP_KEY = 'vastu_device_cap_settings';
const LOCAL_STORAGE_DEVICE_STATS_KEY = 'vastu_device_delivery_stats';

/**
 * Detect Current Device Profile (Mobile vs Tablet vs Desktop, OS, Capabilities)
 */
export const detectCurrentDevice = (): DeviceProfile => {
  if (typeof window === 'undefined') {
    return {
      type: 'desktop',
      os: 'Unknown',
      browser: 'Unknown',
      isStandalonePwa: false,
      hasNotificationSupport: false,
      hasVibrationSupport: false,
      permission: 'default',
      screenDimensions: '1920x1080',
    };
  }

  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTabletUA = /(iPad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua);
  const width = window.innerWidth;
  const height = window.innerHeight;

  let deviceType: DeviceType = 'desktop';
  if (isTabletUA || (width >= 640 && width <= 1024 && 'ontouchstart' in window)) {
    deviceType = 'tablet';
  } else if (isMobileUA || width < 640 || ('ontouchstart' in window && width <= 768)) {
    deviceType = 'mobile';
  }

  let os = 'Unknown OS';
  if (/iPad|iPhone|iPod/.test(ua)) os = 'iOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/Macintosh|Mac OS X/.test(ua)) os = 'macOS';
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Linux/.test(ua)) os = 'Linux';

  let browser = 'Browser';
  if (/Chrome/.test(ua) && !/Edge|OPR/.test(ua)) browser = 'Chrome';
  else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
  else if (/Firefox/.test(ua)) browser = 'Firefox';
  else if (/Edge/.test(ua)) browser = 'Edge';

  const isStandalonePwa = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
  const hasNotificationSupport = 'Notification' in window;
  const hasVibrationSupport = 'vibrate' in navigator;
  const permission = hasNotificationSupport ? Notification.permission : 'denied';

  return {
    type: deviceType,
    os,
    browser,
    isStandalonePwa,
    hasNotificationSupport,
    hasVibrationSupport,
    permission,
    screenDimensions: `${width}x${height}`,
  };
};

/**
 * Get Device Cap Settings
 */
export const getDeviceCapSettings = (): DeviceCapSettings => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_DEVICE_CAP_KEY);
    if (saved) return { ...DEFAULT_DEVICE_CAP_SETTINGS, ...JSON.parse(saved) };
  } catch (err) {
    console.warn('Error reading device cap settings:', err);
  }
  return DEFAULT_DEVICE_CAP_SETTINGS;
};

/**
 * Save Device Cap Settings
 */
export const saveDeviceCapSettings = async (settings: DeviceCapSettings): Promise<boolean> => {
  try {
    localStorage.setItem(LOCAL_STORAGE_DEVICE_CAP_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Error saving device cap settings:', err);
  }

  // Also sync to gateway config
  const gateway = getPushGatewayConfig();
  await savePushGatewayConfig({
    ...gateway,
    deviceCaps: settings,
  });

  return true;
};

/**
 * Get the effective daily cap for this specific device
 */
export const getCapForCurrentDevice = (): number => {
  const profile = detectCurrentDevice();
  const settings = getDeviceCapSettings();

  if (typeof settings.customUserCap === 'number' && settings.customUserCap >= 0) {
    return settings.customUserCap; // 0 = unlimited
  }

  switch (profile.type) {
    case 'mobile':
      return settings.mobileDailyCap;
    case 'tablet':
      return settings.tabletDailyCap;
    case 'desktop':
    default:
      return settings.desktopDailyCap;
  }
};

/**
 * Get today's delivery stats for the current device
 */
export const getDeviceDeliveryStats = (): DeviceDeliveryStats => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const cap = getCapForCurrentDevice();

  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_DEVICE_STATS_KEY);
    if (saved) {
      const parsed: DeviceDeliveryStats = JSON.parse(saved);
      // If same date, return parsed stats
      if (parsed.date === todayStr) {
        const remaining = cap === 0 ? 999 : Math.max(0, cap - parsed.countToday);
        return {
          ...parsed,
          capForThisDevice: cap,
          remainingToday: remaining,
          isCapReached: cap > 0 && parsed.countToday >= cap,
        };
      }
    }
  } catch (err) {
    console.warn('Error reading device delivery stats:', err);
  }

  // New day initial stats
  return {
    date: todayStr,
    countToday: 0,
    capForThisDevice: cap,
    remainingToday: cap === 0 ? 999 : cap,
    isCapReached: false,
    history: [],
  };
};

/**
 * Reset today's device delivery counter
 */
export const resetDeviceDeliveryStats = (): DeviceDeliveryStats => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const cap = getCapForCurrentDevice();
  const freshStats: DeviceDeliveryStats = {
    date: todayStr,
    countToday: 0,
    capForThisDevice: cap,
    remainingToday: cap === 0 ? 999 : cap,
    isCapReached: false,
    history: [],
  };
  try {
    localStorage.setItem(LOCAL_STORAGE_DEVICE_STATS_KEY, JSON.stringify(freshStats));
  } catch {}
  return freshStats;
};

/**
 * Check if the current time is within Quiet Hours (Do Not Disturb)
 */
export const isWithinQuietHours = (settings: DeviceCapSettings): boolean => {
  if (!settings.enableQuietHours) return false;
  try {
    const now = new Date();
    const [startH, startM] = settings.quietHoursStart.split(':').map(Number);
    const [endH, endM] = settings.quietHoursEnd.split(':').map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);

    if (startMinutes > endMinutes) {
      // Over midnight, e.g. 22:00 to 07:00
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
  } catch {
    return false;
  }
};

/**
 * Evaluate if a notification can be delivered natively to this device based on device caps and rules
 */
export const canDeliverToDevice = (
  priority: 'high' | 'normal' = 'normal'
): {
  allowed: boolean;
  reason: 'allowed' | 'high_priority_bypass' | 'daily_cap_reached' | 'quiet_hours' | 'permission_denied' | 'unsupported';
  countToday: number;
  cap: number;
  remainingToday: number;
} => {
  const profile = detectCurrentDevice();
  if (!profile.hasNotificationSupport) {
    return { allowed: false, reason: 'unsupported', countToday: 0, cap: 0, remainingToday: 0 };
  }

  if (profile.permission !== 'granted') {
    return { allowed: false, reason: 'permission_denied', countToday: 0, cap: 0, remainingToday: 0 };
  }

  const settings = getDeviceCapSettings();
  const stats = getDeviceDeliveryStats();

  // Check Quiet Hours
  if (isWithinQuietHours(settings)) {
    if (priority === 'high' && settings.allowHighPriorityBypass) {
      return { allowed: true, reason: 'high_priority_bypass', countToday: stats.countToday, cap: stats.capForThisDevice, remainingToday: stats.remainingToday };
    }
    return { allowed: false, reason: 'quiet_hours', countToday: stats.countToday, cap: stats.capForThisDevice, remainingToday: stats.remainingToday };
  }

  // Check Daily Cap (if cap > 0)
  if (stats.capForThisDevice > 0 && stats.countToday >= stats.capForThisDevice) {
    if (priority === 'high' && settings.allowHighPriorityBypass) {
      return { allowed: true, reason: 'high_priority_bypass', countToday: stats.countToday, cap: stats.capForThisDevice, remainingToday: 0 };
    }
    return { allowed: false, reason: 'daily_cap_reached', countToday: stats.countToday, cap: stats.capForThisDevice, remainingToday: 0 };
  }

  return {
    allowed: true,
    reason: 'allowed',
    countToday: stats.countToday,
    cap: stats.capForThisDevice,
    remainingToday: stats.remainingToday,
  };
};

/**
 * Dispatch Native Device Notification with Device Capping & Haptic Feedback
 */
export const dispatchNativeDeviceNotification = async (
  alert: PushNotificationAlert,
  options?: { force?: boolean }
): Promise<{ delivered: boolean; reason: string; stats: DeviceDeliveryStats }> => {
  const profile = detectCurrentDevice();
  const settings = getDeviceCapSettings();
  const evaluation = canDeliverToDevice(alert.priority);

  if (!evaluation.allowed && !options?.force) {
    return {
      delivered: false,
      reason: evaluation.reason,
      stats: getDeviceDeliveryStats(),
    };
  }

  // Fire Mobile Haptic Vibration if supported
  if (profile.hasVibrationSupport && settings.enableHaptics) {
    try {
      if (alert.priority === 'high') {
        navigator.vibrate([200, 100, 200, 100, 300]); // Rich double-pulse for high priority
      } else {
        navigator.vibrate([150, 80, 150]);
      }
    } catch {}
  }

  // Fire Native Android / Capacitor / Browser / PWA Notification
  if (profile.hasNotificationSupport && (typeof Notification !== 'undefined' && Notification.permission === 'granted')) {
    try {
      // 1. Check Capacitor Native Local Notifications if running inside Android Studio build
      const cap = (window as any).Capacitor;
      if (cap && cap.isNativePlatform && cap.isNativePlatform() && cap.Plugins?.LocalNotifications) {
        await cap.Plugins.LocalNotifications.schedule({
          notifications: [
            {
              title: alert.title,
              body: alert.body,
              id: Math.floor(Math.random() * 1000000),
              schedule: { at: new Date(Date.now() + 100) },
              sound: settings.enableChimeSound ? 'beep.wav' : undefined,
              attachments: undefined,
              actionTypeId: '',
              extra: {
                targetTab: alert.targetTab || 'muhurta',
                targetFestivalId: alert.targetFestivalId,
                alertId: alert.id,
              },
            },
          ],
        }).catch((e: any) => console.warn('Capacitor LocalNotification notice:', e));
      }

      // 2. Try ServiceWorkerRegistration (Required on Android Chrome/PWA/WebView for top status bar)
      let swDispatched = false;
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg && reg.showNotification) {
            const swOptions: Record<string, unknown> = {
              body: alert.body,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: alert.id || 'vastu_alert',
              data: {
                targetTab: alert.targetTab || 'muhurta',
                targetFestivalId: alert.targetFestivalId,
                alertId: alert.id,
              },
            };
            if (settings.enableHaptics) {
              swOptions.vibrate = alert.priority === 'high' ? [200, 100, 200] : [150, 80, 150];
            }
            await reg.showNotification(alert.title, swOptions as NotificationOptions);
            swDispatched = true;
          }
        } catch (swErr) {
          console.warn('ServiceWorker showNotification notice:', swErr);
        }
      }

      // 3. Fallback to standard Window Notification if SW not active
      if (!swDispatched && typeof Notification === 'function') {
        const notification = new Notification(alert.title, {
          body: alert.body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: alert.id || 'vastu_alert',
          data: {
            targetTab: alert.targetTab || 'muhurta',
            targetFestivalId: alert.targetFestivalId,
            alertId: alert.id,
          },
        });

        notification.onclick = () => {
          window.focus();
          notification.close();

          // Dispatch deep navigation event to FlutterAppContainer
          const navEvent = new CustomEvent('vastu_navigate_to_tab', {
            detail: {
              tab: alert.targetTab || 'muhurta',
              festivalId: alert.targetFestivalId,
              alertId: alert.id,
            },
          });
          window.dispatchEvent(navEvent);
        };
      }
    } catch (err) {
      console.warn('Native notification dispatch error:', err);
    }
  }

  // Record Delivery & Increment Today's Count
  const currentStats = getDeviceDeliveryStats();
  const bypassed = evaluation.reason === 'high_priority_bypass';
  const updatedStats: DeviceDeliveryStats = {
    ...currentStats,
    countToday: currentStats.countToday + 1,
    remainingToday: currentStats.capForThisDevice === 0 ? 999 : Math.max(0, currentStats.capForThisDevice - (currentStats.countToday + 1)),
    isCapReached: currentStats.capForThisDevice > 0 && currentStats.countToday + 1 >= currentStats.capForThisDevice,
    history: [
      {
        id: alert.id,
        title: alert.title,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        priority: alert.priority || 'normal',
        bypassedCap: bypassed,
      },
      ...currentStats.history.slice(0, 9),
    ],
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_DEVICE_STATS_KEY, JSON.stringify(updatedStats));
  } catch {}

  return {
    delivered: true,
    reason: bypassed ? 'delivered_with_high_priority_bypass' : 'delivered_within_cap',
    stats: updatedStats,
  };
};

/**
 * Get all push campaigns / alerts from local storage or defaults.
 * Seamlessly merges missing festival campaigns so ALL 15 festivals are always active!
 */
export const getPushAlertsFromStorage = (): PushNotificationAlert[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_ALERTS_KEY);
    if (saved) {
      const parsed: PushNotificationAlert[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure all 15 festivals exist in the list
        const defaultAlerts = INITIAL_ADMIN_PUSH_CAMPAIGNS;
        const existingIds = new Set(parsed.map((a) => a.id));
        const missing = defaultAlerts.filter((def) => !existingIds.has(def.id));
        if (missing.length > 0) {
          const merged = [...parsed, ...missing];
          try {
            localStorage.setItem(LOCAL_STORAGE_ALERTS_KEY, JSON.stringify(merged));
          } catch {}
          return merged;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading push alerts from local storage:', err);
  }
  return INITIAL_ADMIN_PUSH_CAMPAIGNS;
};

/**
 * Force sync/re-activate all 15 festival campaigns to storage & Firestore
 */
export const syncAllFestivalCampaignsToStorage = async (
  year: 2026 | 2027 = 2026
): Promise<PushNotificationAlert[]> => {
  const allCampaigns = generateAllFestivalPushCampaigns(year);
  await savePushAlertsToStorage(allCampaigns);
  return allCampaigns;
};

/**
 * Save push alerts to local storage & Firestore
 */
export const savePushAlertsToStorage = async (
  alerts: PushNotificationAlert[]
): Promise<boolean> => {
  try {
    localStorage.setItem(LOCAL_STORAGE_ALERTS_KEY, JSON.stringify(alerts));
  } catch (err) {
    console.warn('Error saving push alerts to local storage:', err);
  }

  if (isConfigValid) {
    try {
      const docRef = doc(db, 'app_content', 'push_notifications');
      await setDoc(
        docRef,
        {
          alerts,
          count: alerts.length,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return true;
    } catch (err) {
      console.warn('Firestore push notification sync notice:', err);
      return true;
    }
  }

  return true;
};

/**
 * Get Push Gateway Config
 */
export const getPushGatewayConfig = (): PushGatewayConfig => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_GATEWAY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_PUSH_GATEWAY_CONFIG,
        ...parsed,
        deviceCaps: { ...DEFAULT_DEVICE_CAP_SETTINGS, ...(parsed.deviceCaps || {}) },
      };
    }
  } catch (err) {
    console.warn('Error reading push gateway config:', err);
  }
  return DEFAULT_PUSH_GATEWAY_CONFIG;
};

/**
 * Save Push Gateway Config
 */
export const savePushGatewayConfig = async (
  config: PushGatewayConfig
): Promise<boolean> => {
  try {
    localStorage.setItem(LOCAL_STORAGE_GATEWAY_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('Error saving push gateway config:', err);
  }

  if (isConfigValid) {
    try {
      const docRef = doc(db, 'app_content', 'push_gateway_settings');
      await setDoc(
        docRef,
        {
          ...config,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return true;
    } catch (err) {
      console.warn('Firestore push gateway sync notice:', err);
      return true;
    }
  }

  return true;
};

/**
 * Broadcast a new push alert campaign from backend with Device Capping
 */
export const broadcastPushAlertFromBackend = async (
  newAlert: Omit<PushNotificationAlert, 'id' | 'createdAt'>
): Promise<{ success: boolean; alert: PushNotificationAlert; dispatchResult?: any }> => {
  const currentAlerts = getPushAlertsFromStorage();
  const alertRecord: PushNotificationAlert = {
    ...newAlert,
    id: `push_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    isRead: false,
  };

  const updated = [alertRecord, ...currentAlerts];
  await savePushAlertsToStorage(updated);

  // Increment total push sent metric
  const gatewayConfig = getPushGatewayConfig();
  await savePushGatewayConfig({
    ...gatewayConfig,
    totalPushSentCount: gatewayConfig.totalPushSentCount + 1,
  });

  // Native Device Notification Dispatch with Cap Enforcement
  const dispatchRes = await dispatchNativeDeviceNotification(alertRecord);

  return { success: true, alert: alertRecord, dispatchResult: dispatchRes };
};

/**
 * Subscribe to real-time push alerts from Firestore
 */
export const subscribeToPushAlerts = (
  callback: (alerts: PushNotificationAlert[]) => void
): (() => void) => {
  callback(getPushAlertsFromStorage());

  if (isConfigValid) {
    try {
      const docRef = doc(db, 'app_content', 'push_notifications');
      const unsub = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists() && snapshot.data()?.alerts) {
          const remoteAlerts = snapshot.data().alerts as PushNotificationAlert[];
          try {
            localStorage.setItem(LOCAL_STORAGE_ALERTS_KEY, JSON.stringify(remoteAlerts));
          } catch {}
          callback(remoteAlerts);
        }
      });
      return unsub;
    } catch (err) {
      console.warn('Realtime push alerts subscription fallback:', err);
    }
  }

  return () => {};
};

