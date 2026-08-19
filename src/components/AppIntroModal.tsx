import React, { useState } from 'react';
import { IntroScreenItem } from '../utils/systemSettings';
import { Compass, Sparkles, ChevronRight, ChevronLeft, X, CheckCircle2, ShieldCheck, Play } from 'lucide-react';

interface AppIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  screens: IntroScreenItem[];
  appName?: string;
}

export const AppIntroModal: React.FC<AppIntroModalProps> = ({
  isOpen,
  onClose,
  screens,
  appName = 'Vastu Compass',
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  if (!isOpen || !screens || screens.length === 0) return null;

  const currentScreen = screens[currentIndex] || screens[0];
  const isLast = currentIndex === screens.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#FFFBF0] border-2 border-[#D97706] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
        {/* Top Bar / Header */}
        <div className="bg-[#78350F] text-white px-6 py-4 flex items-center justify-between border-b border-[#5C280B] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#D97706] text-white flex items-center justify-center font-bold text-sm shadow-inner">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#FCD34D] block">
                Welcome Onboarding
              </span>
              <h3 className="text-base font-serif font-bold text-white leading-tight">
                {appName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-amber-200 hover:text-white transition-colors"
              title="Close Intro"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Screen Content Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between space-y-5">
          {/* Badge & Step indicator */}
          <div className="flex items-center justify-between shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
              {currentScreen.badge || `Step ${currentIndex + 1} of ${screens.length}`}
            </span>

            {/* Pagination Dots */}
            <div className="flex items-center gap-1.5">
              {screens.map((s, idx) => (
                <button
                  key={s.id || idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-7 bg-[#D97706] shadow-sm'
                      : 'w-2.5 bg-[#E8DCC4] hover:bg-[#D97706]/50'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Intro Card Image Preview */}
          <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden border-2 border-[#E8DCC4] shadow-md group shrink-0 bg-[#FEF3C7]">
            <img
              src={currentScreen.imageUrl}
              alt={currentScreen.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onError={(e) => {
                // Fallback image if broken URL
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <span className="text-[11px] uppercase tracking-wider text-amber-300 font-semibold block">
                {currentScreen.subtitle}
              </span>
              <h4 className="text-lg font-serif font-bold text-white drop-shadow-sm leading-snug">
                {currentScreen.title}
              </h4>
            </div>
          </div>

          {/* Description Text */}
          <div className="bg-white/80 rounded-2xl p-4 border border-[#E8DCC4] shadow-sm flex-1 flex flex-col justify-center">
            <p className="text-sm text-[#78350F] leading-relaxed font-sans">
              {currentScreen.description}
            </p>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="bg-[#FFF8E7] px-6 py-4 border-t border-[#E8DCC4] flex items-center justify-between shrink-0">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              currentIndex === 0
                ? 'opacity-40 cursor-not-allowed text-[#A68A64]'
                : 'bg-white border border-[#D97706]/30 text-[#78350F] hover:bg-[#FEF3C7]'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={onClose}
            className="text-xs font-bold text-[#A68A64] hover:text-[#78350F] underline transition-colors px-2"
          >
            Skip Intro
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#78350F] shadow-md transition-all transform active:scale-95"
          >
            {isLast ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-amber-200" />
                Get Started
              </>
            ) : (
              <>
                Next Step
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
