import React, { useState } from 'react';
import { Lock, Sparkles, X, ChevronRight } from 'lucide-react';

interface LotusUnlockFloatingProps {
  onUnlock: () => void;
  title?: string;
  subtitle?: string;
}

export const LotusUnlockFloating: React.FC<LotusUnlockFloatingProps> = ({
  onUnlock,
  title = 'Unlock Vastu Pro Pass',
  subtitle = 'Reveal full 16-zone scores & remedies',
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  return (
    <div className="fixed bottom-[68px] sm:bottom-[76px] left-1/2 -translate-x-1/2 z-40 flex flex-col items-center transition-all duration-300 w-[92%] max-w-[350px] px-2 pointer-events-auto">
      {!isMinimized ? (
        <div
          onClick={onUnlock}
          className="group relative w-full cursor-pointer bg-gradient-to-r from-[#5C280B] via-[#78350F] to-[#451A03] text-[#F3EFE0] p-2.5 sm:p-3 pl-3 pr-3.5 rounded-full border-2 border-[#F59E0B] shadow-2xl shadow-[#78350F]/70 flex items-center justify-between gap-2 sm:gap-3 hover:scale-[1.02] active:scale-98 transition-all duration-300 backdrop-blur-md"
        >
          {/* Glowing Golden Aura Ring */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#F59E0B] via-[#E11D48] to-[#F59E0B] opacity-45 blur-md group-hover:opacity-85 transition-opacity animate-pulse pointer-events-none" />

          {/* Left: Sacred Lotus Icon Container */}
          <div className="relative shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] p-0.5 shadow-inner flex items-center justify-center">
            {/* Sacred Lotus Petals SVG */}
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full text-[#78350F] animate-spin-slow"
              style={{ animationDuration: '28s' }}
            >
              <g fill="currentColor">
                {/* 8 Outer Lotus Petals */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <path
                    key={i}
                    d="M50 50 C38 18, 62 18, 50 50"
                    transform={`rotate(${angle} 50 50)`}
                    fill="#FFFBEB"
                    stroke="#D97706"
                    strokeWidth="2"
                  />
                ))}
                {/* Inner Petal Layer */}
                {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle, i) => (
                  <path
                    key={`inner-${i}`}
                    d="M50 50 C44 28, 56 28, 50 50"
                    transform={`rotate(${angle} 50 50)`}
                    fill="#FDE68A"
                    stroke="#B45309"
                    strokeWidth="1.5"
                  />
                ))}
                <circle cx="50" cy="50" r="10" fill="#78350F" />
              </g>
            </svg>

            {/* Lock icon overlay at lotus center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FEF3C7] drop-shadow-xs" />
            </div>
          </div>

          {/* Middle: Text Details */}
          <div className="relative flex-1 flex flex-col text-left min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-[#FDE68A] bg-[#92400E]/90 px-1.5 py-0.2 rounded-full border border-[#F59E0B]/50 truncate">
                LOTUS VASTU UNLOCK
              </span>
              <Sparkles className="w-3 h-3 text-[#F59E0B] animate-bounce shrink-0" />
            </div>
            <span className="text-xs sm:text-xs font-serif font-black text-white leading-tight group-hover:text-[#FDE68A] transition-colors truncate">
              {title}
            </span>
            <span className="text-[9px] sm:text-[10px] text-[#E8DCC4] font-medium leading-tight truncate">
              {subtitle}
            </span>
          </div>

          {/* Right: Action Arrow */}
          <div className="relative shrink-0 p-1.5 rounded-full bg-[#F59E0B] text-[#78350F] group-hover:translate-x-0.5 transition-transform flex items-center justify-center">
            <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
          </div>

          {/* Minimize X Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            className="absolute -top-1 -right-1 bg-[#451A03] text-[#E8DCC4] hover:text-white p-1 rounded-full border border-[#F59E0B]/70 hover:bg-[#78350F] transition-colors shadow-md"
            title="Minimize Lotus Unlock"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        /* Minimized Centered Floating Lotus Pill */
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="group relative bg-gradient-to-r from-[#78350F] via-[#5C280B] to-[#451A03] px-3.5 py-1.5 rounded-full border-2 border-[#F59E0B] shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all text-[#F3EFE0]"
          title="Open Sacred Lotus Unlock"
        >
          <div className="absolute -inset-1 rounded-full bg-[#F59E0B] opacity-50 blur-xs group-hover:opacity-90 animate-pulse" />
          <div className="relative w-6 h-6 rounded-full bg-[#D97706] flex items-center justify-center overflow-hidden shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full text-[#78350F]">
              <g fill="currentColor">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <path
                    key={i}
                    d="M50 50 C40 20, 60 20, 50 50"
                    transform={`rotate(${angle} 50 50)`}
                    fill="#FFFBEB"
                    stroke="#D97706"
                    strokeWidth="2"
                  />
                ))}
              </g>
            </svg>
            <Lock className="w-2.5 h-2.5 text-[#78350F] absolute drop-shadow-xs" />
          </div>
          <span className="relative text-[10px] font-serif font-bold text-[#FEF3C7] tracking-wider uppercase">
            Lotus Unlock
          </span>
          <Sparkles className="relative w-3 h-3 text-[#F59E0B]" />
        </button>
      )}
    </div>
  );
};
