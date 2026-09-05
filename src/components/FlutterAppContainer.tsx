import React, { useState, useEffect } from 'react';
import { VastuCompassView } from './VastuCompassView';
import { HouseAuditorView } from './HouseAuditorView';
import { VastuRemediesView } from './VastuRemediesView';
import { VastuMandalaView } from './VastuMandalaView';
import { VastuMuhurtaView } from './VastuMuhurtaView';
import { AIVastuGuruView } from './AIVastuGuruView';
import { KalashamPoojaGuideView } from './KalashamPoojaGuideView';
import { PropertyManagerModal } from './PropertyManagerModal';
import { UserAccountModal } from './UserAccountModal';
import { PrivacyAndAppInfoModal } from './PrivacyAndAppInfoModal';
import { RazorpayModal } from './RazorpayModal';
import { PlayStoreReviewModal } from './PlayStoreReviewModal';
import { AdminDashboardView } from './AdminDashboardView';
import { AppIntroModal } from './AppIntroModal';
import { AdSenseUnit } from './AdSenseUnit';
import { PushNotificationCenterModal, DEFAULT_CULTURAL_ALERTS } from './PushNotificationCenterModal';
import { PushNotificationBanner } from './PushNotificationBanner';
import {
  subscribeToPushAlerts,
  getUserDeviceAlerts,
  markAllAlertsReadOnUserDevice,
  toggleAlertReadOnUserDevice,
  dismissAlertOnUserDevice,
  addAlertToUserDevice,
  initNativeAndroidPushBridge,
} from '../utils/pushNotificationManager';
import { PlacedRoom, PropertyRecord, UserProfile, SubscriptionPlanId, PushNotificationAlert } from '../types';
import { calculateHouseAudit, playTempleBellChime } from '../utils/vastuUtils';
import { performAutoGeotag, getSystemSettings, getIntroScreens, subscribeToSystemSettings } from '../utils/systemSettings';
import {
  getAppBrandingConfig,
  getMenuNavigationConfig,
  getThemeConfig,
  subscribeToSystemCustomizations,
  AppBrandingConfig,
  MenuItemConfig,
  ThemeConfig,
} from '../utils/appCustomization';
import {
  auth,
  db,
  isConfigValid,
  onAuthStateChanged,
  getRedirectResult,
  syncUserProfileToFirestore,
  saveUserPropertiesToFirestore,
  loadUserPropertiesFromFirestore,
  ADMIN_EMAIL,
  isAdminEmail,
  PaymentRecord,
} from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  Compass,
  Home,
  Wrench,
  Layers,
  Bot,
  Volume2,
  VolumeX,
  Smartphone,
  Maximize2,
  Sparkles,
  User,
  Building2,
  Lock,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Flame,
  Sun,
  BookOpen,
  Bell,
  BellRing,
  Star,
} from 'lucide-react';

// Mangal Kalasham SVG Icon (Center of Attraction matching Indian traditional Kalasham artwork)
const MangalKalashamIcon: React.FC<{ className?: string; isSelected?: boolean }> = ({ className = "w-8 h-8", isSelected }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* 1. MANGO LEAVES (5 Spreading Vibrant Green Leaves Behind & Below Coconut) */}
    {/* Far Left Leaf */}
    <path
      d="M38 34C22 24 8 37 12 44C22 46 34 41 40 36Z"
      fill="#10B981"
      stroke="#FFFFFF"
      strokeWidth="1.5"
    />
    {/* Far Right Leaf */}
    <path
      d="M62 34C78 24 92 37 88 44C78 46 66 41 60 36Z"
      fill="#10B981"
      stroke="#FFFFFF"
      strokeWidth="1.5"
    />
    {/* Mid Left Leaf */}
    <path
      d="M42 34C28 18 18 25 22 37C30 39 38 37 43 35Z"
      fill="#059669"
      stroke="#FFFFFF"
      strokeWidth="1.5"
    />
    {/* Mid Right Leaf */}
    <path
      d="M58 34C72 18 82 25 78 37C70 39 62 37 57 35Z"
      fill="#059669"
      stroke="#FFFFFF"
      strokeWidth="1.5"
    />
    {/* Center Back Leaf */}
    <path
      d="M50 34C44 18 50 10 50 10C50 10 56 18 50 34Z"
      fill="#34D399"
      stroke="#FFFFFF"
      strokeWidth="1.5"
    />

    {/* 2. GRAND SACRED COCONUT TOP (PROPORTIONAL, GOLDEN-AMBER WITH BOLD WHITE OUTLINE) */}
    {/* Main Coconut Body - Vibrant Golden Amber so it pops brightly on dark brown (#78350F) background */}
    <path
      d="M50 4C34 18 32 30 42 36C47 38 53 38 58 36C68 30 66 18 50 4Z"
      fill={isSelected ? "#F59E0B" : "#D97706"}
      stroke="#FFFFFF"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    {/* Coconut Fiber Texture Lines (White / Light Amber) */}
    <path d="M50 6C44 16 44 28 50 35" stroke="#FEF3C7" strokeWidth="2" strokeLinecap="round" />
    <path d="M46 8C40 18 41 27 46 33" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M54 8C60 18 59 27 54 33" stroke="#FEF3C7" strokeWidth="1.5" strokeLinecap="round" />

    {/* Sacred Kumkum & Haldi Tilak on Coconut Top */}
    <ellipse cx="50" cy="18" rx="3.5" ry="5" fill="#DC2626" stroke="#FFFFFF" strokeWidth="1" />
    <circle cx="50" cy="18" r="1.8" fill="#FBBF24" />

    {/* 3. POT NECK & RIM */}
    <path
      d="M28 42H72C76 42 74 47 71 48H29C26 47 24 42 28 42Z"
      fill="#EA580C"
      stroke="#FFFFFF"
      strokeWidth="2"
    />
    <path d="M26 43H74" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M30 47H70" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

    {/* 4. ORANGE KALASH POT BODY */}
    <path
      d="M32 48C18 55 14 68 18 81C22 92 34 96 50 96C66 96 78 92 82 81C86 68 82 55 68 48H32Z"
      fill={isSelected ? "#F97316" : "#EA580C"}
      stroke="#FFFFFF"
      strokeWidth="2"
    />

    {/* TOP BAND: White Chevron / Zigzag Pattern */}
    <path
      d="M22 56L26 62L30 56L34 62L38 56L42 62L46 56L50 62L54 56L58 62L62 56L66 62L70 56L74 62L78 56"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M23 62L26 66L30 62L34 66L38 62L42 66L46 62L50 66L54 62L58 66L62 62L66 66L70 62L74 66L77 62"
      stroke="#FFFFFF"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />

    {/* Horizontal White Band Line */}
    <path d="M18 69H82" stroke="#FFFFFF" strokeWidth="2.5" />

    {/* CENTER: White Swastika Symbol */}
    <g stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M50 71V84" />
      <path d="M43 77.5H57" />
      <path d="M50 71H57" />
      <path d="M57 77.5V84" />
      <path d="M50 84H43" />
      <path d="M43 77.5V71" />
    </g>
    {/* Swastika Corner Dots */}
    <circle cx="46.5" cy="74" r="1.3" fill="#FFFFFF" />
    <circle cx="53.5" cy="74" r="1.3" fill="#FFFFFF" />
    <circle cx="46.5" cy="81" r="1.3" fill="#FFFFFF" />
    <circle cx="53.5" cy="81" r="1.3" fill="#FFFFFF" />

    {/* LEFT & RIGHT: White Rangoli / Kolam Patterns */}
    {/* Left Rangoli Motif */}
    <g transform="translate(27, 77.5)">
      <circle cx="0" cy="-4" r="1.2" fill="#FFFFFF" />
      <circle cx="0" cy="4" r="1.2" fill="#FFFFFF" />
      <circle cx="-4" cy="0" r="1.2" fill="#FFFFFF" />
      <circle cx="4" cy="0" r="1.2" fill="#FFFFFF" />
      <path d="M0 -4 Q-4 -4 -4 0 Q-4 4 0 4 Q4 4 4 0 Q4 -4 0 -4 Z" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
    </g>

    {/* Right Rangoli Motif */}
    <g transform="translate(73, 77.5)">
      <circle cx="0" cy="-4" r="1.2" fill="#FFFFFF" />
      <circle cx="0" cy="4" r="1.2" fill="#FFFFFF" />
      <circle cx="-4" cy="0" r="1.2" fill="#FFFFFF" />
      <circle cx="4" cy="0" r="1.2" fill="#FFFFFF" />
      <path d="M0 -4 Q-4 -4 -4 0 Q-4 4 0 4 Q4 4 4 0 Q4 -4 0 -4 Z" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
    </g>

    {/* Horizontal White Band Line Below Swastika */}
    <path d="M20 87H80" stroke="#FFFFFF" strokeWidth="2.5" />

    {/* LOWER PATTERN: White Wavy Line with Dots */}
    <path
      d="M23 90Q28 94 33 90Q38 86 43 90Q48 94 53 90Q58 86 63 90Q68 94 73 90"
      stroke="#FFFFFF"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="28" cy="94" r="1.2" fill="#FFFFFF" />
    <circle cx="38" cy="94" r="1.2" fill="#FFFFFF" />
    <circle cx="48" cy="94" r="1.2" fill="#FFFFFF" />
    <circle cx="58" cy="94" r="1.2" fill="#FFFFFF" />
    <circle cx="68" cy="94" r="1.2" fill="#FFFFFF" />

    {/* White Bottom Baseline */}
    <path d="M34 96H66" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const FlutterAppContainer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compass' | 'audit' | 'remedies' | 'pooja' | 'muhurta' | 'mandala' | 'guru' | 'admin'>('compass');
  const [targetFestivalId, setTargetFestivalId] = useState<string>('diwali');

  // Handle native notification click deep-link event
  useEffect(() => {
    const handleDeepLink = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      if (detail.tab) {
        setActiveTab(detail.tab);
      }
      if (detail.festivalId) {
        setTargetFestivalId(detail.festivalId);
      }
    };

    window.addEventListener('vastu_navigate_to_tab', handleDeepLink);
    return () => {
      window.removeEventListener('vastu_navigate_to_tab', handleDeepLink);
    };
  }, []);

  // Customization Backend States
  const [appBranding, setAppBranding] = useState<AppBrandingConfig>(getAppBrandingConfig());
  const [navMenuItems, setNavMenuItems] = useState<MenuItemConfig[]>(getMenuNavigationConfig());
  const [appTheme, setAppTheme] = useState<ThemeConfig>(getThemeConfig());

  // Refresh customizations when updated in admin or Firestore
  useEffect(() => {
    const unsubCustom = subscribeToSystemCustomizations(() => {
      setAppBranding(getAppBrandingConfig());
      setNavMenuItems(getMenuNavigationConfig());
      setAppTheme(getThemeConfig());
    });

    const unsubSettings = subscribeToSystemSettings(() => {
      setAppBranding(getAppBrandingConfig());
    });

    const handleConfigChange = () => {
      setAppBranding(getAppBrandingConfig());
      setNavMenuItems(getMenuNavigationConfig());
      setAppTheme(getThemeConfig());
    };

    window.addEventListener('vastu_config_updated', handleConfigChange);
    return () => {
      unsubCustom();
      unsubSettings();
      window.removeEventListener('vastu_config_updated', handleConfigChange);
    };
  }, []);

  // Dynamic Font Family
  const getFontFamilyClass = (family: ThemeConfig['fontFamily']) => {
    switch (family) {
      case 'sans_modern':
        return 'font-sans';
      case 'mono_technical':
        return 'font-mono';
      case 'serif_vedic':
      default:
        return 'font-serif';
    }
  };

  // Dynamic Font Scale
  const getFontScaleClass = (scale: ThemeConfig['fontSizeScale']) => {
    switch (scale) {
      case 'compact':
        return 'text-xs';
      case 'large':
        return 'text-base';
      case 'normal':
      default:
        return 'text-sm';
    }
  };

  // Dynamic Header Gradient Preset
  const getHeaderGradientClass = (preset: ThemeConfig['gradientPreset']) => {
    switch (preset) {
      case 'golden_amber':
        return 'bg-gradient-to-r from-[#D97706] via-[#B45309] to-[#78350F] border-b border-[#F59E0B]/40';
      case 'royal_saffron':
        return 'bg-gradient-to-r from-[#EA580C] via-[#C2410C] to-[#78350F] border-b border-[#FB923C]/40';
      case 'emerald_temple':
        return 'bg-gradient-to-r from-[#059669] via-[#047857] to-[#064E3B] border-b border-[#34D399]/40';
      case 'crimson_divine':
        return 'bg-gradient-to-r from-[#DC2626] via-[#B91C1C] to-[#7F1D1D] border-b border-[#F87171]/40';
      case 'orange_terracotta':
      default:
        return 'bg-[#78350F]/95 border-b border-[#5C280B]';
    }
  };

  // Dynamic Nav Gradient Preset
  const getNavGradientClass = (preset: ThemeConfig['gradientPreset']) => {
    switch (preset) {
      case 'golden_amber':
        return 'bg-gradient-to-r from-[#F59E0B] via-[#D97706] to-[#B45309] border-2 border-[#FDE68A] shadow-amber-900/30';
      case 'royal_saffron':
        return 'bg-gradient-to-r from-[#EA580C] via-[#C2410C] to-[#9A3412] border-2 border-[#FFEDD5] shadow-orange-950/30';
      case 'emerald_temple':
        return 'bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] border-2 border-[#A7F3D0] shadow-emerald-950/30';
      case 'crimson_divine':
        return 'bg-gradient-to-r from-[#EF4444] via-[#DC2626] to-[#991B1B] border-2 border-[#FCA5A5] shadow-red-950/30';
      case 'orange_terracotta':
      default:
        return 'bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#EA580C] border-2 border-[#FDE047] shadow-orange-950/20';
    }
  };

  // Dynamic Pooja Center Button Preset
  const getCenterPoojaGradientClass = (preset: ThemeConfig['gradientPreset']) => {
    switch (preset) {
      case 'golden_amber':
        return 'bg-gradient-to-b from-[#F59E0B] to-[#B45309] border-2 border-[#FDE68A]';
      case 'royal_saffron':
        return 'bg-gradient-to-b from-[#EA580C] to-[#9A3412] border-2 border-[#FFEDD5]';
      case 'emerald_temple':
        return 'bg-gradient-to-b from-[#10B981] to-[#047857] border-2 border-[#A7F3D0]';
      case 'crimson_divine':
        return 'bg-gradient-to-b from-[#EF4444] to-[#991B1B] border-2 border-[#FCA5A5]';
      case 'orange_terracotta':
      default:
        return 'bg-gradient-to-b from-[#EA580C] to-[#C2410C] border-2 border-[#FEF08A]';
    }
  };

  // Dynamic Nav Style
  const getNavBarStyleClass = (style: ThemeConfig['menuBarStyle'], glow: boolean) => {
    let base = 'w-full max-w-4xl mx-auto px-1.5 sm:px-3 py-1 flex items-center justify-between relative transition-all duration-300 ';
    if (style === 'classic_bar') {
      base += 'rounded-t-2xl rounded-b-none ';
    } else if (style === 'glow_border') {
      base += 'rounded-[26px] sm:rounded-full ring-2 ring-amber-300/80 shadow-2xl shadow-amber-500/40 ';
    } else {
      // floating_pill
      base += 'rounded-[26px] sm:rounded-full shadow-xl ';
    }
    if (glow && style !== 'glow_border') {
      base += 'ring-2 ring-amber-300/60 shadow-amber-500/20 ';
    }
    return base;
  };

  // Helper for Icon Rendering in Nav Menu Items
  const renderNavMenuItemIcon = (iconName: string, className: string = 'w-4 h-4 sm:w-5 sm:h-5') => {
    switch (iconName) {
      case 'Compass': return <Compass className={className} />;
      case 'Home': return <Home className={className} />;
      case 'Wrench': return <Wrench className={className} />;
      case 'Calendar': return <Calendar className={className} />;
      case 'Layers': return <Layers className={className} />;
      case 'Bot': return <Bot className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Sun': return <Sun className={className} />;
      case 'Flame': return <Flame className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      case 'ShieldCheck': return <ShieldCheck className={className} />;
      case 'Kalasham': return <Flame className={className} />;
      default: return <Compass className={className} />;
    }
  };

  const [currentDegree, setCurrentDegree] = useState<number>(45); // default North-East
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('vastu_sound_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    try {
      localStorage.setItem('vastu_sound_enabled', String(nextVal));
    } catch {}
    if (nextVal) {
      playTempleBellChime();
    }
  };

  // Modals state
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState<boolean>(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState<boolean>(false);
  const [isAppIntroOpen, setIsAppIntroOpen] = useState<boolean>(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [isPlayReviewModalOpen, setIsPlayReviewModalOpen] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'app_info'>('privacy');
  const [selectedPlanForRazorpay, setSelectedPlanForRazorpay] = useState<string>('lifetime_pro');
  const [pendingPlanPurchase, setPendingPlanPurchase] = useState<string | null>(null);

  // Push Notifications State (Strictly isolated to this device)
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [pushAlerts, setPushAlerts] = useState<PushNotificationAlert[]>(() => {
    return getUserDeviceAlerts();
  });

  const [activeBannerAlert, setActiveBannerAlert] = useState<PushNotificationAlert | null>(() => {
    const alerts = getUserDeviceAlerts();
    return alerts.find((a) => !a.isRead && a.priority === 'high') || null;
  });

  useEffect(() => {
    // 1. Initialize native Android APK push bridge & remote cap synchronizer
    const unsubBridge = initNativeAndroidPushBridge();

    // 2. Listen to real-time broadcasts from backend, but filter and merge locally for this device
    const unsubAlerts = subscribeToPushAlerts((masterCampaigns) => {
      const deviceAlerts = getUserDeviceAlerts(masterCampaigns);
      setPushAlerts(deviceAlerts);
      const highPriUnread = deviceAlerts.find((a) => !a.isRead && a.priority === 'high');
      if (highPriUnread) {
        setActiveBannerAlert(highPriUnread);
      }
    });

    const handleInAppAlert = (e: any) => {
      if (e?.detail) {
        setActiveBannerAlert(e.detail);
      }
    };
    window.addEventListener('vastu_trigger_in_app_alert', handleInAppAlert);

    return () => {
      unsubBridge();
      unsubAlerts();
      window.removeEventListener('vastu_trigger_in_app_alert', handleInAppAlert);
    };
  }, []);

  const handleMarkAllAlertsRead = () => {
    const updated = markAllAlertsReadOnUserDevice();
    setPushAlerts(updated);
  };

  const handleToggleAlertRead = (id: string) => {
    const updated = toggleAlertReadOnUserDevice(id);
    setPushAlerts(updated);
  };

  const handleDismissAlert = (id: string) => {
    const updated = dismissAlertOnUserDevice(id);
    setPushAlerts(updated);
    if (activeBannerAlert?.id === id) {
      setActiveBannerAlert(null);
    }
  };

  const handleAddCustomAlert = (newAlert: PushNotificationAlert) => {
    const updated = addAlertToUserDevice(newAlert);
    setPushAlerts(updated);
    setActiveBannerAlert(newAlert);
  };

  // User account state
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('vastu_active_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isLoggedIn) return parsed;
      }
    } catch {}
    return {
      name: 'Guest Explorer',
      email: '',
      isLoggedIn: false,
      isProMember: false,
      savedPropertiesCount: 0,
    };
  });

  // Perform Auto-Geotag on Launch & Check Intro Screen configuration
  useEffect(() => {
    // Background Auto-Geotag
    performAutoGeotag(userProfile.email || 'guest@vastucompass.app', userProfile.name);

    // Check system settings for App Intro Onboarding Modal
    const sys = getSystemSettings();
    const hasSeenIntro = localStorage.getItem('vastu_intro_seen');
    if (sys.showIntroOnLaunch && !hasSeenIntro) {
      setIsAppIntroOpen(true);
    }
  }, [userProfile.email]);

  // Paid unlock state for House Audit (Global Pro)
  const [isAuditUnlocked, setIsAuditUnlocked] = useState<boolean>(() => {
    return userProfile.isProMember || userProfile.role === 'admin' || localStorage.getItem('vastudrishti_audit_unlocked') === 'true';
  });

  // Per-property unlocked IDs (when single pass is purchased for an individual property)
  const [unlockedPropertyIds, setUnlockedPropertyIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vastu_unlocked_property_ids');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const isProPlanUser = isAuditUnlocked || userProfile.isProMember || userProfile.role === 'admin' || localStorage.getItem('vastudrishti_audit_unlocked') === 'true';

  // Detailed Console Logging helper for Firebase Auth error diagnostics
  const logFirebaseAuthError = (err: any, context: string) => {
    const code = err?.code || 'unknown';
    const message = err?.message || String(err);

    // If user closed the popup or cancelled request intentionally, or browser DB closing / redirect empty notice occurred, log as info notice instead of error
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/argument-error' ||
      code === 'auth/null-user' ||
      message.includes('Database is closing') ||
      message.includes('closing/hidden') ||
      message.includes('auth/argument-error')
    ) {
      console.info(`ℹ️ [Firebase Auth Notice - ${context}]: Google sign-in notice (${code}): ${message}`);
      return;
    }

    console.error(`[Firebase Auth Error - ${context}] Code: ${code} | Message: ${message}`, err);

    switch (code) {
      case 'auth/invalid-api-key':
        console.error('🚨 [Firebase Config Error]: Invalid API Key in firebase-applet-config.json or environment.');
        break;
      case 'auth/unauthorized-domain':
        console.error('🚨 [Firebase Auth Error]: Domain is not authorized in Firebase Console > Authentication > Settings > Authorized Domains.');
        break;
      case 'auth/operation-not-allowed':
        console.error('🚨 [Firebase Auth Error]: This sign-in method is not enabled in Firebase Console.');
        break;
      case 'auth/popup-blocked':
        console.warn('⚠️ [Firebase Auth Notice]: Popup was blocked by browser. Popup or redirect fallback will be attempted.');
        break;
      case 'auth/network-request-failed':
        console.error('🌐 [Firebase Network Error]: Network connection failed while reaching Firebase Auth endpoints.');
        break;
      case 'auth/user-disabled':
        console.error('⛔ [Firebase Auth Error]: User account disabled in Firebase Auth.');
        break;
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        console.warn('🔑 [Firebase Auth Notice]: Invalid credentials or user not found.');
        break;
      default:
        console.info(`ℹ️ [Firebase Auth Diagnostics]: Code "${code}" occurred during context "${context}".`);
        break;
    }
  };

  // Listen to Firebase Auth state & handle redirect results
  useEffect(() => {
    console.log('[Firebase Auth Init] Initializing Firebase Auth state listeners in FlutterAppContainer...');

    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          console.log('[Firebase Auth Redirect] Successfully signed in via redirect:', result.user.email);
          await syncUserProfileToFirestore(result.user);
        }
      })
      .catch((err) => {
        logFirebaseAuthError(err, 'getRedirectResult');
      });

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        console.log('[Firebase Auth StateChanged] User authenticated:', fbUser.email, 'UID:', fbUser.uid);
        try {
          const profile = await syncUserProfileToFirestore(fbUser);
          const isUserAdmin = profile.role === 'admin' || isAdminEmail(profile.email);
          const isPro = isUserAdmin || profile.isProMember;
          const nextUser: UserProfile = {
            uid: fbUser.uid,
            name: profile.name,
            email: profile.email,
            role: isUserAdmin ? 'admin' : profile.role,
            isLoggedIn: true,
            isProMember: isPro,
            savedPropertiesCount: profile.savedPropertiesCount || properties.length,
          };
          setUserProfile(nextUser);
          try {
            localStorage.setItem('vastu_active_user_profile', JSON.stringify(nextUser));
          } catch {}
          setIsAuditUnlocked(isPro);
          if (isPro) {
            localStorage.setItem('vastudrishti_audit_unlocked', 'true');
          }
        } catch (e) {
          logFirebaseAuthError(e, 'syncUserProfileToFirestore inside onAuthStateChanged');
        }
      } else {
        console.log('[Firebase Auth StateChanged] No active Firebase Auth user session detected.');
        const cached = localStorage.getItem('vastu_active_user_profile');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.isLoggedIn) {
              setUserProfile(parsed);
              setIsAuditUnlocked(parsed.isProMember || parsed.role === 'admin');
              return;
            }
          } catch {}
        }
        setUserProfile({
          name: 'Guest Explorer',
          email: '',
          isLoggedIn: false,
          role: 'user',
          isProMember: false,
          savedPropertiesCount: properties.length,
        });
        setIsAuditUnlocked(false);
        localStorage.removeItem('vastudrishti_audit_unlocked');
      }
    });
    return () => unsubscribe();
  }, []);

  // Request Location Permission & record GPS values immediately when user opens the app
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const locData = {
            latitude: Number(latitude.toFixed(6)),
            longitude: Number(longitude.toFixed(6)),
            accuracy: Math.round(accuracy),
            city: 'Live GPS Location',
            country: latitude >= 0 ? 'Northern Hemisphere' : 'Southern Hemisphere',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          try {
            localStorage.setItem('vastudrishti_user_location', JSON.stringify(locData));
          } catch {}
        },
        (err) => {
          console.info('Startup location request notice:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, []);

  // Real-time Firestore user profile listener (e.g. reflects Admin granting/revoking Pro or changing user info immediately)
  useEffect(() => {
    if (!userProfile.uid || !isConfigValid) return;

    try {
      const userDocRef = doc(db, 'users', userProfile.uid);
      const unsubscribe = onSnapshot(
        userDocRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const isUserAdmin = data.role === 'admin' || isAdminEmail(data.email || userProfile.email);
            const isPro = isUserAdmin || !!data.isProMember;

            setUserProfile((prev) => {
              if (
                prev.isProMember === isPro &&
                prev.role === (isUserAdmin ? 'admin' : (data.role || 'user')) &&
                prev.name === (data.name || prev.name)
              ) {
                return prev;
              }
              const updated = {
                ...prev,
                name: data.name || prev.name,
                email: data.email || prev.email,
                role: isUserAdmin ? 'admin' : (data.role || 'user'),
                isProMember: isPro,
              };
              try {
                localStorage.setItem('vastu_active_user_profile', JSON.stringify(updated));
              } catch {}
              return updated;
            });

            setIsAuditUnlocked(isPro);
            if (isPro) {
              localStorage.setItem('vastudrishti_audit_unlocked', 'true');
            } else {
              localStorage.removeItem('vastudrishti_audit_unlocked');
            }
          }
        },
        (err) => {
          console.warn('Real-time user profile listener notice:', err);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Could not subscribe to profile changes:', err);
    }
  }, [userProfile.uid]);

  // Multi-Property records state
  const [properties, setProperties] = useState<PropertyRecord[]>([
    {
      id: 'prop_1',
      name: 'Sunrise Residency - Flat 402',
      isDemo: true,
      address: 'Seawoods, Navi Mumbai, Maharashtra',
      addressType: 'manual',
      propertyType: 'Flat/Apartment',
      facingDegree: 45,
      placedRooms: [
        { id: 'r1', roomType: 'entrance', degree: 45, zoneCode: 'NE', customLabel: 'Main Gate' },
        { id: 'r2', roomType: 'pooja', degree: 45, zoneCode: 'NE', customLabel: 'Mandir' },
        { id: 'r3', roomType: 'kitchen', degree: 135, zoneCode: 'SE', customLabel: 'Kitchen' },
        { id: 'r4', roomType: 'master_bedroom', degree: 225, zoneCode: 'SW', customLabel: 'Master Bed' },
        { id: 'r5', roomType: 'toilet', degree: 202, zoneCode: 'SSW', customLabel: 'Bathroom' },
      ],
      createdAt: '01/08/2026',
    },
    {
      id: 'prop_2',
      name: 'Bandra Beach Villa #12',
      isDemo: true,
      address: 'GPS: 19.0760° N, 72.8777° E (Bandra West, Mumbai)',
      addressType: 'gps',
      coordinates: { lat: 19.076, lng: 72.8777 },
      propertyType: 'Villa',
      facingDegree: 90,
      placedRooms: [
        { id: 'r10', roomType: 'entrance', degree: 90, zoneCode: 'E', customLabel: 'East Entrance' },
        { id: 'r11', roomType: 'kitchen', degree: 135, zoneCode: 'SE', customLabel: 'Kitchen' },
        { id: 'r12', roomType: 'master_bedroom', degree: 225, zoneCode: 'SW', customLabel: 'Master Bed' },
        { id: 'r13', roomType: 'pooja', degree: 45, zoneCode: 'NE', customLabel: 'Pooja Corner' },
      ],
      createdAt: '01/08/2026',
    },
  ]);

  const [activePropertyId, setActivePropertyId] = useState<string>('prop_1');

  // Active property object
  const activeProperty = properties.find((p) => p.id === activePropertyId) || properties[0];

  const isCurrentPropertyUnlocked = isProPlanUser || (activeProperty ? unlockedPropertyIds.includes(activeProperty.id) : false);

  // Placed rooms derived from active property
  const placedRooms = activeProperty ? activeProperty.placedRooms : [];

  // Load saved user properties on mount / user change
  useEffect(() => {
    let isMounted = true;
    const fetchProps = async () => {
      const loaded = await loadUserPropertiesFromFirestore(userProfile.uid);
      if (isMounted && loaded && Array.isArray(loaded) && loaded.length > 0) {
        setProperties(loaded);
        if (!loaded.some((p) => p.id === activePropertyId)) {
          setActivePropertyId(loaded[0].id);
          setCurrentDegree(loaded[0].facingDegree);
        }
      }
    };
    fetchProps();
    return () => {
      isMounted = false;
    };
  }, [userProfile.uid]);

  // Sync user properties to local storage & Firestore whenever updated
  const syncPropertiesUpdate = (updatedProps: PropertyRecord[]) => {
    setProperties(updatedProps);
    saveUserPropertiesToFirestore(userProfile.uid, updatedProps);
  };

  // Keep user profile count synced
  useEffect(() => {
    setUserProfile((prev) => ({
      ...prev,
      savedPropertiesCount: properties.length,
      isProMember: isAuditUnlocked,
    }));
  }, [properties.length, isAuditUnlocked]);

  const handleSelectProperty = (id: string) => {
    setActivePropertyId(id);
    const found = properties.find((p) => p.id === id);
    if (found) {
      setCurrentDegree(found.facingDegree);
    }
  };

  const handleSaveProperty = (newProp: PropertyRecord) => {
    const isProUser = isAuditUnlocked || userProfile.isProMember || userProfile.role === 'admin';
    const hasDemoProperty = properties.some((p) => p.isDemo || p.id === 'prop_1' || p.id === 'prop_2');
    const maxAllowedProperties = isProUser ? Infinity : (hasDemoProperty ? 2 : 1);

    if (properties.length >= maxAllowedProperties) {
      handleOpenRazorpayModal('lifetime_pro');
      return;
    }

    const updated = [newProp, ...properties];
    syncPropertiesUpdate(updated);
    setActivePropertyId(newProp.id);
  };

  const handleDeleteProperty = (id: string) => {
    if (properties.length <= 1) return;
    const updated = properties.filter((p) => p.id !== id);
    syncPropertiesUpdate(updated);
    if (activePropertyId === id) {
      setActivePropertyId(updated[0].id);
      setCurrentDegree(updated[0].facingDegree);
    }
  };

  const handleUpdateActivePropertyLayout = (layoutData: {
    floorplanUrl?: string | null;
    floorplanOpacity?: number;
    floorplanRotation?: number;
    floorplanScale?: number;
    floorplanFlipH?: boolean;
    floorplanFlipV?: boolean;
  }) => {
    const updatedProps = properties.map((p) => {
      if (p.id === activePropertyId) {
        return {
          ...p,
          ...layoutData,
          floorplanUrl:
            layoutData.floorplanUrl === null
              ? undefined
              : layoutData.floorplanUrl !== undefined
              ? layoutData.floorplanUrl
              : p.floorplanUrl,
        };
      }
      return p;
    });
    syncPropertiesUpdate(updatedProps);
  };

  const handleUnlockAudit = (planId?: SubscriptionPlanId) => {
    setIsAuditUnlocked(true);
    localStorage.setItem('vastudrishti_audit_unlocked', 'true');
    setUserProfile((prev) => ({
      ...prev,
      isProMember: true,
      activePlan: planId || 'lifetime_pro',
    }));
    if (soundEnabled) playTempleBellChime();
  };

  const handleOpenRazorpayModal = (planId: string = 'lifetime_pro') => {
    setSelectedPlanForRazorpay(planId);
    if (!userProfile.isLoggedIn) {
      setPendingPlanPurchase(planId);
      setIsAccountModalOpen(true);
      return;
    }
    setIsRazorpayModalOpen(true);
  };

  const handlePaymentSuccess = (record: PaymentRecord) => {
    if (record.planId === 'single_pass') {
      const targetId = activePropertyId;
      if (targetId) {
        setUnlockedPropertyIds((prev) => {
          const updated = Array.from(new Set([...prev, targetId]));
          try {
            localStorage.setItem('vastu_unlocked_property_ids', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
      if (soundEnabled) playTempleBellChime();
    } else {
      handleUnlockAudit(record.planId as SubscriptionPlanId);
    }
  };

  const updateActivePlacedRooms = (updater: (prev: PlacedRoom[]) => PlacedRoom[]) => {
    const updatedProps = properties.map((p) => {
      if (p.id === activePropertyId) {
        return {
          ...p,
          placedRooms: updater(p.placedRooms),
        };
      }
      return p;
    });
    syncPropertiesUpdate(updatedProps);
  };

  const handleAddRoom = (room: PlacedRoom) => {
    updateActivePlacedRooms((prev) => [...prev, room]);
  };

  const handleRemoveRoom = (id: string) => {
    updateActivePlacedRooms((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearRooms = () => {
    updateActivePlacedRooms(() => []);
  };

  const handleAddRoomWithDegree = (roomType: string, deg: number, customLabel?: string) => {
    const newRoom: PlacedRoom = {
      id: `room_${Date.now()}`,
      roomType: roomType as any,
      degree: deg,
      zoneCode: 'NE',
      customLabel,
    };
    handleAddRoom(newRoom);
    setActiveTab('audit');
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (soundEnabled) playTempleBellChime();
  };

  const auditReport = calculateHouseAudit(placedRooms);
  const isAdminUser = userProfile.role === 'admin' || isAdminEmail(userProfile.email);

  return (
    <div className={`min-h-screen bg-[#FAF7F2] ${getFontFamilyClass(appTheme.fontFamily)} ${getFontScaleClass(appTheme.fontSizeScale)} text-[#3D342D] flex flex-col items-center justify-start py-0 md:py-6 selection:bg-[#D97706] selection:text-white`}>
      {/* Outer Shell Wrapper */}
      <div
        className={`w-full transition-all duration-300 flex flex-col bg-[#FAF7F2] relative ${
          isMobileFrame
            ? 'max-w-[420px] h-[850px] max-h-[70vh] my-auto rounded-[48px] border-[12px] border-[#3D342D] shadow-2xl overflow-hidden ring-1 ring-[#78350F]/20'
            : 'max-w-5xl h-[100dvh] md:h-[92vh] md:rounded-3xl border-0 md:border border-[#E8DCC4] shadow-md overflow-hidden'
        }`}
      >
        {/* Navigation Bar */}
        <header className={`sticky top-0 z-40 backdrop-blur-md text-[#F3EFE0] px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 shadow-md shrink-0 ${getHeaderGradientClass(appTheme.gradientPreset)}`}>
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#D97706] text-white flex items-center justify-center font-serif font-bold text-base shadow-sm border border-[#F3EFE0]/20 shrink-0">
              {appBranding.appIconId === 'compass' && <Compass className="w-4 h-4 text-white" />}
              {appBranding.appIconId === 'kalasham' && <Flame className="w-4 h-4 text-white" />}
              {appBranding.appIconId === 'trishul' && <Sparkles className="w-4 h-4 text-white" />}
              {appBranding.appIconId === 'om' && <Sun className="w-4 h-4 text-white" />}
              {appBranding.appIconId === 'lotus' && <Layers className="w-4 h-4 text-white" />}
              {appBranding.appIconId === 'temple' && <Home className="w-4 h-4 text-white" />}
              {appBranding.appIconId === 'custom' && appBranding.customIconUrl ? (
                <img
                  src={appBranding.customIconUrl}
                  alt="App Icon"
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => ((e.target as any).src = '')}
                />
              ) : (
                appBranding.appName.charAt(0) || 'V'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xs sm:text-sm font-serif font-bold tracking-tight text-white flex items-center gap-1 sm:gap-1.5 leading-none truncate">
                <span>{appBranding.appName || 'Vastu Compass'}</span>
                <span className="text-[8px] font-sans font-extrabold px-1.5 py-0.2 rounded-full bg-[#D97706] text-white uppercase tracking-wider shrink-0">
                  Vedic
                </span>
              </h1>
              <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-[#E8DCC4] font-sans font-medium mt-0.5 truncate max-w-[120px] sm:max-w-[180px]">
                {appBranding.appTagline || 'Vedic Harmony & Alignment'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Admin Dashboard Launcher button if admin */}
            {isAdminUser && (
              <button
                onClick={() => handleTabChange('admin')}
                className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white transition-all text-xs border border-white/20 flex items-center gap-1 shadow-xs"
                title="Admin Backend Dashboard"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider inline-block">
                  Admin Backend
                </span>
              </button>
            )}

            {/* Property Address Switcher Button */}
            <button
              onClick={() => setIsPropertyModalOpen(true)}
              className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-[#5C280B] hover:bg-[#431D08] text-[#E8DCC4] hover:text-white transition-all text-xs border border-[#9A420F]/60 flex items-center gap-1.5 shadow-xs"
              title="Record Property Address or Compare Houses"
            >
              <Building2 className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider truncate max-w-[70px] sm:max-w-[120px] inline-block">
                {activeProperty ? activeProperty.name : 'Properties'}
              </span>
            </button>

            {/* User Account Login Button */}
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className={`px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl transition-all text-xs flex items-center gap-1.5 border shadow-xs ${
                isAuditUnlocked
                  ? 'bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#78350F] border-[#FEF3C7]'
                  : 'bg-[#5C280B] hover:bg-[#431D08] text-[#E8DCC4] border-[#9A420F]/60'
              }`}
              title="User Account & Google Sign-In"
            >
              <div className="w-5 h-5 rounded-full bg-[#D97706] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                {userProfile.isLoggedIn ? userProfile.name.charAt(0) : <User className="w-3 h-3" />}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider hidden xs:inline-block sm:inline-block truncate max-w-[65px] sm:max-w-[90px]">
                {userProfile.isLoggedIn ? userProfile.name.split(' ')[0] : 'Sign In'}
              </span>
            </button>

            {/* Google Play Store Review Button */}
            <button
              onClick={() => setIsPlayReviewModalOpen(true)}
              className="p-1.5 sm:p-2 rounded-xl bg-[#5C280B] hover:bg-[#431D08] text-[#FEF08A] hover:text-white transition-all text-xs border border-[#9A420F]/60 shadow-xs relative cursor-pointer group"
              title="Rate App on Google Play Store"
            >
              <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B] group-hover:scale-110 transition-transform" />
            </button>

            {/* Quick Temple Bell Audio Sound Toggle Button */}
            <button
              onClick={handleToggleSound}
              className={`p-1.5 sm:p-2 rounded-xl transition-all text-xs border shadow-xs cursor-pointer ${
                soundEnabled
                  ? 'bg-[#5C280B] hover:bg-[#431D08] text-[#D97706] border-[#9A420F]/60'
                  : 'bg-[#451A03] text-[#A8A29E] border-[#5C280B] hover:bg-[#5C280B]'
              }`}
              title={soundEnabled ? 'Temple Bell Audio Chimes: Enabled (Click to Mute)' : 'Temple Bell Audio Chimes: Muted (Click to Enable)'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#D97706]" /> : <VolumeX className="w-4 h-4 text-[#A8A29E]" />}
            </button>

            {/* Push Notification Ads & Cultural Bell Button */}
            <button
              onClick={() => setIsNotificationModalOpen(true)}
              className="p-1.5 sm:p-2 rounded-xl bg-[#5C280B] hover:bg-[#431D08] text-[#E8DCC4] hover:text-white transition-all text-xs border border-[#9A420F]/60 shadow-xs relative cursor-pointer"
              title="Cultural Reminders & Festival Push Alerts"
            >
              <Bell className="w-4 h-4 text-[#D97706]" />
              {pushAlerts.filter((a) => !a.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#DC2626] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#5C280B]">
                  {pushAlerts.filter((a) => !a.isRead).length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Tab Content Body */}
        <main className="flex-1 overflow-y-auto custom-gold-scrollbar relative bg-[#FAF7F2]">
          {/* Admin Quick Launch Banner */}
          {isAdminUser && (
            <div className="bg-[#78350F] text-white px-3.5 py-2 flex items-center justify-between border-b border-[#D97706]/40 text-xs shadow-inner">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#F59E0B] shrink-0" />
                <span className="text-[11px] font-medium">
                  Signed in as <strong className="text-[#F59E0B]">{userProfile.email || 'Admin Account'}</strong> — Full Backend Control Enabled
                </span>
              </div>
              <button
                onClick={() => handleTabChange('admin')}
                className="px-2.5 py-1 bg-[#D97706] hover:bg-[#B45309] text-white text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all shadow-xs flex items-center gap-1 shrink-0"
              >
                <span>Open Backend</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className={activeTab === 'compass' ? 'block' : 'hidden'}>
            <VastuCompassView
              currentDegree={currentDegree}
              onDegreeChange={setCurrentDegree}
              onAddRoomWithDegree={handleAddRoomWithDegree}
              isActive={activeTab === 'compass'}
            />
            <div className="p-3 max-w-2xl mx-auto">
              <AdSenseUnit format="banner" slotId="vastu-bottom-banner-compass" />
            </div>
          </div>

          <div className={activeTab === 'audit' ? 'block' : 'hidden'}>
            <HouseAuditorView
              placedRooms={placedRooms}
              onAddRoom={handleAddRoom}
              onRemoveRoom={handleRemoveRoom}
              onClearRooms={handleClearRooms}
              onSetRooms={(rooms) => updateActivePlacedRooms(() => rooms)}
              onNavigateToTab={handleTabChange}
              isAuditUnlocked={isCurrentPropertyUnlocked}
              onUnlockAudit={(plan) => handleOpenRazorpayModal(plan || 'single_pass')}
              activeProperty={activeProperty}
              userProfile={userProfile}
              onOpenPropertyManager={() => setIsPropertyModalOpen(true)}
            />
            <div className="p-3 max-w-2xl mx-auto">
              <AdSenseUnit format="card" slotId="vastu-audit-card-ad" />
            </div>
          </div>

          <div className={activeTab === 'remedies' ? 'block' : 'hidden'}>
            <VastuRemediesView
              placedRooms={placedRooms}
              isAuditUnlocked={isCurrentPropertyUnlocked}
              onUnlockAudit={() => handleOpenRazorpayModal('single_pass')}
            />
            <div className="p-3 max-w-2xl mx-auto">
              <AdSenseUnit format="banner" slotId="vastu-remedies-ad" />
            </div>
          </div>

          <div className={activeTab === 'pooja' ? 'block' : 'hidden'}>
            <KalashamPoojaGuideView
              initialFestivalId={targetFestivalId}
              onOpenConsult={() => handleTabChange('guru')}
            />
            <div className="p-3 max-w-2xl mx-auto">
              <AdSenseUnit format="banner" slotId="vastu-pooja-ad" />
            </div>
          </div>

          <div className={activeTab === 'muhurta' ? 'block' : 'hidden'}>
            <VastuMuhurtaView activeProperty={activeProperty} userProfile={userProfile} />
            <div className="p-3 max-w-2xl mx-auto">
              <AdSenseUnit format="banner" slotId="vastu-muhurta-ad" />
            </div>
          </div>

          <div className={activeTab === 'mandala' ? 'block' : 'hidden'}>
            <VastuMandalaView
              activeProperty={activeProperty}
              onUpdateActivePropertyLayout={handleUpdateActivePropertyLayout}
              isUnlocked={isCurrentPropertyUnlocked}
              onUnlockAudit={() => handleOpenRazorpayModal('single_pass')}
            />
          </div>

          <div className={activeTab === 'guru' ? 'block' : 'hidden'}>
            <AIVastuGuruView
              placedRooms={placedRooms}
              currentDegree={currentDegree}
              userProfile={userProfile}
              activeProperty={activeProperty}
            />
          </div>

          {activeTab === 'admin' && (
            <AdminDashboardView
              currentUserEmail={userProfile.email}
              onClose={() => setActiveTab('compass')}
            />
          )}
        </main>

        {/* Modals */}
        <PropertyManagerModal
          isOpen={isPropertyModalOpen}
          onClose={() => setIsPropertyModalOpen(false)}
          properties={properties}
          activePropertyId={activePropertyId}
          onSelectProperty={handleSelectProperty}
          onSaveProperty={handleSaveProperty}
          onDeleteProperty={handleDeleteProperty}
          currentPlacedRooms={placedRooms}
          currentFacingDegree={currentDegree}
          isAuditUnlocked={isProPlanUser}
          onUnlockAudit={(plan) => handleOpenRazorpayModal(plan || 'lifetime_pro')}
        />

        <UserAccountModal
          isOpen={isAccountModalOpen}
          onClose={() => setIsAccountModalOpen(false)}
          user={userProfile}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onUpdateUser={(updated) => {
            setUserProfile((prev) => {
              const next = { ...prev, ...updated };
              if (next.isLoggedIn) {
                try {
                  localStorage.setItem('vastu_active_user_profile', JSON.stringify(next));
                } catch {}
                if (next.isProMember || next.role === 'admin') {
                  setIsAuditUnlocked(true);
                  localStorage.setItem('vastudrishti_audit_unlocked', 'true');
                }
              } else {
                try {
                  localStorage.removeItem('vastu_active_user_profile');
                } catch {}
              }
              return next;
            });

            if (updated.isLoggedIn && pendingPlanPurchase) {
              const planToBuy = pendingPlanPurchase;
              setPendingPlanPurchase(null);
              setSelectedPlanForRazorpay(planToBuy);
              setIsAccountModalOpen(false);
              setIsRazorpayModalOpen(true);
            }
          }}
          onUnlockAudit={handleUnlockAudit}
          onOpenAdminPanel={() => handleTabChange('admin')}
          onOpenRazorpay={(planId) => {
            setIsAccountModalOpen(false);
            handleOpenRazorpayModal(planId);
          }}
          onOpenPrivacyPolicy={() => {
            setIsAccountModalOpen(false);
            setLegalModalTab('privacy');
            setIsLegalModalOpen(true);
          }}
          onOpenAppInfo={() => {
            setIsAccountModalOpen(false);
            setLegalModalTab('app_info');
            setIsLegalModalOpen(true);
          }}
          onOpenPlayStoreReview={() => {
            setIsAccountModalOpen(false);
            setIsPlayReviewModalOpen(true);
          }}
        />

        <PlayStoreReviewModal
          isOpen={isPlayReviewModalOpen}
          onClose={() => setIsPlayReviewModalOpen(false)}
          userEmail={userProfile.email}
          userName={userProfile.name}
          sourceTrigger="manual_header"
        />

        <PrivacyAndAppInfoModal
          isOpen={isLegalModalOpen}
          initialTab={legalModalTab}
          onClose={() => setIsLegalModalOpen(false)}
          onOpenPlayStoreReview={() => setIsPlayReviewModalOpen(true)}
        />

        <RazorpayModal
          isOpen={isRazorpayModalOpen}
          onClose={() => setIsRazorpayModalOpen(false)}
          planId={selectedPlanForRazorpay}
          user={{
            uid: userProfile.uid,
            email: userProfile.email || 'user@vastucompass.app',
            name: userProfile.name || 'Vedic Architect',
          }}
          onSuccess={handlePaymentSuccess}
        />

        <PushNotificationBanner
          alert={activeBannerAlert}
          onOpenCenter={() => setIsNotificationModalOpen(true)}
          onNavigateToTab={(tabId) => handleTabChange(tabId as any)}
          onDismiss={() => setActiveBannerAlert(null)}
        />

        <PushNotificationCenterModal
          isOpen={isNotificationModalOpen}
          onClose={() => setIsNotificationModalOpen(false)}
          alerts={pushAlerts}
          onMarkAllAsRead={handleMarkAllAlertsRead}
          onToggleRead={handleToggleAlertRead}
          onDismissAlert={handleDismissAlert}
          onAddCustomAlert={handleAddCustomAlert}
          onNavigateToTab={(tabId) => handleTabChange(tabId as any)}
          soundEnabled={soundEnabled}
        />

        <AppIntroModal
          isOpen={isAppIntroOpen}
          onClose={() => {
            setIsAppIntroOpen(false);
            localStorage.setItem('vastu_intro_seen', 'true');
          }}
          screens={getIntroScreens()}
          appName={getSystemSettings().appName}
        />

        {/* Bottom Navigation Bar */}
        <nav className="sticky bottom-0 shrink-0 z-50 py-2 px-2 sm:px-4 w-full">
          <div className={`${getNavGradientClass(appTheme.gradientPreset)} ${getNavBarStyleClass(appTheme.menuBarStyle, appTheme.menuBorderGlow)}`}>
            
            {/* LEFT 3 ITEMS */}
            <div className="flex-1 grid grid-cols-3 gap-0.5 sm:gap-1 items-center">
              {/* COMPASS TAB */}
              <button
                onClick={() => handleTabChange('compass')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                  activeTab === 'compass'
                    ? 'bg-white/25 text-white font-black border border-white/40 shadow-2xs'
                    : 'text-[#FFEDD5] hover:text-white font-bold'
                }`}
              >
                {renderNavMenuItemIcon(navMenuItems.find((i) => i.id === 'compass')?.iconName || 'Compass', 'w-4 h-4 sm:w-5 sm:h-5 shrink-0')}
                <span className="text-[8px] sm:text-[10px] uppercase tracking-wider whitespace-nowrap mt-0.5">
                  {navMenuItems.find((i) => i.id === 'compass')?.label || 'Compass'}
                </span>
              </button>

              {/* AUDIT TAB */}
              <button
                onClick={() => handleTabChange('audit')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
                  activeTab === 'audit'
                    ? 'bg-white/25 text-white font-black border border-white/40 shadow-2xs'
                    : 'text-[#FFEDD5] hover:text-white font-bold'
                }`}
              >
                <div className="relative shrink-0">
                  {renderNavMenuItemIcon(navMenuItems.find((i) => i.id === 'audit')?.iconName || 'Home', 'w-4 h-4 sm:w-5 sm:h-5')}
                  {placedRooms.length > 0 && (
                    <span className="absolute -top-1.5 -right-2 text-[7px] sm:text-[8px] font-black px-1 py-0.2 rounded-full bg-[#10B981] text-white leading-tight shadow-2xs">
                      {isAuditUnlocked ? `${auditReport.overallScore}%` : '🔒'}
                    </span>
                  )}
                </div>
                <span className="text-[8px] sm:text-[10px] uppercase tracking-wider whitespace-nowrap mt-0.5">
                  {navMenuItems.find((i) => i.id === 'audit')?.label || 'Audit'}
                </span>
              </button>

              {/* REMEDIES TAB */}
              <button
                onClick={() => handleTabChange('remedies')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
                  activeTab === 'remedies'
                    ? 'bg-white/25 text-white font-black border border-white/40 shadow-2xs'
                    : 'text-[#FFEDD5] hover:text-white font-bold'
                }`}
              >
                <div className="relative shrink-0">
                  {renderNavMenuItemIcon(navMenuItems.find((i) => i.id === 'remedies')?.iconName || 'Wrench', 'w-4 h-4 sm:w-5 sm:h-5')}
                  {auditReport.doshCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 text-[7px] sm:text-[8px] font-black px-1 py-0.2 rounded-full bg-[#FEF08A] text-[#78350F] leading-tight shadow-2xs animate-pulse">
                      {auditReport.doshCount}
                    </span>
                  )}
                </div>
                <span className="text-[8px] sm:text-[10px] uppercase tracking-wider whitespace-nowrap mt-0.5">
                  {navMenuItems.find((i) => i.id === 'remedies')?.label || 'Remedies'}
                </span>
              </button>
            </div>

            {/* CENTER ELEVATED SQUIRCLE: POOJA */}
            <div className="mx-1 sm:mx-2 shrink-0 relative">
              <button
                onClick={() => handleTabChange('pooja')}
                className={`w-13 h-13 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl ${getCenterPoojaGradientClass(appTheme.gradientPreset)} shadow-2xl -translate-y-3 sm:-translate-y-4 hover:scale-105 cursor-pointer flex flex-col items-center justify-center transition-all duration-200 z-20 ${
                  activeTab === 'pooja'
                    ? 'ring-4 ring-[#FEF08A]/80 scale-110'
                    : ''
                }`}
              >
                <div className="relative shrink-0 flex items-center justify-center">
                  <MangalKalashamIcon
                    className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-md"
                    isSelected={activeTab === 'pooja'}
                  />
                </div>
                <span className="text-[8px] sm:text-[10px] font-extrabold uppercase text-[#FEF08A] tracking-wider whitespace-nowrap mt-0.5">
                  {navMenuItems.find((i) => i.id === 'pooja')?.label || 'Pooja'}
                </span>
              </button>
            </div>

            {/* RIGHT 3 ITEMS */}
            <div className="flex-1 grid grid-cols-3 gap-0.5 sm:gap-1 items-center">
              {/* MUHURTA TAB */}
              <button
                onClick={() => handleTabChange('muhurta')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                  activeTab === 'muhurta'
                    ? 'bg-white/25 text-white font-black border border-white/40 shadow-2xs'
                    : 'text-[#FFEDD5] hover:text-white font-bold'
                }`}
              >
                {renderNavMenuItemIcon(navMenuItems.find((i) => i.id === 'muhurta')?.iconName || 'Calendar', 'w-4 h-4 sm:w-5 sm:h-5 shrink-0')}
                <span className="text-[8px] sm:text-[10px] uppercase tracking-wider whitespace-nowrap mt-0.5">
                  {navMenuItems.find((i) => i.id === 'muhurta')?.label || 'Muhurta'}
                </span>
              </button>

              {/* MANDALA TAB */}
              <button
                onClick={() => handleTabChange('mandala')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                  activeTab === 'mandala'
                    ? 'bg-white/25 text-white font-black border border-white/40 shadow-2xs'
                    : 'text-[#FFEDD5] hover:text-white font-bold'
                }`}
              >
                {renderNavMenuItemIcon(navMenuItems.find((i) => i.id === 'mandala')?.iconName || 'Layers', 'w-4 h-4 sm:w-5 sm:h-5 shrink-0')}
                <span className="text-[8px] sm:text-[10px] uppercase tracking-wider whitespace-nowrap mt-0.5">
                  {navMenuItems.find((i) => i.id === 'mandala')?.label || 'Mandala'}
                </span>
              </button>

              {/* GURU / CONSULT TAB */}
              <button
                onClick={() => handleTabChange('guru')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                  activeTab === 'guru'
                    ? 'bg-white/25 text-white font-black border border-white/40 shadow-2xs'
                    : 'text-[#FFEDD5] hover:text-white font-bold'
                }`}
              >
                {renderNavMenuItemIcon(navMenuItems.find((i) => i.id === 'guru')?.iconName || 'Bot', 'w-4 h-4 sm:w-5 sm:h-5 shrink-0')}
                <span className="text-[8px] sm:text-[10px] uppercase tracking-wider whitespace-nowrap mt-0.5">
                  {navMenuItems.find((i) => i.id === 'guru')?.label || 'Consult'}
                </span>
              </button>
            </div>

          </div>
        </nav>
      </div>
    </div>
  );
};
