import React from 'react';
import { PushNotificationAlert } from '../types';
import { Flame, BellRing, X, ChevronRight, Sparkles } from 'lucide-react';

interface PushNotificationBannerProps {
  alert: PushNotificationAlert | null;
  onOpenCenter: () => void;
  onNavigateToTab: (tabId: string) => void;
  onDismiss: () => void;
}

export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({
  alert,
  onOpenCenter,
  onNavigateToTab,
  onDismiss,
}) => {
  if (!alert) return null;

  return (
    <div className="fixed top-3 right-3 sm:top-5 sm:right-5 z-40 max-w-md w-[calc(100vw-24px)] animate-in slide-in-from-top-5 duration-300">
      <div className="bg-[#FFFDF9] border border-[#FDE68A] border-l-4 border-l-[#D97706] rounded-2xl p-4 shadow-xl flex flex-col gap-3 relative overflow-hidden">
        {/* Top header row */}
        <div className="flex items-center justify-between gap-2 border-b border-[#E8DCC4]/50 pb-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] shadow-2xs">
            Cultural Reminder • {alert.countdownText}
          </span>

          <button
            onClick={onDismiss}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[#8B735B] hover:text-[#991B1B] hover:bg-[#FEF2F2] transition-all cursor-pointer shrink-0"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Main content row */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D97706] to-[#B45309] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <Flame className="w-5 h-5 text-yellow-200" />
          </div>

          <div className="flex-1 min-w-0">
            <h5 className="font-serif font-bold text-sm text-[#78350F] leading-snug">
              {alert.title}
            </h5>

            <p className="text-xs text-[#5C4533] leading-relaxed mt-1">
              {alert.body}
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E8DCC4]/60">
          <button
            onClick={onOpenCenter}
            className="text-[11px] font-bold text-[#D97706] hover:underline cursor-pointer"
          >
            View All Alerts
          </button>

          {alert.targetTab && (
            <button
              onClick={() => {
                onNavigateToTab(alert.targetTab!);
                onDismiss();
              }}
              className="px-3.5 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>Check Timings</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

