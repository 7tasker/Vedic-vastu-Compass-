import React, { useEffect, useState } from 'react';
import { recordAdSenseMetricInFirestore } from '../lib/firebase';
import { Sparkles, ExternalLink, ShieldCheck, Eye, MousePointer } from 'lucide-react';

interface AdSenseUnitProps {
  slotId?: string;
  format?: 'banner' | 'card' | 'inline' | 'sidebar';
  publisherId?: string;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export const AdSenseUnit: React.FC<AdSenseUnitProps> = ({
  slotId = 'vastu-ad-slot-101',
  format = 'banner',
  publisherId = 'ca-pub-vastu-compass-9921',
  className = '',
}) => {
  const [adLoaded, setAdLoaded] = useState<boolean>(false);
  const [isAdBlockActive, setIsAdBlockActive] = useState<boolean>(false);

  useEffect(() => {
    // Record impression telemetry in Firestore
    recordAdSenseMetricInFirestore({ type: 'impression' });

    try {
      if (typeof window !== 'undefined' && Array.isArray(window.adsbygoogle)) {
        // Only push if adsbygoogle script is active or initialized
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setAdLoaded(true);
        } catch (err) {
          console.warn('AdSense unit push skipped:', err);
          setIsAdBlockActive(true);
        }
      }
    } catch (e) {
      console.warn('AdSense script execution fallback:', e);
      setIsAdBlockActive(true);
    }
  }, [slotId]);

  const handleAdClick = () => {
    recordAdSenseMetricInFirestore({ type: 'click', estRevenue: 5.25 });
  };

  return (
    <div className={`my-3 font-sans select-none ${className}`}>
      {format === 'banner' && (
        <div
          onClick={handleAdClick}
          className="bg-gradient-to-r from-[#FFFBEB] via-[#FCFAF7] to-[#FEF3C7] border border-[#E8DCC4] rounded-2xl p-2.5 sm:p-3 shadow-xs relative overflow-hidden group cursor-pointer transition-all hover:border-[#D97706]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.5 rounded border border-[#FDE68A] shrink-0">
                Sponsored Ad
              </span>
              <p className="text-xs font-serif font-bold text-[#78350F] truncate">
                🏡 Vedic Property Vastu Consultation & Gemstone Recommendations
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold text-[#D97706] hidden sm:inline-block">
                Get 20% Off Vastu Remedies
              </span>
              <button className="px-2.5 py-1 bg-[#78350F] text-white text-[10px] font-bold uppercase rounded-lg group-hover:bg-[#5C280B] transition-colors flex items-center gap-1">
                <span>Explore</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* AdSense ins tag placeholder */}
          <ins
            className="adsbygoogle"
            style={{ display: 'block', height: '1px', opacity: 0.01 }}
            data-ad-client={publisherId}
            data-ad-slot={slotId}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      )}

      {format === 'card' && (
        <div
          onClick={handleAdClick}
          className="bg-white rounded-2xl border-2 border-[#E8DCC4] p-4 shadow-2xs relative overflow-hidden group cursor-pointer hover:border-[#D97706] transition-all"
        >
          <div className="flex items-center justify-between border-b border-[#E8DCC4]/60 pb-2 mb-2.5">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#8B735B] bg-[#F3EFE0] px-2 py-0.5 rounded">
              Google AdSense Partner
            </span>
            <span className="text-[10px] text-[#A68A64] font-mono">{publisherId}</span>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#D97706] shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <h5 className="text-xs font-serif font-bold text-[#78350F] group-hover:text-[#D97706] transition-colors">
                Certified Vedic Architects & Pyramidal Energy Crystal Suppliers
              </h5>
              <p className="text-[11px] text-[#8B735B] leading-snug line-clamp-2">
                Order authentic Brass Swastik, Lead Helices, Copper Strips & Vastu Pyramids delivered nationwide.
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#E8DCC4]/60 flex justify-between items-center text-[10px]">
            <span className="text-[#059669] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Vastu Partner
            </span>
            <span className="text-[#D97706] font-bold group-hover:underline flex items-center gap-0.5">
              Visit Website <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>
      )}

      {format === 'sidebar' && (
        <div
          onClick={handleAdClick}
          className="bg-[#FFFBEB] rounded-2xl border border-[#FEF3C7] p-3 text-center space-y-2 cursor-pointer hover:border-[#F59E0B] transition-all"
        >
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-full border border-[#FDE68A] inline-block">
            AdSense Native Unit
          </span>
          <h6 className="text-xs font-serif font-bold text-[#78350F]">
            Custom Vastu Floor Plan CAD Services
          </h6>
          <p className="text-[10px] text-[#8B735B]">
            Convert paper sketches to 100% Vastu-aligned architectural layouts in 24 hours.
          </p>
        </div>
      )}
    </div>
  );
};
