import React, { useState, useEffect } from 'react';
import { PushNotificationAlert } from '../types';
import { playTempleBellChime } from '../utils/vastuUtils';
import {
  detectCurrentDevice,
  getDeviceCapSettings,
  getDeviceDeliveryStats,
  dispatchNativeDeviceNotification,
  INITIAL_ADMIN_PUSH_CAMPAIGNS,
  DeviceProfile,
  DeviceCapSettings,
  DeviceDeliveryStats,
} from '../utils/pushNotificationManager';
import {
  Bell,
  BellRing,
  Check,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  Flame,
  Volume2,
  X,
  Send,
  Sliders,
  ShieldCheck,
  Compass,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sun,
  Zap,
  Info,
  Radio,
  Plus,
  Smartphone,
  Laptop,
  Tablet,
} from 'lucide-react';

export const DEFAULT_CULTURAL_ALERTS: PushNotificationAlert[] = INITIAL_ADMIN_PUSH_CAMPAIGNS;

interface PushNotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: PushNotificationAlert[];
  onMarkAllAsRead: () => void;
  onToggleRead: (id: string) => void;
  onDismissAlert: (id: string) => void;
  onAddCustomAlert: (alert: PushNotificationAlert) => void;
  onNavigateToTab: (tabId: string) => void;
  soundEnabled?: boolean;
}

export const PushNotificationCenterModal: React.FC<PushNotificationCenterModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onMarkAllAsRead,
  onToggleRead,
  onDismissAlert,
  onAddCustomAlert,
  onNavigateToTab,
  soundEnabled = true,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'festivals' | 'muhurta' | 'settings' | 'broadcast'>('all');
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);
  const [testErrorMessage, setTestErrorMessage] = useState<string | null>(null);

  // Device Profile & Delivery Stats
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile>(detectCurrentDevice());
  const [deviceStats, setDeviceStats] = useState<DeviceDeliveryStats>(getDeviceDeliveryStats());
  const [capSettings, setCapSettings] = useState<DeviceCapSettings>(getDeviceCapSettings());

  // Preference Toggles State
  const [prefFestivals, setPrefFestivals] = useState<boolean>(true);
  const [prefMuhurta, setPrefMuhurta] = useState<boolean>(true);
  const [prefRahuKalam, setPrefRahuKalam] = useState<boolean>(true);
  const [prefDailyTips, setPrefDailyTips] = useState<boolean>(true);

  // Custom Broadcast Form
  const [customTitle, setCustomTitle] = useState<string>('🪔 Special Festival Reminder');
  const [customBody, setCustomBody] = useState<string>('Diwali is in 3 days, check your auspicious timings!');
  const [customCountdown, setCustomCountdown] = useState<string>('In 3 Days');
  const [customTargetTab, setCustomTargetTab] = useState<string>('pooja');
  const [customPriority, setCustomPriority] = useState<'high' | 'normal'>('high');

  const [inAppPushEnabled, setInAppPushEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('vastu_in_app_push_enabled');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (isOpen) {
      const profile = detectCurrentDevice();
      setDeviceProfile(profile);
      setBrowserPermission(profile.permission);
      setDeviceStats(getDeviceDeliveryStats());
      setCapSettings(getDeviceCapSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPushPermission = async () => {
    // 1. Always enable In-App Push & Sound Alerts
    setInAppPushEnabled(true);
    try {
      localStorage.setItem('vastu_in_app_push_enabled', 'true');
    } catch {}

    if (soundEnabled && capSettings.enableChimeSound) playTempleBellChime();

    // 2. Attempt Browser Native Notification API
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setBrowserPermission(res);
        const profile = detectCurrentDevice();
        setDeviceProfile(profile);

        if (res === 'granted') {
          setTestSuccessMessage('✓ Native Device Notifications & Audio Alerts Enabled!');
          setTestErrorMessage(null);

          // Dispatch instant welcome notification respecting device cap
          await dispatchNativeDeviceNotification({
            id: 'welcome_device_push',
            title: '🪔 Vastu Compass & Cultural Reminders',
            body: `Push notifications active on this ${profile.os} (${profile.type}) device with a daily cap of ${deviceStats.capForThisDevice} alerts/day.`,
            category: 'festival',
            countdownText: 'Active',
            dateLabel: 'Today',
            iconName: 'Flame',
            priority: 'normal',
          });

          setDeviceStats(getDeviceDeliveryStats());
        } else {
          // If browser denied or running in sandboxed iframe
          setTestSuccessMessage('✓ Cultural In-App & Sound Alerts Activated! (For OS system tray popups, open app in a new tab or allow notifications in browser site settings)');
          setTestErrorMessage(null);
        }
      } catch (err) {
        console.info('Push permission notice:', err);
        setTestSuccessMessage('✓ Cultural In-App & Sound Alerts Activated on this device!');
        setTestErrorMessage(null);
      }
    } else {
      setTestSuccessMessage('✓ Cultural In-App Alerts & Sacred Temple Chimes Activated!');
      setTestErrorMessage(null);
    }
  };

  const handleTriggerTestPush = async (forced: boolean = true) => {
    if (soundEnabled && capSettings.enableChimeSound) playTempleBellChime();

    const sampleAlert: PushNotificationAlert = {
      id: `test_${Date.now()}`,
      title: '🪔 Festival Reminder: Diwali is in 3 days!',
      body: 'Check your Mahalakshmi Pujan auspicious timings and essential puja vidhi steps.',
      category: 'festival',
      targetTab: 'pooja',
      countdownText: 'In 3 Days',
      dateLabel: '18 Nov 2026',
      iconName: 'Flame',
      isRead: false,
      priority: 'high',
      createdAt: new Date().toISOString(),
    };

    onAddCustomAlert(sampleAlert);

    try {
      window.dispatchEvent(new CustomEvent('vastu_trigger_in_app_alert', { detail: sampleAlert }));
    } catch {}

    const result = await dispatchNativeDeviceNotification(sampleAlert, { force: forced });
    setDeviceStats(result.stats);

    if (result.delivered) {
      const bypassText = result.reason === 'delivered_with_high_priority_bypass' ? ' (High-Priority Bypass)' : '';
      setTestSuccessMessage(
        `⚡ Native Push & In-App Toast Delivered! [${deviceProfile.type.toUpperCase()}: ${result.stats.countToday}/${
          result.stats.capForThisDevice === 0 ? '∞' : result.stats.capForThisDevice
        } Today]${bypassText}`
      );
      setTestErrorMessage(null);
    } else {
      setTestSuccessMessage('⚡ In-App Cultural Alert & Temple Bell Audio Delivered on Screen!');
      setTestErrorMessage(null);
    }

    setTimeout(() => {
      setTestSuccessMessage(null);
      setTestErrorMessage(null);
    }, 6000);
  };

  const handleSendCustomBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customBody.trim()) return;

    if (soundEnabled && capSettings.enableChimeSound) playTempleBellChime();

    const newAlert: PushNotificationAlert = {
      id: `custom_${Date.now()}`,
      title: customTitle,
      body: customBody,
      category: 'festival',
      targetTab: customTargetTab,
      countdownText: customCountdown || 'Alert',
      dateLabel: 'Upcoming',
      iconName: 'Flame',
      isRead: false,
      priority: customPriority,
      createdAt: new Date().toISOString(),
    };

    onAddCustomAlert(newAlert);

    const dispatchRes = await dispatchNativeDeviceNotification(newAlert);
    setDeviceStats(dispatchRes.stats);

    if (dispatchRes.delivered) {
      setTestSuccessMessage(
        `🎉 Cultural Push Broadcasted & Delivered natively on this ${deviceProfile.type}!`
      );
    } else {
      setTestSuccessMessage('🎉 Cultural Push saved to app alerts.');
      if (dispatchRes.reason === 'daily_cap_reached') {
        setTestErrorMessage(`Note: Native popup skipped because today's ${deviceProfile.type} cap was reached.`);
      }
    }
    setTimeout(() => {
      setTestSuccessMessage(null);
      setTestErrorMessage(null);
    }, 5000);
  };

  const filteredAlerts = alerts.filter((item) => {
    if (activeTab === 'festivals') return item.category === 'festival' || item.category === 'special_puja';
    if (activeTab === 'muhurta') return item.category === 'muhurta' || item.category === 'rahu_kalam';
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const renderAlertCategoryIcon = (item: PushNotificationAlert) => {
    switch (item.iconName) {
      case 'Compass':
        return <Compass className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'Shield':
        return <ShieldCheck className="w-5 h-5" />;
      case 'Sun':
        return <Sun className="w-5 h-5" />;
      case 'Clock':
        return <Clock className="w-5 h-5" />;
      case 'Bell':
        return <BellRing className="w-5 h-5" />;
      case 'Flame':
      default:
        return <Flame className="w-5 h-5" />;
    }
  };

  const renderDeviceIcon = (type: DeviceProfile['type']) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-4 h-4 text-[#D97706]" />;
      case 'tablet':
        return <Tablet className="w-4 h-4 text-[#D97706]" />;
      case 'desktop':
      default:
        return <Laptop className="w-4 h-4 text-[#D97706]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 pb-16 sm:pb-4 animate-in fade-in duration-200">
      <div className="bg-[#FCFAF7] border-2 border-[#D97706] rounded-3xl max-w-2xl w-full p-4 sm:p-5 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8DCC4] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] text-[#D97706] border border-[#F59E0B]/30 flex items-center justify-center relative shrink-0 shadow-xs">
              <BellRing className="w-5 h-5 text-[#D97706]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#DC2626] text-white text-[10px] font-black min-w-4.5 h-4.5 px-1 rounded-full flex items-center justify-center border-2 border-[#FCFAF7] shadow-xs">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#78350F] flex items-center gap-2 leading-tight">
                <span>Cultural Reminders & Push Alerts</span>
              </h3>
              <p className="text-xs text-[#8B735B] mt-0.5">
                Native alerts & auspicious Muhurta timings for sacred cultural festivals
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F3EFE0] hover:bg-[#E8DCC4] text-[#78350F] flex items-center justify-center transition-all cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* NATIVE DEVICE NOTIFICATION STATUS BAR */}
        <div className="mt-3 p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center shrink-0 shadow-2xs">
              {renderDeviceIcon(deviceProfile.type)}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#D97706] text-white shadow-2xs">
                  {deviceProfile.type.toUpperCase()} ({deviceProfile.os})
                </span>
                <span
                  className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                    browserPermission === 'granted'
                      ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                      : inAppPushEnabled
                      ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                      : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                  }`}
                >
                  {browserPermission === 'granted'
                    ? 'Native OS Push Active'
                    : inAppPushEnabled
                    ? 'In-App Alerts & Chimes Active'
                    : 'Permission Needed'}
                </span>
              </div>
              <span className="text-[11px] text-[#8B735B] block mt-1 leading-snug">
                {browserPermission === 'granted'
                  ? 'Ready to receive auspicious Muhurta & Festival reminders directly on this device.'
                  : inAppPushEnabled
                  ? 'Auspicious festival chimes, live countdowns & banner alerts active in app.'
                  : 'Enable push alerts below to receive live puja & Muhurta alerts on this device.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
            <button
              onClick={handleRequestPushPermission}
              className={`px-3.5 py-1.5 text-white text-[11px] font-extrabold rounded-xl shadow-xs transition-all uppercase tracking-wider whitespace-nowrap cursor-pointer ${
                browserPermission === 'granted' || inAppPushEnabled
                  ? 'bg-[#059669] hover:bg-[#047857]'
                  : 'bg-[#D97706] hover:bg-[#B45309]'
              }`}
            >
              {browserPermission === 'granted'
                ? '✓ Native Push Active'
                : inAppPushEnabled
                ? '✓ Alerts Active (Refresh)'
                : 'Enable Push'}
            </button>
          </div>
        </div>

        {/* Feedback Banners */}
        {testSuccessMessage && (
          <div className="mt-2 p-2.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-xs font-bold text-[#065F46] flex items-center gap-2 animate-in fade-in duration-200 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
            <span className="truncate">{testSuccessMessage}</span>
          </div>
        )}

        {testErrorMessage && (
          <div className="mt-2 p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs font-bold text-[#991B1B] flex items-center justify-between gap-2 animate-in fade-in duration-200 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span className="truncate">{testErrorMessage}</span>
            </div>
          </div>
        )}

        {/* Tab Navigation (Clean horizontal scrolling without bulky tracks) */}
        <div className="mt-3 flex items-center justify-between gap-2 border-b border-[#E8DCC4] pb-2.5 shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#78350F] text-white shadow-xs'
                  : 'bg-[#F3EFE0] text-[#78350F] hover:bg-[#E8DCC4]'
              }`}
            >
              All Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('festivals')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'festivals'
                  ? 'bg-[#78350F] text-white shadow-xs'
                  : 'bg-[#F3EFE0] text-[#78350F] hover:bg-[#E8DCC4]'
              }`}
            >
              🪔 Festivals & Pujas
            </button>
            <button
              onClick={() => setActiveTab('muhurta')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'muhurta'
                  ? 'bg-[#78350F] text-white shadow-xs'
                  : 'bg-[#F3EFE0] text-[#78350F] hover:bg-[#E8DCC4]'
              }`}
            >
              ✨ Shubh Muhurtas
            </button>
            <button
              onClick={() => setActiveTab('broadcast')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'broadcast'
                  ? 'bg-[#78350F] text-white shadow-xs'
                  : 'bg-[#F3EFE0] text-[#78350F] hover:bg-[#E8DCC4]'
              }`}
            >
              + Create Alert
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#78350F] text-white shadow-xs'
                  : 'bg-[#F3EFE0] text-[#78350F] hover:bg-[#E8DCC4]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 inline mr-1" /> Categories
            </button>
          </div>

          {unreadCount > 0 && activeTab !== 'settings' && activeTab !== 'broadcast' && (
            <button
              onClick={onMarkAllAsRead}
              className="text-[11px] font-bold text-[#D97706] hover:underline whitespace-nowrap shrink-0 cursor-pointer pl-2"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          {activeTab === 'broadcast' ? (
            /* Broadcast / Create Custom Alert Form */
            <form onSubmit={handleSendCustomBroadcast} className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4 space-y-3">
              <h4 className="font-serif font-bold text-sm text-[#78350F] flex items-center gap-1.5">
                <Send className="w-4 h-4 text-[#D97706]" /> Send Custom Cultural Push Reminder
              </h4>
              <p className="text-xs text-[#8B735B]">
                Craft a tailored festival or muhurta alert to notify users in real-time.
              </p>

              <div>
                <label className="text-xs font-bold text-[#78350F] block mb-1">Notification Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. 🪔 Diwali is in 3 days!"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E8DCC4] bg-white text-[#3D342D] font-medium focus:outline-none focus:border-[#D97706]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#78350F] block mb-1">Alert Description Body</label>
                <textarea
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  rows={2}
                  placeholder="e.g. Check Mahalakshmi Pujan auspicious timings & mandir orientation guidelines."
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E8DCC4] bg-white text-[#3D342D] font-medium focus:outline-none focus:border-[#D97706]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#78350F] block mb-1">Countdown Tag</label>
                  <input
                    type="text"
                    value={customCountdown}
                    onChange={(e) => setCustomCountdown(e.target.value)}
                    placeholder="e.g. In 3 Days / Today"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E8DCC4] bg-white text-[#3D342D] font-medium focus:outline-none focus:border-[#D97706]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#78350F] block mb-1">Target App View</label>
                  <select
                    value={customTargetTab}
                    onChange={(e) => setCustomTargetTab(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E8DCC4] bg-white text-[#3D342D] font-bold focus:outline-none focus:border-[#D97706]"
                  >
                    <option value="pooja">🪔 Pooja Guide Tab</option>
                    <option value="muhurta">✨ Shubh Muhurta Tab</option>
                    <option value="compass">🧭 Vastu Compass Tab</option>
                    <option value="remedies">🛠️ Vastu Remedies Tab</option>
                    <option value="aiguru">🤖 AI Vastu Guru Tab</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#78350F] block mb-1">Priority (Cap Rule)</label>
                  <select
                    value={customPriority}
                    onChange={(e) => setCustomPriority(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E8DCC4] bg-white text-[#3D342D] font-bold focus:outline-none focus:border-[#D97706]"
                  >
                    <option value="high">🔥 High (Bypasses soft cap)</option>
                    <option value="normal">🔔 Normal (Strict device cap)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Send className="w-4 h-4" /> Send Push Alert Now
              </button>
            </form>
          ) : activeTab === 'settings' ? (
            /* Preferences Form */
            <div className="space-y-3 bg-white border border-[#E8DCC4] rounded-2xl p-4">
              <h4 className="font-serif font-bold text-sm text-[#78350F] flex items-center gap-1.5 border-b border-[#E8DCC4] pb-2">
                <Sliders className="w-4 h-4 text-[#D97706]" /> Notification Category Preferences
              </h4>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#FCFAF7] border border-[#E8DCC4] cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-[#78350F] block">🪔 Festival & Puja Reminders</span>
                    <span className="text-[11px] text-[#8B735B]">Alerts for Diwali, Navratri, Dhanteras, Griha Pravesh</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefFestivals}
                    onChange={(e) => setPrefFestivals(e.target.checked)}
                    className="w-4 h-4 accent-[#D97706] rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#FCFAF7] border border-[#E8DCC4] cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-[#78350F] block">✨ Shubh Muhurta Window Alerts</span>
                    <span className="text-[11px] text-[#8B735B]">High-precision Vrishabha & Amrita Lagna timings</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefMuhurta}
                    onChange={(e) => setPrefMuhurta(e.target.checked)}
                    className="w-4 h-4 accent-[#D97706] rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#FCFAF7] border border-[#E8DCC4] cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-[#78350F] block">⚠️ Rahu Kalam & Dur Muhurta Warnings</span>
                    <span className="text-[11px] text-[#8B735B]">Daily alerts on inauspicious time frames to avoid</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefRahuKalam}
                    onChange={(e) => setPrefRahuKalam(e.target.checked)}
                    className="w-4 h-4 accent-[#D97706] rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#FCFAF7] border border-[#E8DCC4] cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-[#78350F] block">💡 Daily Vastu Energy Tips</span>
                    <span className="text-[11px] text-[#8B735B]">Actionable daily direction and Pancha Mahabhuta tips</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefDailyTips}
                    onChange={(e) => setPrefDailyTips(e.target.checked)}
                    className="w-4 h-4 accent-[#D97706] rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="py-12 text-center text-[#8B735B] space-y-2 bg-[#FAF7F2] rounded-2xl border border-dashed border-[#E8DCC4]">
              <Bell className="w-10 h-10 text-[#D97706]/40 mx-auto" />
              <p className="text-xs font-bold text-[#78350F]">No active push notifications found in this category.</p>
              <p className="text-[11px] text-[#8B735B]">New festival and auspicious muhurta alerts will arrive here automatically.</p>
            </div>
          ) : (
            /* Redesigned Clean Cultural Notification Cards */
            filteredAlerts.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all shadow-md flex flex-col gap-3 ${
                  !item.isRead
                    ? 'bg-gradient-to-br from-[#FFFDF9] to-[#FFF9EE] border-[#FDE68A] border-l-4 border-l-[#D97706]'
                    : 'bg-white border-[#E8DCC4] opacity-90 hover:opacity-100'
                }`}
              >
                {/* 1. Header Row: Badges & Sleek Controls */}
                <div className="flex items-center justify-between gap-2 border-b border-[#E8DCC4]/50 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] shadow-2xs flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#D97706]" />
                      {item.countdownText}
                    </span>

                    <span className="text-[11px] text-[#8B735B] font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#A68A64]" />
                      {item.dateLabel}
                    </span>

                    {!item.isRead && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded-full border border-[#FDE68A]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse" />
                        New
                      </span>
                    )}
                  </div>

                  {/* Top-Right Quick Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onToggleRead(item.id)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                        item.isRead
                          ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] hover:bg-[#D1FAE5]'
                          : 'bg-[#FAF7F2] border-[#E8DCC4] text-[#78350F] hover:bg-[#E8DCC4]'
                      }`}
                      title={item.isRead ? 'Mark as unread' : 'Mark as read'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDismissAlert(item.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center bg-[#FAF7F2] border border-[#E8DCC4] text-[#8B735B] hover:text-[#991B1B] hover:bg-[#FEF2F2] hover:border-[#FECACA] transition-all cursor-pointer"
                      title="Dismiss alert"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2. Main Content Row: Gradient Icon + Clean Typography (No Nested Card) */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs mt-0.5 ${
                      !item.isRead
                        ? 'bg-gradient-to-br from-[#D97706] to-[#B45309] text-white shadow-amber-900/20'
                        : 'bg-[#F3EFE0] text-[#78350F] border border-[#E8DCC4]'
                    }`}
                  >
                    {renderAlertCategoryIcon(item)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif font-bold text-sm sm:text-[15px] text-[#78350F] leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-xs text-[#5C4533] leading-relaxed mt-1">
                      {item.body}
                    </p>
                  </div>
                </div>

                {/* 3. Card Footer Action Bar */}
                <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-[#E8DCC4]/60">
                  <div className="text-[11px] text-[#8B735B] font-medium flex items-center gap-1.5 truncate">
                    <Sparkles className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                    <span className="truncate">
                      {item.targetTab === 'pooja'
                        ? 'Pooja Guide & Vidhi Steps'
                        : item.targetTab === 'muhurta'
                        ? 'Shubh Muhurta Calculator'
                        : item.targetTab === 'remedies'
                        ? 'Vastu Remedial Checklist'
                        : 'Vastu Compass Suite'}
                    </span>
                  </div>

                  {item.targetTab && (
                    <button
                      onClick={() => {
                        onNavigateToTab(item.targetTab!);
                        onToggleRead(item.id);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <span>Check Timings</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

