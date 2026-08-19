import React, { useState } from 'react';
import { GENERAL_REMEDIES } from '../data/vastuData';
import { RemedyItem, PlacedRoom } from '../types';
import { calculateHouseAudit, playTempleBellChime } from '../utils/vastuUtils';
import {
  Wrench,
  CheckSquare,
  Square,
  Sparkles,
  ShieldCheck,
  Palette,
  Layers,
  Flame,
  Sun,
  PackageCheck,
  Search,
  Lock,
  Key,
  AlertCircle,
} from 'lucide-react';

interface VastuRemediesViewProps {
  placedRooms: PlacedRoom[];
  isAuditUnlocked?: boolean;
  onUnlockAudit?: () => void;
}

export const VastuRemediesView: React.FC<VastuRemediesViewProps> = ({
  placedRooms,
  isAuditUnlocked = false,
  onUnlockAudit,
}) => {
  const [appliedRemedyIds, setAppliedRemedyIds] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const auditReport = calculateHouseAudit(placedRooms);

  // Extract all remedies from current audit report + general database
  const detectedRemedies: RemedyItem[] = [];
  auditReport.analyses.forEach((a) => {
    a.remedies.forEach((r) => {
      if (!detectedRemedies.some((existing) => existing.id === r.id)) {
        detectedRemedies.push(r);
      }
    });
  });

  // Combine with general database remedies
  const allRemedies: RemedyItem[] = [...detectedRemedies];
  Object.values(GENERAL_REMEDIES).forEach((r) => {
    if (!allRemedies.some((existing) => existing.id === r.id)) {
      allRemedies.push(r);
    }
  });

  const toggleRemedyApplied = (id: string) => {
    setAppliedRemedyIds((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      playTempleBellChime();
      return updated;
    });
  };

  const filteredRemedies = allRemedies.filter((r) => {
    const matchesCategory = activeCategory === 'all' || r.category === activeCategory;
    const matchesSearch =
      (r.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (r.description || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (r.howToApply || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const appliedCount = Object.values(appliedRemedyIds).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto pb-28 sm:pb-32 font-sans text-[#3D342D]">
      {/* Header Banner */}
      <div className="bg-[#78350F] text-[#F3EFE0] rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-[#5C280B]">
        <div>
          <span className="text-[10px] font-sans font-extrabold px-2.5 py-0.5 rounded-full bg-[#D97706] text-white uppercase tracking-widest">
            Vastu Dosh Nivarana Hub
          </span>
          <h2 className="text-xl font-serif font-bold mt-2 text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#D97706]" /> Specific Non-Destructive Vastu Remedies
          </h2>
          <p className="text-xs text-[#E8DCC4] max-w-xl mt-1 leading-relaxed">
            Neutralize directional Vastu defects without breaking walls using sacred Vedic Yantras, Pyramids, Color Therapy, Elemental Balance, and Natural Energy Crystals.
          </p>
        </div>

        {/* Remediation Progress Tracker */}
        <div className="bg-[#5C280B] border border-[#9A420F]/50 rounded-2xl p-4 text-center shrink-0 w-full md:w-auto shadow-xs">
          <span className="text-[10px] font-sans font-bold text-[#E8DCC4] uppercase tracking-widest block">
            Remedies Applied
          </span>
          <span className="text-2xl font-serif font-black text-[#D97706] block my-0.5">
            {appliedCount} / {filteredRemedies.length}
          </span>
          <span className="text-[10px] text-[#E8DCC4]/90 font-medium">
            {appliedCount > 0 ? '✨ Energy Field Balancing' : 'Mark applied remedies below'}
          </span>
        </div>
      </div>

      {/* Detected Dosh Alert Box if audit has defects */}
      {auditReport.doshCount > 0 && (
        <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-3xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FEF2F2] text-[#991B1B] rounded-2xl border border-[#FCA5A5] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-serif font-bold text-[#78350F]">
                {auditReport.doshCount} Priority Remedies Identified for Your House
              </h4>
              <p className="text-xs text-[#8B735B] mt-0.5">
                Based on your current room audit, the remedies below are prioritized for your home layout.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#A68A64] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search remedies (e.g. Salt, Pyramid)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-white border border-[#E8DCC4] rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-[#D97706] outline-none text-[#3D342D]"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {[
            { id: 'all', label: 'All Remedies', icon: Sparkles },
            { id: 'yantra', label: 'Yantras & Symbols', icon: Sun },
            { id: 'pyramid', label: 'Pyramids & Metals', icon: Layers },
            { id: 'color', label: 'Color Therapy', icon: Palette },
            { id: 'element', label: 'Elemental', icon: Flame },
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-[#78350F] text-[#F3EFE0] border-[#5C280B] shadow-xs'
                    : 'bg-[#FCFAF7] text-[#8B735B] border-[#E8DCC4] hover:bg-[#F3EFE0]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Remedies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRemedies.map((remedy) => {
          const isApplied = !!appliedRemedyIds[remedy.id];
          const isYantraBased =
            remedy.category?.toLowerCase() === 'yantra' ||
            remedy.title?.toLowerCase().includes('yantra') ||
            remedy.description?.toLowerCase().includes('yantra') ||
            remedy.howToApply?.toLowerCase().includes('yantra') ||
            remedy.materialsNeeded?.some((m) => m.toLowerCase().includes('yantra'));

          return (
            <div
              key={remedy.id}
              className={`rounded-3xl border p-5 transition-all shadow-xs flex flex-col justify-between gap-4 ${
                isApplied
                  ? 'bg-[#ECFDF5] border-[#D1FAE5] ring-2 ring-[#10B981]/30'
                  : 'bg-[#FCFAF7] border-[#E8DCC4] hover:border-[#D97706]/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="p-1.5 rounded-xl bg-[#F3EFE0] text-[#78350F] text-[10px] font-bold border border-[#E8DCC4] uppercase tracking-wider">
                      {remedy.category}
                    </span>
                    {isYantraBased && (
                      <span className="px-2 py-1 rounded-xl bg-red-100 text-red-700 text-[10px] font-extrabold border border-red-300 uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                        <AlertCircle className="w-3 h-3 text-red-600 shrink-0" />
                        Consultation required
                      </span>
                    )}
                    <h3 className="text-sm font-serif font-bold text-[#78350F] leading-snug">{remedy.title}</h3>
                  </div>

                  <button
                    onClick={() => toggleRemedyApplied(remedy.id)}
                    className="p-1 rounded-lg text-[#8B735B] hover:text-[#78350F] transition-all shrink-0"
                    title={isApplied ? 'Mark as Unapplied' : 'Mark as Applied'}
                  >
                    {isApplied ? (
                      <CheckSquare className="w-6 h-6 text-[#10B981]" />
                    ) : (
                      <Square className="w-6 h-6 text-[#A68A64] hover:text-[#D97706]" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-[#3D342D] mb-3 leading-relaxed">{remedy.description}</p>

                {/* Step-by-step How to Apply */}
                <div className="bg-white rounded-2xl p-3 border border-[#E8DCC4] mb-3 space-y-1 relative overflow-hidden">
                  <span className="text-[10px] font-bold text-[#78350F] block flex items-center gap-1 uppercase tracking-wider">
                    <PackageCheck className="w-3.5 h-3.5 text-[#D97706]" /> How to Apply Remedy:
                  </span>
                  <p className={`text-xs text-[#8B735B] leading-relaxed transition-all ${
                    !isAuditUnlocked ? 'filter blur-xs select-none' : ''
                  }`}>
                    {isAuditUnlocked
                      ? remedy.howToApply
                      : 'Place sacred brass lotus yantra with Panchadhatu element plates aligned precisely to 45° North-East corner on auspicious Thursday morning.'}
                  </p>
                  {!isAuditUnlocked && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center p-2">
                      <button
                        onClick={onUnlockAudit}
                        className="text-[10px] font-extrabold uppercase tracking-wider bg-[#78350F] text-[#F3EFE0] px-3 py-1.5 rounded-xl shadow-xs hover:bg-[#5C280B] flex items-center gap-1"
                      >
                        <Lock className="w-3 h-3 text-[#F59E0B]" />
                        <span>Unlock Full Procedure</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Materials Needed Tags */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] font-bold text-[#A68A64] uppercase tracking-wider">Materials:</span>
                  {remedy.materialsNeeded.map((mat, idx) => (
                    <span
                      key={`${mat}_${idx}`}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFFBEB] text-[#78350F] border border-[#FEF3C7]"
                    >
                      {mat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[#E8DCC4]/50 flex items-center justify-between text-xs">
                <span className="text-[#8B735B] font-medium text-[11px]">
                  Effectiveness:{' '}
                  <strong className="text-[#10B981] font-bold">{remedy.effectiveness}</strong>
                </span>

                <button
                  onClick={() => toggleRemedyApplied(remedy.id)}
                  className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full transition-all ${
                    isApplied
                      ? 'bg-[#10B981] text-white'
                      : 'bg-[#F3EFE0] text-[#78350F] hover:bg-[#78350F] hover:text-[#F3EFE0]'
                  }`}
                >
                  {isApplied ? '✓ Installed' : '+ Mark Installed'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
