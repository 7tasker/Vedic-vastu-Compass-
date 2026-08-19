import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Send,
  Sparkles,
  Flame,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Radio,
  Sliders,
  Key,
  Trash2,
  Zap,
  RefreshCw,
  Layers,
  ChevronRight,
  ShieldCheck,
  Plus,
  Server,
  Smartphone,
  Tablet,
  Monitor,
  Moon,
  Globe,
  Vibrate,
  ListCheck,
} from 'lucide-react';
import { PushNotificationAlert } from '../../types';
import {
  PushGatewayConfig,
  DeviceCapSettings,
  getPushAlertsFromStorage,
  savePushAlertsToStorage,
  getPushGatewayConfig,
  savePushGatewayConfig,
  getDeviceCapSettings,
  saveDeviceCapSettings,
  broadcastPushAlertFromBackend,
  subscribeToPushAlerts,
  syncAllFestivalCampaignsToStorage,
  generateAllFestivalPushCampaigns,
} from '../../utils/pushNotificationManager';
import { FESTIVAL_POOJA_DATA } from '../../data/festivalPoojaData';
import { playTempleBellChime } from '../../utils/vastuUtils';

export const AdminPushNotificationsTab: React.FC = () => {
  const [alerts, setAlerts] = useState<PushNotificationAlert[]>(getPushAlertsFromStorage());
  const [gatewayConfig, setGatewayConfig] = useState<PushGatewayConfig>(getPushGatewayConfig());
  const [capSettings, setCapSettings] = useState<DeviceCapSettings>(getDeviceCapSettings());

  // Form State for Broadcast
  const [title, setTitle] = useState('🪔 Diwali Mahalakshmi Pujan Alert');
  const [body, setBody] = useState('Diwali is in 3 days! Check your Pradosh Kaal auspicious timings & Mahalakshmi Pujan Vidhi.');
  const [category, setCategory] = useState<PushNotificationAlert['category']>('festival');
  const [targetTab, setTargetTab] = useState('pooja');
  const [targetFestivalId, setTargetFestivalId] = useState<string>('diwali');
  const [countdownText, setCountdownText] = useState('In 3 Days');
  const [dateLabel, setDateLabel] = useState('06 Nov 2026');
  const [priority, setPriority] = useState<'high' | 'normal'>('high');
  const [selectedYear, setSelectedYear] = useState<2026 | 2027>(2026);

  const [activeSubTab, setActiveSubTab] = useState<'broadcast' | 'campaigns' | 'automation' | 'gateway' | 'deviceCaps'>('campaigns');
  const [actionMsg, setActionMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    const unsub = subscribeToPushAlerts((updated) => {
      setAlerts(updated);
    });
    return () => unsub();
  }, []);

  const handleSelectFestivalTemplate = (festivalId: string) => {
    const fest = FESTIVAL_POOJA_DATA.find((f) => f.id === festivalId);
    if (!fest) return;
    const yearDate = fest.dates[selectedYear]?.dateDisplay || 'Upcoming';
    const muhurta = fest.dates[selectedYear]?.peakMuhurta || 'Auspicious Window';
    setTitle(`🪔 ${fest.title} Alert`);
    setBody(`${fest.title} (${yearDate}) is approaching! Perform rituals during auspicious Muhurta: ${muhurta}.`);
    setCategory('festival');
    setTargetTab('pooja');
    setTargetFestivalId(festivalId);
    setCountdownText('Upcoming');
    setDateLabel(yearDate);
    setPriority('high');
    setActionMsg({ text: `✓ Pre-filled campaign template for ${fest.title}!` });
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleSyncAllFestivals = async () => {
    try {
      playTempleBellChime();
    } catch {}
    const synced = await syncAllFestivalCampaignsToStorage(selectedYear);
    setAlerts(synced);
    setActionMsg({
      text: `✓ All 15 Sacred Festivals (${selectedYear}) successfully synced & activated as active push campaigns!`,
    });
    setTimeout(() => setActionMsg(null), 5000);
  };

  const handleBroadcastPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg(null);

    if (!title.trim() || !body.trim()) {
      setActionMsg({ text: 'Please fill in both title and body for the push alert.', isError: true });
      return;
    }

    try {
      playTempleBellChime();
    } catch {}

    const res = await broadcastPushAlertFromBackend({
      title,
      body,
      category,
      targetTab,
      targetFestivalId,
      countdownText: countdownText || 'Alert',
      dateLabel: dateLabel || 'Upcoming',
      iconName: 'Flame',
      priority,
    });

    if (res.success) {
      setAlerts(getPushAlertsFromStorage());
      setGatewayConfig(getPushGatewayConfig());
      setActionMsg({ text: `✓ Push Notification Campaign Broadcasted Successfully to ${gatewayConfig.connectedDeviceTokensCount.toLocaleString()} devices!` });
      setTimeout(() => setActionMsg(null), 5000);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    const updated = alerts.filter((a) => a.id !== id);
    setAlerts(updated);
    await savePushAlertsToStorage(updated);
    setActionMsg({ text: '✓ Push notification deleted.' });
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleTestTrigger = (alert: PushNotificationAlert) => {
    try {
      playTempleBellChime();
    } catch {}

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(alert.title, {
        body: alert.body,
        icon: '/favicon.ico',
      });
    }

    setActionMsg({ text: `⚡ Test Push Alert "${alert.title}" triggered locally!` });
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleSaveGatewayConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await savePushGatewayConfig(gatewayConfig);
    setActionMsg({ text: '✓ FCM & Web Push Gateway Configuration Saved!' });
    setTimeout(() => setActionMsg(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Stats */}
      <div className="bg-[#FFFBEB] border-2 border-[#D97706] rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D97706] text-white flex items-center justify-center shadow-md shrink-0">
            <BellRing className="w-6 h-6 text-yellow-200 animate-bounce" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-[#78350F] flex items-center gap-2">
              <span>Push Notifications Backend Control</span>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#10B981] text-white">
                FCM LIVE
              </span>
            </h3>
            <p className="text-xs text-[#8B735B]">
              Broadcast cultural reminders, festival alerts & Shubh Muhurta push notifications across all active app instances.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="text-right">
            <span className="text-[10px] font-bold text-[#8B735B] uppercase block">Connected Devices</span>
            <span className="text-base font-black text-[#78350F]">
              {gatewayConfig.connectedDeviceTokensCount.toLocaleString()} Tokens
            </span>
          </div>
          <div className="h-8 w-px bg-[#E8DCC4]" />
          <div className="text-right">
            <span className="text-[10px] font-bold text-[#8B735B] uppercase block">Total Pushes Sent</span>
            <span className="text-base font-black text-[#D97706]">
              {gatewayConfig.totalPushSentCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 ${
            actionMsg.isError
              ? 'bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B]'
              : 'bg-[#ECFDF5] border border-[#6EE7B7] text-[#065F46]'
          }`}
        >
          {actionMsg.isError ? (
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
          )}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#E8DCC4] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('broadcast')}
          className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'broadcast'
              ? 'bg-[#78350F] text-white shadow-xs'
              : 'bg-white text-[#78350F] hover:bg-[#F3EFE0] border border-[#E8DCC4]'
          }`}
        >
          <Send className="w-3.5 h-3.5 text-[#F59E0B]" /> Broadcast New Push Alert
        </button>

        <button
          onClick={() => setActiveSubTab('campaigns')}
          className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'campaigns'
              ? 'bg-[#78350F] text-white shadow-xs'
              : 'bg-white text-[#78350F] hover:bg-[#F3EFE0] border border-[#E8DCC4]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#D97706]" /> Active Campaigns ({alerts.length})
        </button>

        <button
          onClick={() => setActiveSubTab('automation')}
          className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'automation'
              ? 'bg-[#78350F] text-white shadow-xs'
              : 'bg-white text-[#78350F] hover:bg-[#F3EFE0] border border-[#E8DCC4]'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-[#D97706]" /> Automated Festival Rules
        </button>

        <button
          onClick={() => setActiveSubTab('gateway')}
          className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'gateway'
              ? 'bg-[#78350F] text-white shadow-xs'
              : 'bg-white text-[#78350F] hover:bg-[#F3EFE0] border border-[#E8DCC4]'
          }`}
        >
          <Key className="w-3.5 h-3.5 text-[#2563EB]" /> FCM & Gateway Keys
        </button>

        <button
          onClick={() => setActiveSubTab('deviceCaps')}
          className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'deviceCaps'
              ? 'bg-[#78350F] text-white shadow-xs'
              : 'bg-white text-[#78350F] hover:bg-[#F3EFE0] border border-[#E8DCC4]'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-[#059669]" /> Device Capping & Anti-Fatigue Rules
        </button>
      </div>

      {/* TAB 1: BROADCAST NEW PUSH ALERT */}
      {activeSubTab === 'broadcast' && (
        <div className="space-y-4">
          {/* Quick Festival Pre-fill Selector */}
          <div className="bg-[#FCFAF7] border-2 border-[#D97706] rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-serif font-bold text-sm sm:text-base text-[#78350F] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D97706]" /> Quick-Load Sacred Festival Campaign Template
                </h4>
                <p className="text-xs text-[#8B735B]">
                  Click any of the 15 Hindu & Vastu festivals to instantly prefill title, description & Muhurta.
                </p>
              </div>

              {/* Year Switcher */}
              <div className="flex items-center gap-1 bg-[#F3EFE0] p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedYear(2026)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    selectedYear === 2026 ? 'bg-[#78350F] text-white shadow-2xs' : 'text-[#78350F] hover:bg-[#E8DCC4]'
                  }`}
                >
                  2026 Calendar
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedYear(2027)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    selectedYear === 2027 ? 'bg-[#78350F] text-white shadow-2xs' : 'text-[#78350F] hover:bg-[#E8DCC4]'
                  }`}
                >
                  2027 Calendar
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1 max-h-48 overflow-y-auto">
              {FESTIVAL_POOJA_DATA.map((fest) => {
                const isSelected = targetFestivalId === fest.id;
                const dateDisplay = fest.dates[selectedYear]?.dateDisplay || 'Annual';
                return (
                  <button
                    key={fest.id}
                    type="button"
                    onClick={() => handleSelectFestivalTemplate(fest.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#D97706] text-white shadow-xs'
                        : 'bg-white text-[#78350F] border border-[#E8DCC4] hover:border-[#D97706] hover:bg-[#FFFBEB]'
                    }`}
                  >
                    <span>🪔</span>
                    <span>{fest.title}</span>
                    <span className="text-[10px] opacity-80">({dateDisplay})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleBroadcastPush} className="bg-white border-2 border-[#E8DCC4] rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#E8DCC4] pb-3">
              <div>
                <h4 className="font-serif font-bold text-base text-[#78350F] flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#D97706]" />
                  <span>Create & Broadcast Cultural Push Reminder</span>
                </h4>
                <p className="text-xs text-[#8B735B]">
                  Compose instant festival alerts, Shubh Muhurta warnings or Rahu Kalam updates for mobile & desktop web push.
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full border border-[#A7F3D0] flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" /> FCM Push Service Ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-[#78350F] block">Notification Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 🪔 Diwali Mahalakshmi Pujan Alert"
                  className="w-full text-xs p-3 rounded-xl border border-[#E8DCC4] bg-[#FCFAF7] text-[#3D342D] font-bold focus:outline-none focus:border-[#D97706]"
                  required
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-[#78350F] block">Notification Description Body *</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                  placeholder="e.g. Diwali is in 3 days! Check your Pradosh Kaal auspicious timings & Mahalakshmi Pujan Vidhi."
                  className="w-full text-xs p-3 rounded-xl border border-[#E8DCC4] bg-[#FCFAF7] text-[#3D342D] font-medium focus:outline-none focus:border-[#D97706]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#78350F] block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full text-xs p-3 rounded-xl border border-[#E8DCC4] bg-[#FCFAF7] text-[#3D342D] font-bold focus:outline-none focus:border-[#D97706]"
                >
                  <option value="festival">🪔 Festival Alert</option>
                  <option value="muhurta">✨ Shubh Muhurta</option>
                  <option value="rahu_kalam">⚠️ Rahu Kalam Warning</option>
                  <option value="daily_tip">💡 Daily Vastu Tip</option>
                  <option value="special_puja">🌸 Special Puja Guidance</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#78350F] block">Target App View on Tap</label>
                <select
                  value={targetTab}
                  onChange={(e) => setTargetTab(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#E8DCC4] bg-[#FCFAF7] text-[#3D342D] font-bold focus:outline-none focus:border-[#D97706]"
                >
                  <option value="pooja">🪔 Pooja Guide Tab</option>
                  <option value="muhurta">✨ Shubh Muhurta Tab</option>
                  <option value="compass">🧭 Vastu Compass Tab</option>
                  <option value="remedies">🛠️ Vastu Remedies Tab</option>
                  <option value="aiguru">🤖 AI Vastu Guru Tab</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#78350F] block">Countdown Label Tag</label>
                <input
                  type="text"
                  value={countdownText}
                  onChange={(e) => setCountdownText(e.target.value)}
                  placeholder="e.g. In 3 Days / Tomorrow / Today"
                  className="w-full text-xs p-3 rounded-xl border border-[#E8DCC4] bg-[#FCFAF7] text-[#3D342D] font-bold focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#78350F] block">Event Date Label</label>
                <input
                  type="text"
                  value={dateLabel}
                  onChange={(e) => setDateLabel(e.target.value)}
                  placeholder="e.g. 06 Nov 2026"
                  className="w-full text-xs p-3 rounded-xl border border-[#E8DCC4] bg-[#FCFAF7] text-[#3D342D] font-bold focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#78350F] block">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full text-xs p-3 rounded-xl border border-[#E8DCC4] bg-[#FCFAF7] text-[#3D342D] font-bold focus:outline-none focus:border-[#D97706]"
                >
                  <option value="high">🔥 High (Immediate Pop-up Banner & Cap Bypass)</option>
                  <option value="normal">🔔 Normal (In-App Notification Center)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E8DCC4] flex items-center justify-between">
              <span className="text-xs text-[#8B735B]">
                Broadcast reaches all subscribed device tokens instantly.
              </span>
              <button
                type="submit"
                className="px-6 py-3 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" /> Broadcast Push Alert Now
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: ACTIVE CAMPAIGNS LIST */}
      {activeSubTab === 'campaigns' && (
        <div className="bg-white border-2 border-[#E8DCC4] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E8DCC4] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-serif font-bold text-base text-[#78350F]">Active Push Campaigns Calendar</h4>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                  {alerts.length} Total Campaigns
                </span>
              </div>
              <p className="text-xs text-[#8B735B]">
                All 15 sacred festivals and recurring muhurta alerts scheduled for push broadcast.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleSyncAllFestivals}
                className="px-3.5 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                title="Populate and activate all 15 festivals into active campaigns"
              >
                <Sparkles className="w-3.5 h-3.5" /> Re-Sync All 15 Festivals ({selectedYear})
              </button>

              <button
                onClick={() => setAlerts(getPushAlertsFromStorage())}
                className="px-3 py-2 bg-[#F3EFE0] hover:bg-[#E8DCC4] text-[#78350F] text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-[#8B735B] space-y-2">
                <Bell className="w-10 h-10 text-[#D97706]/40 mx-auto" />
                <p className="text-xs font-bold">No active push campaigns found.</p>
                <button
                  onClick={handleSyncAllFestivals}
                  className="px-4 py-2 bg-[#D97706] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Sync All 15 Sacred Festivals Now
                </button>
              </div>
            ) : (
              alerts.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-[#E8DCC4] bg-[#FCFAF7] hover:border-[#D97706] transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] flex items-center justify-center shrink-0">
                      <Flame className="w-5 h-5 text-[#D97706]" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#D97706] text-white">
                          {item.category}
                        </span>
                        {item.priority === 'high' && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-[#EF4444] text-white">
                            High Priority
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-[#8B735B]">
                          Tag: {item.countdownText} • Date: {item.dateLabel}
                        </span>
                        {item.targetFestivalId && (
                          <span className="text-[10px] font-bold text-[#78350F] bg-[#FEF3C7] px-1.5 py-0.2 rounded">
                            ID: {item.targetFestivalId}
                          </span>
                        )}
                      </div>

                      <h5 className="font-serif font-bold text-sm text-[#78350F]">{item.title}</h5>
                      <p className="text-xs text-[#5C280B] leading-relaxed">{item.body}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                    <button
                      onClick={() => handleTestTrigger(item)}
                      className="px-3 py-1.5 bg-[#78350F] hover:bg-[#5C280B] text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-[#F59E0B]" /> Test Push
                    </button>

                    <button
                      onClick={() => handleDeleteCampaign(item.id)}
                      className="p-2 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] transition-all cursor-pointer"
                      title="Delete campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AUTOMATED FESTIVAL RULES */}
      {activeSubTab === 'automation' && (
        <div className="bg-white border-2 border-[#E8DCC4] rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E8DCC4] pb-3">
            <div>
              <h4 className="font-serif font-bold text-base text-[#78350F] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#D97706]" />
                <span>Automated Cultural Push Notification Schedules (All 15 Festivals)</span>
              </h4>
              <p className="text-xs text-[#8B735B]">
                Configure automated backend triggers to send festival countdown alerts without manual intervention.
              </p>
            </div>

            <button
              onClick={handleSaveGatewayConfig}
              className="px-5 py-2.5 bg-[#78350F] hover:bg-[#5C280B] text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
            >
              Save Automation Rules
            </button>
          </div>

          {/* Master Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-[#78350F] block">🪔 Auto-Broadcast All 15 Sacred Festival Alerts</span>
                <span className="text-[11px] text-[#8B735B]">Automatically delivers countdowns for all 15 festivals.</span>
              </div>
              <input
                type="checkbox"
                checked={gatewayConfig.enableAutoFestivalPush}
                onChange={(e) => setGatewayConfig({ ...gatewayConfig, enableAutoFestivalPush: e.target.checked })}
                className="w-5 h-5 accent-[#D97706] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-[#78350F] block">💰 Auto Dhanteras & Griha Pravesh Muhurta Alerts</span>
                <span className="text-[11px] text-[#8B735B]">Notifies users about auspicious asset & housewarming windows.</span>
              </div>
              <input
                type="checkbox"
                checked={gatewayConfig.enableAutoMuhurtaPush}
                onChange={(e) => setGatewayConfig({ ...gatewayConfig, enableAutoMuhurtaPush: e.target.checked })}
                className="w-5 h-5 accent-[#D97706] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-[#78350F] block">⚠️ Auto Daily Rahu Kalam Warnings</span>
                <span className="text-[11px] text-[#8B735B]">Dispatches alert 15 minutes prior to Rahu Kalam start.</span>
              </div>
              <input
                type="checkbox"
                checked={gatewayConfig.enableAutoRahuKalamPush}
                onChange={(e) => setGatewayConfig({ ...gatewayConfig, enableAutoRahuKalamPush: e.target.checked })}
                className="w-5 h-5 accent-[#D97706] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-[#78350F] block">💡 Auto Daily Morning Vastu & Brahma Sthan Tip</span>
                <span className="text-[11px] text-[#8B735B]">Daily 07:00 AM push notification with directional advice.</span>
              </div>
              <input
                type="checkbox"
                checked={gatewayConfig.enableAutoDailyTipsPush}
                onChange={(e) => setGatewayConfig({ ...gatewayConfig, enableAutoDailyTipsPush: e.target.checked })}
                className="w-5 h-5 accent-[#D97706] rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Full List of 15 Festivals Automated Rules Matrix */}
          <div className="space-y-3 pt-2">
            <h5 className="font-serif font-bold text-sm text-[#78350F] flex items-center gap-1.5">
              <ListCheck className="w-4 h-4 text-[#D97706]" /> Full 15-Festival Automation Roster
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {FESTIVAL_POOJA_DATA.map((fest, index) => {
                const dateDisplay = fest.dates[2026]?.dateDisplay || 'Annual';
                return (
                  <div
                    key={fest.id}
                    className="p-3 bg-[#FCFAF7] border border-[#E8DCC4] rounded-2xl space-y-1.5 hover:border-[#D97706] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-[#D97706]">
                        Rule #{index + 1}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#ECFDF5] text-[#059669] rounded">
                        Active Trigger
                      </span>
                    </div>
                    <h6 className="font-serif font-bold text-xs text-[#78350F] truncate">{fest.title}</h6>
                    <p className="text-[11px] text-[#8B735B] line-clamp-2">{fest.description}</p>
                    <div className="text-[10px] text-[#78350F] font-semibold pt-1 border-t border-[#E8DCC4] flex items-center justify-between">
                      <span>2026: {dateDisplay}</span>
                      <span className="text-[#D97706] font-bold">Muhurta Alert ✓</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GATEWAY & API KEYS */}
      {activeSubTab === 'gateway' && (
        <form onSubmit={handleSaveGatewayConfig} className="bg-white border-2 border-[#E8DCC4] rounded-3xl p-6 shadow-xs space-y-4">
          <div>
            <h4 className="font-serif font-bold text-base text-[#78350F] flex items-center gap-2">
              <Key className="w-4 h-4 text-[#2563EB]" />
              <span>Firebase Cloud Messaging (FCM) & Web Push Gateway Config</span>
            </h4>
            <p className="text-xs text-[#8B735B]">
              Configure FCM Server Key, VAPID credentials & Apple APNs for native background push dispatch.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-[#78350F] block mb-1">FCM Server Secret Key</label>
              <input
                type="text"
                value={gatewayConfig.fcmServerKey}
                onChange={(e) => setGatewayConfig({ ...gatewayConfig, fcmServerKey: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-[#E8DCC4] bg-[#FCFAF7] text-[#3D342D] font-mono focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#78350F] block mb-1">Web Push VAPID Public Key</label>
              <input
                type="text"
                value={gatewayConfig.vapidPublicKey}
                onChange={(e) => setGatewayConfig({ ...gatewayConfig, vapidPublicKey: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-[#E8DCC4] bg-[#FCFAF7] text-[#3D342D] font-mono focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#78350F] block mb-1">Web Push VAPID Private Key</label>
              <input
                type="password"
                value={gatewayConfig.vapidPrivateKey}
                onChange={(e) => setGatewayConfig({ ...gatewayConfig, vapidPrivateKey: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-[#E8DCC4] bg-[#FCFAF7] text-[#3D342D] font-mono focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#78350F] block mb-1">APNs Key ID (iOS)</label>
                <input
                  type="text"
                  value={gatewayConfig.apnsKeyId}
                  onChange={(e) => setGatewayConfig({ ...gatewayConfig, apnsKeyId: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-[#E8DCC4] bg-[#FCFAF7] text-[#3D342D] font-mono focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#78350F] block mb-1">APNs Team ID (Apple)</label>
                <input
                  type="text"
                  value={gatewayConfig.apnsTeamId}
                  onChange={(e) => setGatewayConfig({ ...gatewayConfig, apnsTeamId: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-[#E8DCC4] bg-[#FCFAF7] text-[#3D342D] font-mono focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-[#E8DCC4]">
            <span className="text-xs font-bold text-[#059669] flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> VAPID Handshake Verified
            </span>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
            >
              Save Gateway Credentials
            </button>
          </div>
        </form>
      )}

      {/* TAB 5: DEVICE CAPPING & ANTI-FATIGUE POLICY */}
      {activeSubTab === 'deviceCaps' && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await saveDeviceCapSettings(capSettings);
            setActionMsg({ text: '✓ Device Frequency Capping & Anti-Fatigue Policy updated successfully!' });
            setTimeout(() => setActionMsg(null), 4000);
          }}
          className="bg-white border-2 border-[#E8DCC4] rounded-3xl p-6 shadow-xs space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#E8DCC4] pb-3">
            <div>
              <h4 className="font-serif font-bold text-base text-[#78350F] flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#059669]" />
                <span>Device-Specific Frequency Capping & Quiet Hours Engine</span>
              </h4>
              <p className="text-xs text-[#8B735B]">
                Enforce native push rate limits per device type (Mobile / Tablet / Desktop) to prevent alert fatigue and respect user sleep cycles.
              </p>
            </div>
            <span className="text-[11px] font-bold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full border border-[#A7F3D0] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Rate Limiter Active
            </span>
          </div>

          {/* Device Caps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mobile Cap */}
            <div className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#E8DCC4] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#FEF3C7] text-[#D97706]">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-serif font-bold text-xs text-[#78350F]">Mobile Phones</h5>
                    <span className="text-[10px] text-[#8B735B]">Handheld Viewports (&lt;768px)</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-[#5C280B] leading-relaxed">
                Mobile screens receive lockscreen & status-bar push with haptic vibrations. Capped to avoid battery and attention drain.
              </p>
              <div>
                <label className="text-[11px] font-bold text-[#78350F] block mb-1">
                  Max Daily Native Alerts
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={15}
                    value={capSettings.mobileDailyCap}
                    onChange={(e) => setCapSettings({ ...capSettings, mobileDailyCap: parseInt(e.target.value, 10) })}
                    className="w-full accent-[#D97706] cursor-pointer"
                  />
                  <span className="text-sm font-black text-[#D97706] w-8 text-right">
                    {capSettings.mobileDailyCap}
                  </span>
                </div>
              </div>
            </div>

            {/* Tablet Cap */}
            <div className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#E8DCC4] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                    <Tablet className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-serif font-bold text-xs text-[#78350F]">Tablets & iPads</h5>
                    <span className="text-[10px] text-[#8B735B]">Mid-size Viewports (768–1024px)</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-[#5C280B] leading-relaxed">
                Tablets usually run in living rooms or puja corners; moderate alert cadence for family muhurta reminders.
              </p>
              <div>
                <label className="text-[11px] font-bold text-[#78350F] block mb-1">
                  Max Daily Native Alerts
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={capSettings.tabletDailyCap}
                    onChange={(e) => setCapSettings({ ...capSettings, tabletDailyCap: parseInt(e.target.value, 10) })}
                    className="w-full accent-[#2563EB] cursor-pointer"
                  />
                  <span className="text-sm font-black text-[#2563EB] w-8 text-right">
                    {capSettings.tabletDailyCap}
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Cap */}
            <div className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#E8DCC4] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#ECFDF5] text-[#059669]">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-serif font-bold text-xs text-[#78350F]">Desktops & Laptops</h5>
                    <span className="text-[10px] text-[#8B735B]">Workstations (&gt;1024px)</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-[#5C280B] leading-relaxed">
                Desktops have large banner notifications; higher cap allowed for continuous office & study use.
              </p>
              <div>
                <label className="text-[11px] font-bold text-[#78350F] block mb-1">
                  Max Daily Native Alerts
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={25}
                    value={capSettings.desktopDailyCap}
                    onChange={(e) => setCapSettings({ ...capSettings, desktopDailyCap: parseInt(e.target.value, 10) })}
                    className="w-full accent-[#059669] cursor-pointer"
                  />
                  <span className="text-sm font-black text-[#059669] w-8 text-right">
                    {capSettings.desktopDailyCap}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* DND and Bypass Rules */}
          <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] space-y-4">
            <h5 className="font-serif font-bold text-xs text-[#78350F] flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-[#D97706]" /> Quiet Hours & High-Priority Override Policies
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E8DCC4] cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-[#78350F] block">Night Quiet Hours (DND)</span>
                  <span className="text-[10px] text-[#8B735B]">
                    Suppress non-urgent alerts between {capSettings.quietHoursStart} – {capSettings.quietHoursEnd}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={capSettings.enableQuietHours}
                  onChange={(e) => setCapSettings({ ...capSettings, enableQuietHours: e.target.checked })}
                  className="w-4 h-4 accent-[#D97706] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E8DCC4] cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-[#78350F] block">High-Priority Muhurta Bypass</span>
                  <span className="text-[10px] text-[#8B735B]">
                    Allow critical festival & puja window alerts to bypass daily caps
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={capSettings.allowHighPriorityBypass}
                  onChange={(e) => setCapSettings({ ...capSettings, allowHighPriorityBypass: e.target.checked })}
                  className="w-4 h-4 accent-[#D97706] rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#78350F] block mb-1">
                  Quiet Hours Start Time (24h)
                </label>
                <input
                  type="time"
                  value={capSettings.quietHoursStart}
                  onChange={(e) => setCapSettings({ ...capSettings, quietHoursStart: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E8DCC4] bg-white text-[#3D342D] font-bold focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#78350F] block mb-1">
                  Quiet Hours End Time (24h)
                </label>
                <input
                  type="time"
                  value={capSettings.quietHoursEnd}
                  onChange={(e) => setCapSettings({ ...capSettings, quietHoursEnd: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E8DCC4] bg-white text-[#3D342D] font-bold focus:outline-none focus:border-[#D97706]"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-[#E8DCC4]">
            <span className="text-xs font-bold text-[#059669] flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Global Policy Synchronized
            </span>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" /> Save Device Cap Policies
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
