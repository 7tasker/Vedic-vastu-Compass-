import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Info,
  X,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Code2,
  Calendar,
  Layers,
  Lock,
} from 'lucide-react';
import {
  AppLegalAndInfoConfig,
  DEFAULT_LEGAL_AND_INFO_CONFIG,
  fetchAppLegalAndInfoFromFirestore,
} from '../lib/firebase';

interface PrivacyAndAppInfoModalProps {
  isOpen: boolean;
  initialTab?: 'privacy' | 'app_info';
  onClose: () => void;
}

export const PrivacyAndAppInfoModal: React.FC<PrivacyAndAppInfoModalProps> = ({
  isOpen,
  initialTab = 'privacy',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'app_info'>(initialTab);
  const [config, setConfig] = useState<AppLegalAndInfoConfig>(DEFAULT_LEGAL_AND_INFO_CONFIG);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isOpen) {
      try {
        const cached = localStorage.getItem('vastu_app_legal_info');
        if (cached) {
          setConfig({ ...DEFAULT_LEGAL_AND_INFO_CONFIG, ...JSON.parse(cached) });
        }
      } catch {}

      fetchAppLegalAndInfoFromFirestore()
        .then((res) => {
          if (res) {
            setConfig(res);
          }
        })
        .catch((err) => {
          console.warn('Error fetching app legal & info:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] border border-[#E8DCC4] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#78350F] text-[#F3EFE0] p-4 sm:p-5 flex items-center justify-between border-b border-[#9A420F] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D97706]/20 border border-[#D97706]/40 flex items-center justify-center shrink-0">
              {activeTab === 'privacy' ? (
                <ShieldCheck className="w-5 h-5 text-[#F59E0B]" />
              ) : (
                <Info className="w-5 h-5 text-[#F59E0B]" />
              )}
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#F3EFE0]">
                {activeTab === 'privacy' ? 'Privacy Policy & Terms' : 'App Information & Version'}
              </h3>
              <p className="text-[11px] text-[#E8DCC4] opacity-90">
                {activeTab === 'privacy'
                  ? 'Data protection protocols & privacy guidelines'
                  : `Vastu Compass Platform Specs • ${config.appInfo.version}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-[#E8DCC4] transition-all"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="bg-[#FCFAF7] border-b border-[#E8DCC4] p-2 flex gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wider ${
              activeTab === 'privacy'
                ? 'bg-[#78350F] text-white shadow-xs'
                : 'text-[#8B735B] hover:bg-[#F3EFE0] hover:text-[#78350F]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#D97706]" />
            Privacy, Terms & Disclaimer
          </button>
          <button
            onClick={() => setActiveTab('app_info')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wider ${
              activeTab === 'app_info'
                ? 'bg-[#78350F] text-white shadow-xs'
                : 'text-[#8B735B] hover:bg-[#F3EFE0] hover:text-[#78350F]'
            }`}
          >
            <Info className="w-4 h-4 text-[#D97706]" />
            App Info & Improvements
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#8B735B] font-bold animate-pulse">
              Loading policy & app information...
            </div>
          ) : activeTab === 'privacy' ? (
            /* PRIVACY POLICY TAB CONTENT */
            <div className="space-y-4 text-xs text-[#3D342D] leading-relaxed">
              {/* Highlighted Sacred Sadhana Disclaimer Card */}
              <div className="bg-[#FFFBEB] p-4 sm:p-5 rounded-2xl border-2 border-[#D97706]/40 shadow-xs space-y-2.5">
                <div className="flex items-center gap-2 text-[#78350F] font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-[#D97706]" />
                  Sacred Sadhana Disclaimer
                </div>
                <div className="bg-white/90 p-3.5 rounded-xl border border-[#FDE68A] text-[#78350F] font-semibold leading-relaxed text-xs space-y-1">
                  <p className="font-serif italic text-xs">
                    "This is a spiritual practice, not a commercial product. By placing an order, you acknowledge that it is created as part of a sacred sadhana and accept that no legal disputes or claims will be entertained in any court of law."
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E8DCC4] space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-serif font-bold text-sm text-[#78350F]">
                    {config.privacyPolicy.title}
                  </h4>
                  <span className="text-[10px] bg-[#FEF3C7] text-[#D97706] font-bold px-2 py-0.5 rounded-full border border-[#FDE68A]">
                    Last Updated: {config.privacyPolicy.lastUpdated}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#8B735B]">
                  <Lock className="w-3.5 h-3.5 text-[#059669]" />
                  <span>256-bit TLS SSL Encrypted • Row-Level Data Isolation</span>
                </div>
              </div>

              {/* Policy Body Content */}
              <div className="bg-white p-5 rounded-2xl border border-[#E8DCC4] whitespace-pre-wrap font-sans text-xs space-y-3 leading-relaxed">
                {config.privacyPolicy.content}
              </div>

              {/* External Privacy URL Link Button */}
              {config.privacyPolicy.externalUrl && (
                <div className="bg-[#FFFBEB] p-4 rounded-2xl border border-[#FDE68A] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs text-[#78350F] block">
                      Official Online Privacy Portal
                    </span>
                    <span className="text-[11px] text-[#8B735B]">
                      Read complete legal terms & gdpr compliance online
                    </span>
                  </div>
                  <a
                    href={config.privacyPolicy.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <span>Visit Privacy URL</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            /* APP INFO & IMPROVEMENTS TAB CONTENT */
            <div className="space-y-4 text-xs text-[#3D342D]">
              {/* App Version Header Card */}
              <div className="bg-gradient-to-r from-[#78350F] to-[#5C280B] text-white p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#F59E0B] bg-black/30 px-2 py-0.5 rounded">
                      Official App Build
                    </span>
                    <h4 className="font-serif font-bold text-base sm:text-lg text-white mt-1">
                      {config.appInfo.title}
                    </h4>
                  </div>
                  <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 text-right">
                    <div className="font-mono font-bold text-sm text-[#F59E0B]">
                      {config.appInfo.version}
                    </div>
                    <div className="text-[10px] text-amber-200/80">Build {config.appInfo.buildNumber}</div>
                  </div>
                </div>

                <p className="text-xs text-[#E8DCC4] leading-relaxed">
                  {config.appInfo.description}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-amber-200/90 pt-1 border-t border-white/10 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#F59E0B]" /> Released: {config.appInfo.releaseDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Code2 className="w-3.5 h-3.5 text-[#F59E0B]" /> Architecture: Web SPA / Cloud Run
                  </span>
                </div>
              </div>

              {/* Version Improvements & Highlights */}
              <div className="bg-white p-5 rounded-2xl border border-[#E8DCC4] space-y-3">
                <h5 className="font-serif font-bold text-xs uppercase tracking-wider text-[#78350F] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#D97706]" /> Recent Version Improvements & Changelog
                </h5>
                <div className="space-y-2">
                  {config.appInfo.improvements?.map((imp, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8DCC4]/60">
                      <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                      <span className="text-xs text-[#3D342D] font-medium leading-snug">{imp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Stack Specs */}
              <div className="bg-white p-4 rounded-2xl border border-[#E8DCC4] space-y-2">
                <h5 className="font-serif font-bold text-xs uppercase tracking-wider text-[#78350F] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#D97706]" /> Technology & Framework Specifications
                </h5>
                <p className="text-xs text-[#8B735B]">{config.appInfo.developerInfo}</p>
              </div>

              {/* External App Specs / Doc URL Link */}
              {config.appInfo.externalUrl && (
                <div className="bg-[#FFFBEB] p-4 rounded-2xl border border-[#FDE68A] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs text-[#78350F] block">
                      Release Documentation & Specs
                    </span>
                    <span className="text-[11px] text-[#8B735B]">
                      View detailed release notes and API documentation
                    </span>
                  </div>
                  <a
                    href={config.appInfo.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <span>View Docs URL</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#FCFAF7] border-t border-[#E8DCC4] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#78350F] hover:bg-[#5C280B] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
