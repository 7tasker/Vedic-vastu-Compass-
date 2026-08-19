import React, { useState, useEffect } from 'react';
import {
  AppBrandingConfig,
  MenuItemConfig,
  ThemeConfig,
  getAppBrandingConfig,
  fetchAppBrandingFromFirestore,
  saveAppBrandingConfig,
  getMenuNavigationConfig,
  saveMenuNavigationConfig,
  getThemeConfig,
  saveThemeConfig,
} from '../../utils/appCustomization';
import {
  Compass,
  Home,
  Wrench,
  Calendar,
  Layers,
  Bot,
  Sparkles,
  Sun,
  Flame,
  BookOpen,
  ShieldCheck,
  Save,
  CheckCircle2,
  RefreshCw,
  Palette,
  Type,
  Layout,
  Smartphone,
  Upload,
  Trash2,
} from 'lucide-react';
import { playTempleBellChime } from '../../utils/vastuUtils';

interface AdminBrandingThemeTabProps {
  onNotify: (msg: string) => void;
}

const AVAILABLE_ICONS = [
  { id: 'Compass', name: 'Compass', Icon: Compass },
  { id: 'Home', name: 'Home / Audit', Icon: Home },
  { id: 'Wrench', name: 'Wrench / Remedy', Icon: Wrench },
  { id: 'Kalasham', name: 'Kalasham (Pooja)', Icon: Flame },
  { id: 'Calendar', name: 'Calendar / Muhurta', Icon: Calendar },
  { id: 'Layers', name: 'Layers / Mandala', Icon: Layers },
  { id: 'Bot', name: 'AI Bot / Guru', Icon: Bot },
  { id: 'Sparkles', name: 'Sparkles / Sacred', Icon: Sparkles },
  { id: 'Sun', name: 'Sun / Surya', Icon: Sun },
  { id: 'Flame', name: 'Sacred Agni Flame', Icon: Flame },
  { id: 'BookOpen', name: 'Veda Book', Icon: BookOpen },
  { id: 'ShieldCheck', name: 'Shield / Armor', Icon: ShieldCheck },
];

const PRESET_APP_ICONS = [
  { id: 'compass', label: '16-Zone Compass', Icon: Compass },
  { id: 'kalasham', label: 'Mangal Kalasham', Icon: Flame },
  { id: 'trishul', label: 'Vedic Trishul', Icon: Sparkles },
  { id: 'om', label: 'Sacred Om', Icon: Sun },
  { id: 'lotus', label: 'Padma Lotus', Icon: Layers },
  { id: 'temple', label: 'Temple Spire', Icon: Home },
  { id: 'custom', label: 'Custom Upload', Icon: Upload },
];

export const AdminBrandingThemeTab: React.FC<AdminBrandingThemeTabProps> = ({ onNotify }) => {
  const [branding, setBranding] = useState<AppBrandingConfig>(getAppBrandingConfig());
  const [menuItems, setMenuItems] = useState<MenuItemConfig[]>(getMenuNavigationConfig());
  const [theme, setTheme] = useState<ThemeConfig>(getThemeConfig());
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchAppBrandingFromFirestore().then((latestBranding) => {
      setBranding(latestBranding);
    });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image file size exceeds 5MB. Please choose a smaller icon file.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawUrl = event.target?.result as string;
        if (rawUrl) {
          // Resize image on canvas to max 256x256 to ensure light base64 payload for Firestore
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDim = 256;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedUrl = canvas.toDataURL('image/png', 0.85);
              setBranding((prev) => ({
                ...prev,
                appIconId: 'custom',
                customIconUrl: compressedUrl,
              }));
            } else {
              setBranding((prev) => ({
                ...prev,
                appIconId: 'custom',
                customIconUrl: rawUrl,
              }));
            }
          };
          img.onerror = () => {
            setBranding((prev) => ({
              ...prev,
              appIconId: 'custom',
              customIconUrl: rawUrl,
            }));
          };
          img.src = rawUrl;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    playTempleBellChime();

    const ok1 = await saveAppBrandingConfig(branding);
    const ok2 = await saveMenuNavigationConfig(menuItems);
    const ok3 = await saveThemeConfig(theme);

    setSaving(false);
    if (ok1 && ok2 && ok3) {
      onNotify('✓ Saved & Synced App Branding, Custom App Icon & Theme to Firestore Backend.');
    } else {
      onNotify('✓ Saved App Icon & Branding to local storage.');
    }
    window.dispatchEvent(new Event('vastu_config_updated'));
  };

  const updateMenuItem = (id: string, field: keyof MenuItemConfig, value: any) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8DCC4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
              Backend Customizer
            </span>
            <span className="text-xs text-[#059669] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Dynamic Live App Sync
            </span>
          </div>
          <h3 className="text-xl font-serif font-bold text-[#78350F] mt-1">
            App Icon, Menu Bar Icons & Theme Backend
          </h3>
          <p className="text-xs text-[#8B735B]">
            Customize app branding, icons, bottom navigation menu labels, colors, and typography settings across the application.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-5 py-3 bg-[#78350F] hover:bg-[#5C280B] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
          ) : (
            <Save className="w-4 h-4 text-amber-300" />
          )}
          <span>{saving ? 'Saving Customizations...' : 'Save All Branding & Themes'}</span>
        </button>
      </div>

      {/* SECTION 1: APP ICON & BRANDING CUSTOMIZATION */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8DCC4] shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-[#E8DCC4] pb-3">
          <Smartphone className="w-5 h-5 text-[#D97706]" />
          <h4 className="text-base font-serif font-bold text-[#78350F]">
            1. App Icon & Header Branding Settings
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#8B735B] mb-1">
                Application Name
              </label>
              <input
                type="text"
                value={branding.appName}
                onChange={(e) => setBranding({ ...branding, appName: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl font-serif font-bold text-[#78350F] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#8B735B] mb-1">
                App Tagline / Subtitle
              </label>
              <input
                type="text"
                value={branding.appTagline}
                onChange={(e) => setBranding({ ...branding, appTagline: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl text-[#3D342D] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#8B735B] mb-2">
                Select Main App Icon Symbol
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_APP_ICONS.map((iconOpt) => {
                  const IconComp = iconOpt.Icon;
                  return (
                    <button
                      key={iconOpt.id}
                      type="button"
                      onClick={() =>
                        setBranding({ ...branding, appIconId: iconOpt.id as any })
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                        branding.appIconId === iconOpt.id
                          ? 'bg-[#78350F] text-white border-[#78350F] shadow-xs'
                          : 'bg-[#FAF7F2] text-[#8B735B] border-[#E8DCC4] hover:bg-[#F3EFE0]'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          branding.appIconId === iconOpt.id
                            ? 'bg-[#D97706] text-white'
                            : 'bg-[#E8DCC4] text-[#78350F]'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold truncate">{iconOpt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {branding.appIconId === 'custom' && (
              <div className="bg-[#FFFBEB] p-4 rounded-2xl border border-[#FDE68A] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#78350F]">
                    Upload Custom App Icon Image
                  </label>
                  <span className="text-[10px] text-[#8B735B]">PNG, JPG, SVG, WEBP (Max 3MB)</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="w-full sm:w-auto flex-1 cursor-pointer bg-white border-2 border-dashed border-[#D97706]/40 hover:border-[#D97706] p-3 rounded-xl flex items-center justify-center gap-2 text-xs text-[#78350F] font-bold transition-all shadow-2xs">
                    <Upload className="w-4 h-4 text-[#D97706]" />
                    <span>Upload Local Image File...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {branding.customIconUrl && (
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#E8DCC4] shadow-2xs shrink-0">
                      <img
                        src={branding.customIconUrl}
                        alt="Uploaded App Icon"
                        className="w-8 h-8 rounded-full object-cover border border-[#E8DCC4]"
                        onError={(e) => ((e.target as any).src = '')}
                      />
                      <button
                        type="button"
                        onClick={() => setBranding({ ...branding, customIconUrl: '' })}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Remove Image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#8B735B] mb-1">
                    Or Enter Image Web URL:
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com/my-app-icon.png"
                    value={branding.customIconUrl}
                    onChange={(e) => setBranding({ ...branding, customIconUrl: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E8DCC4] rounded-lg text-[#3D342D] focus:outline-none focus:ring-1 focus:ring-[#D97706]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Live Header & Icon Preview */}
          <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8DCC4] flex flex-col justify-center space-y-3">
            <span className="text-[10px] uppercase font-bold text-[#8B735B] tracking-wider">
              Live Top Navigation Bar Preview
            </span>
            <div className="bg-[#78350F] p-3 rounded-2xl text-white flex items-center gap-3 shadow-md border border-[#5C280B]">
              <div className="w-9 h-9 rounded-full bg-[#D97706] text-white flex items-center justify-center font-serif font-bold text-lg shadow-sm border border-white/20 shrink-0">
                {branding.appIconId === 'compass' && <Compass className="w-5 h-5 text-white" />}
                {branding.appIconId === 'kalasham' && <Flame className="w-5 h-5 text-white" />}
                {branding.appIconId === 'trishul' && <Sparkles className="w-5 h-5 text-white" />}
                {branding.appIconId === 'om' && <Sun className="w-5 h-5 text-white" />}
                {branding.appIconId === 'lotus' && <Layers className="w-5 h-5 text-white" />}
                {branding.appIconId === 'temple' && <Home className="w-5 h-5 text-white" />}
                {branding.appIconId === 'custom' && branding.customIconUrl ? (
                  <img
                    src={branding.customIconUrl}
                    alt="App Icon"
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => ((e.target as any).src = '')}
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-serif font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
                  <span>{branding.appName || 'Vastu Compass'}</span>
                  <span className="text-[8px] font-sans font-extrabold px-1.5 py-0.2 rounded-full bg-[#D97706] text-white uppercase tracking-wider">
                    Vedic
                  </span>
                </h1>
                <p className="text-[9px] uppercase tracking-wider text-[#E8DCC4] font-sans font-medium mt-0.5 truncate">
                  {branding.appTagline || 'Vedic Harmony & Alignment'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: MENU NAVIGATION ICONS & LABELS CUSTOMIZER */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8DCC4] shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-[#E8DCC4] pb-3">
          <Layout className="w-5 h-5 text-[#D97706]" />
          <h4 className="text-base font-serif font-bold text-[#78350F]">
            2. Menu Navigation Bar Icons & Labels Settings
          </h4>
        </div>

        <p className="text-xs text-[#8B735B]">
          Edit bottom navigation labels, enable/disable tabs, or change menu icons dynamically.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all ${
                item.isCenterFeatured
                  ? 'bg-[#FEF3C7] border-[#D97706] shadow-2xs'
                  : 'bg-[#FAF7F2] border-[#E8DCC4]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-serif font-bold text-[#78350F] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
                  Tab ID: {item.id}
                  {item.isCenterFeatured && (
                    <span className="px-1.5 py-0.2 bg-[#D97706] text-white text-[8px] font-extrabold uppercase rounded-full">
                      Middle Prominent
                    </span>
                  )}
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(e) => updateMenuItem(item.id, 'enabled', e.target.checked)}
                    className="accent-[#78350F] rounded"
                  />
                  <span className="text-[10px] font-bold text-[#8B735B]">Visible</span>
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#8B735B] mb-1">
                    Display Label
                  </label>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateMenuItem(item.id, 'label', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8DCC4] rounded-lg font-bold text-[#78350F]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#8B735B] mb-1">
                    Icon Choice
                  </label>
                  <select
                    value={item.iconName}
                    onChange={(e) => updateMenuItem(item.id, 'iconName', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8DCC4] rounded-lg text-[#3D342D]"
                  >
                    {AVAILABLE_ICONS.map((icon) => (
                      <option key={icon.id} value={icon.id}>
                        {icon.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: THEME & TYPOGRAPHY SETTINGS */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8DCC4] shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-[#E8DCC4] pb-3">
          <Palette className="w-5 h-5 text-[#D97706]" />
          <h4 className="text-base font-serif font-bold text-[#78350F]">
            3. Theme Palette & Font Style Backend Settings
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-[#8B735B] mb-2 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-[#D97706]" /> Menu Gradient Theme Preset
            </label>
            <select
              value={theme.gradientPreset}
              onChange={(e) => setTheme({ ...theme, gradientPreset: e.target.value as any })}
              className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl text-[#78350F] font-bold"
            >
              <option value="orange_terracotta">Orange Sunset Terracotta (Default)</option>
              <option value="golden_amber">Golden Amber Vedic</option>
              <option value="royal_saffron">Royal Saffron Gold</option>
              <option value="emerald_temple">Emerald Sacred Temple</option>
              <option value="crimson_divine">Crimson Festival Red</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8B735B] mb-2 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-[#D97706]" /> App Typography Font Family
            </label>
            <select
              value={theme.fontFamily}
              onChange={(e) => setTheme({ ...theme, fontFamily: e.target.value as any })}
              className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl text-[#78350F] font-bold"
            >
              <option value="serif_vedic">Vedic Serif (Playfair / Georgia)</option>
              <option value="sans_modern">Modern Sans (Inter / Plus Jakarta)</option>
              <option value="mono_technical">Technical Precision Mono</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8B735B] mb-2 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-[#D97706]" /> Font Size Scale
            </label>
            <select
              value={theme.fontSizeScale}
              onChange={(e) => setTheme({ ...theme, fontSizeScale: e.target.value as any })}
              className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl text-[#78350F] font-bold"
            >
              <option value="compact">Compact (Dense UI)</option>
              <option value="normal">Normal (Standard Balance)</option>
              <option value="large">Large (High Readability)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
