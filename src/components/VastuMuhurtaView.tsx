import React, { useState, useMemo } from 'react';
import { CeremonyType, MuhurtaDate, PropertyRecord, UserProfile } from '../types';
import { CITIES_LIST, CEREMONY_METADATA, ALL_MUHURTA_DATES, LocationOption } from '../data/muhurtaData';
import { playTempleBellChime } from '../utils/vastuUtils';
import { jsPDF } from 'jspdf';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Sparkles,
  Sun,
  Moon,
  AlertTriangle,
  CheckCircle2,
  Download,
  Filter,
  Info,
  ChevronRight,
  Home,
  DoorOpen,
  Droplet,
  Flame,
  Star,
  Share2,
  Check,
  List,
  Grid,
  SlidersHorizontal,
  X,
  RotateCcw,
} from 'lucide-react';

interface VastuMuhurtaViewProps {
  activeProperty?: PropertyRecord;
  userProfile?: UserProfile;
}

export const VastuMuhurtaView: React.FC<VastuMuhurtaViewProps> = ({
  activeProperty,
  userProfile,
}) => {
  // Selected State
  const [selectedCeremony, setSelectedCeremony] = useState<CeremonyType>('griha_pravesh');
  const [selectedCityId, setSelectedCityId] = useState<string>('mumbai');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedRashi, setSelectedRashi] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedMuhurtaDetail, setSelectedMuhurtaDetail] = useState<MuhurtaDate | null>(null);
  const [savedMuhurtas, setSavedMuhurtas] = useState<string[]>([]);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);

  // Active Filter Count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCeremony !== 'griha_pravesh') count++;
    if (selectedMonth !== 'all') count++;
    if (selectedRashi !== 'all') count++;
    return count;
  }, [selectedCeremony, selectedMonth, selectedRashi]);

  // Active City
  const activeCity = CITIES_LIST.find((c) => c.id === selectedCityId) || CITIES_LIST[0];

  // Active Ceremony Metadata
  const ceremonyMeta = CEREMONY_METADATA[selectedCeremony];

  // Filtered Muhurta Dates
  const filteredMuhurtas = useMemo(() => {
    return ALL_MUHURTA_DATES.filter((item) => {
      if (item.ceremonyType !== selectedCeremony) return false;
      if (selectedMonth !== 'all' && item.month !== selectedMonth) return false;
      return true;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedCeremony, selectedMonth]);

  // Top Ranked Muhurta
  const topMuhurta = useMemo(() => {
    if (filteredMuhurtas.length === 0) return null;
    return [...filteredMuhurtas].sort((a, b) => b.suitabilityScore - a.suitabilityScore)[0];
  }, [filteredMuhurtas]);

  // Toggle Save Muhurta
  const handleToggleSave = (id: string) => {
    playTempleBellChime();
    setSavedMuhurtas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Generate PDF Muhurta Schedule Report
  const handleExportPdfSchedule = () => {
    setIsExportingPdf(true);
    playTempleBellChime();

    setTimeout(() => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 14;
        const contentWidth = pageWidth - margin * 2;
        let y = margin;

        // Top Banner
        doc.setFillColor(120, 53, 15); // #78350F
        doc.rect(0, 0, pageWidth, 26, 'F');
        doc.setFillColor(217, 119, 6);
        doc.rect(0, 26, pageWidth, 1.5, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('VASTU DRISHTI • VEDIC MUHURTA FINDER', margin, 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(232, 220, 196);
        doc.text(`AUSPICIOUS DATES FOR ${ceremonyMeta.title.toUpperCase()}`, margin, 19);

        y = 34;

        // Context Box
        doc.setFillColor(252, 250, 247);
        doc.setDrawColor(232, 220, 196);
        doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(120, 53, 15);
        doc.text(`Property: ${activeProperty?.name || 'Primary Residence'}`, margin + 4, y + 6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(70, 60, 50);
        doc.text(`Location Panchang: ${activeCity.name} (${activeCity.region})`, margin + 4, y + 11);
        doc.text(`Time Zone: ${activeCity.timeZone} | Sunrise Approx: ${activeCity.sunriseAvg}`, margin + 4, y + 16);

        y += 28;

        // Section Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(120, 53, 15);
        doc.text(`RECOMMENDED AUSPICIOUS TIMINGS (${filteredMuhurtas.length} DATES)`, margin, y);
        doc.setDrawColor(217, 119, 6);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        y += 8;

        filteredMuhurtas.forEach((muh, idx) => {
          if (y + 40 > pageHeight - margin) {
            doc.addPage();
            y = margin + 10;
          }

          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(232, 220, 196);
          doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'FD');

          // Date Header Line
          doc.setFillColor(243, 239, 224);
          doc.rect(margin, y, contentWidth, 7, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(120, 53, 15);
          doc.text(`${idx + 1}. ${muh.formattedDate}`, margin + 3, y + 5);

          doc.setFontSize(8);
          doc.setTextColor(22, 101, 52);
          doc.text(`Suitability Score: ${muh.suitabilityScore}% (Rating ${muh.rating}/5)`, pageWidth - margin - 4, y + 5, { align: 'right' });

          let lineY = y + 12;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(60, 50, 40);
          doc.text('Tithi & Nakshatra:', margin + 3, lineY);
          doc.setFont('helvetica', 'normal');
          doc.text(`${muh.tithi} | ${muh.nakshatra} (${muh.yoga})`, margin + 32, lineY);

          lineY += 5;
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(180, 83, 9);
          doc.text('Auspicious Window:', margin + 3, lineY);
          doc.setFont('helvetica', 'normal');
          doc.text(`${muh.timeWindow} - ${muh.fixedLagna}`, margin + 32, lineY);

          lineY += 5;
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(185, 28, 28);
          doc.text('Rahu Kalam (Avoid):', margin + 3, lineY);
          doc.setFont('helvetica', 'normal');
          doc.text(`${muh.rahuKalam}`, margin + 32, lineY);

          lineY += 5;
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7);
          doc.setTextColor(80, 80, 80);
          doc.text(`Note: ${muh.summary}`, margin + 3, lineY);

          y += 38;
        });

        // Ritual Instructions Section
        if (y + 40 > pageHeight - margin) {
          doc.addPage();
          y = margin + 10;
        }

        doc.setFillColor(253, 248, 240);
        doc.setDrawColor(217, 119, 6);
        doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(120, 53, 15);
        doc.text(`ESSENTIAL RITUAL CHECKLIST FOR ${ceremonyMeta.title.toUpperCase()}`, margin + 4, y + 6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(60, 50, 40);
        ceremonyMeta.importantRitualNotes.forEach((note, nIdx) => {
          doc.text(`• ${note}`, margin + 4, y + 12 + nIdx * 4.5);
        });

        // Footer
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(139, 115, 91);
        doc.text(`Generated by Vastu Compass App on ${new Date().toLocaleDateString()}`, margin, pageHeight - 6);

        const filename = `Vastu_Muhurta_${selectedCeremony}_${activeCity.id}.pdf`;
        doc.save(filename);
      } catch (err) {
        console.error('Failed to generate Muhurta PDF:', err);
      } finally {
        setIsExportingPdf(false);
      }
    }, 150);
  };

  const getCeremonyIcon = (type: CeremonyType) => {
    switch (type) {
      case 'griha_pravesh':
        return <Home className="w-4 h-4 text-[#D97706]" />;
      case 'bhumi_pujan':
        return <Sparkles className="w-4 h-4 text-[#D97706]" />;
      case 'chaukhat_sthapana':
        return <DoorOpen className="w-4 h-4 text-[#D97706]" />;
      case 'borewell':
        return <Droplet className="w-4 h-4 text-[#2563EB]" />;
      case 'pooja_room':
        return <Flame className="w-4 h-4 text-[#D97706]" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto pb-24 font-sans text-[#3D342D]">
      {/* Page Header */}
      <div className="bg-[#FCFAF7] rounded-3xl border border-[#E8DCC4] p-4 sm:p-5 shadow-xs flex flex-col gap-3.5 w-full">
        <div className="flex items-start gap-3 w-full">
          <span className="p-2.5 rounded-2xl bg-[#F3EFE0] border border-[#E8DCC4] text-[#78350F] shrink-0">
            <CalendarIcon className="w-5 h-5 text-[#D97706]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#78350F] leading-snug">
                Auspicious Muhurta & Panchang Finder
              </h2>
              <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-lg bg-[#FEF3C7] text-[#78350F] border border-[#FDE68A] hidden sm:inline-flex shadow-2xs">
                Ref No: MUH-2026-881204
              </span>
            </div>
            <p className="text-xs text-[#8B735B] mt-1 leading-normal">
              Vedic planetary timing windows for House Warming, Construction Start & Sacred Ceremonies
            </p>
          </div>
        </div>

        {/* Location & Property Context Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 w-full pt-2.5 border-t border-[#E8DCC4]/60">
          <div className="bg-white border border-[#E8DCC4] rounded-2xl px-3 py-2 text-xs flex items-center gap-2 flex-1 min-w-[180px]">
            <MapPin className="w-4 h-4 text-[#D97706] shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase tracking-wider text-[#8B735B] font-bold block truncate">
                Audited Location
              </span>
              <span className="font-serif font-bold text-[#78350F] truncate block">
                {activeProperty ? activeProperty.name : 'Primary Residence'} ({activeCity.name})
              </span>
            </div>
          </div>

          <button
            onClick={handleExportPdfSchedule}
            disabled={isExportingPdf}
            className="px-3.5 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-all shadow-2xs flex items-center gap-1.5 shrink-0 whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-white shrink-0" />
            <span>{isExportingPdf ? 'PDF...' : 'Export Schedule'}</span>
          </button>
        </div>
      </div>

      {/* Selected Ceremony Overview Banner */}
      <div className="bg-[#FFFBEB] rounded-3xl border border-[#FDE68A] p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97706] bg-[#FEF3C7] px-2.5 py-0.5 rounded-full border border-[#FDE68A] inline-block">
              {ceremonyMeta.hindiTitle}
            </span>
            <h3 className="text-base font-serif font-bold text-[#78350F] mt-1">
              {ceremonyMeta.title}
            </h3>
            <p className="text-xs text-[#8B735B] leading-relaxed mt-0.5">{ceremonyMeta.description}</p>
          </div>

          {topMuhurta && (
            <div className="bg-white border border-[#FDE68A] p-3 rounded-2xl shrink-0 shadow-2xs w-full sm:w-auto text-left sm:text-right">
              <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded uppercase tracking-wider inline-block">
                ⭐ Top Ranked Date
              </span>
              <p className="text-xs font-serif font-bold text-[#78350F] mt-1">
                {topMuhurta.formattedDate}
              </p>
              <p className="text-[11px] font-bold text-[#D97706]">{topMuhurta.timeWindow}</p>
            </div>
          )}
        </div>

        {/* Favorable Vedic Factors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#FDE68A]/60 text-xs">
          <div>
            <span className="font-bold text-[#78350F] block mb-1">
              🌸 Favorable Vedic Months:
            </span>
            <div className="flex flex-wrap gap-1">
              {ceremonyMeta.favorableMonths.map((m, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-white rounded-lg border border-[#E8DCC4] text-[11px] text-[#78350F]"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="font-bold text-[#78350F] block mb-1">
              ✨ Favorable Nakshatras:
            </span>
            <div className="flex flex-wrap gap-1">
              {ceremonyMeta.favorableNakshatras.map((n, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-white rounded-lg border border-[#E8DCC4] text-[11px] text-[#059669]"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>



      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs -mt-2 bg-white/70 p-2 rounded-2xl border border-[#E8DCC4]/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B735B] shrink-0">
            Active:
          </span>
          {selectedCeremony !== 'griha_pravesh' && (
            <span className="bg-[#FFFBEB] text-[#78350F] border border-[#FDE68A] px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium text-xs">
              🚩 {ceremonyMeta.title}
              <button
                onClick={() => setSelectedCeremony('griha_pravesh')}
                className="hover:text-[#D97706] font-bold ml-1 text-sm"
              >
                ×
              </button>
            </span>
          )}
          {selectedMonth !== 'all' && (
            <span className="bg-[#FFFBEB] text-[#78350F] border border-[#FDE68A] px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium text-xs">
              📅 {selectedMonth}
              <button
                onClick={() => setSelectedMonth('all')}
                className="hover:text-[#D97706] font-bold ml-1 text-sm"
              >
                ×
              </button>
            </span>
          )}
          {selectedRashi !== 'all' && (
            <span className="bg-[#FFFBEB] text-[#78350F] border border-[#FDE68A] px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium text-xs">
              🌙 {selectedRashi}
              <button
                onClick={() => setSelectedRashi('all')}
                className="hover:text-[#D97706] font-bold ml-1 text-sm"
              >
                ×
              </button>
            </span>
          )}
          <button
            onClick={() => {
              setSelectedCeremony('griha_pravesh');
              setSelectedCityId('mumbai');
              setSelectedMonth('all');
              setSelectedRashi('all');
            }}
            className="text-xs text-[#D97706] hover:underline font-bold ml-auto"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* LIST VIEW OF MUHURTA DATES */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-serif font-bold text-[#78350F] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D97706]" /> Available Auspicious Windows (
              {filteredMuhurtas.length})
            </h3>
            <span className="text-[11px] text-[#8B735B]">
              Calculated for {activeCity.name} ({activeCity.timeZone})
            </span>
          </div>

          {filteredMuhurtas.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E8DCC4] p-8 text-center space-y-2">
              <CalendarIcon className="w-8 h-8 text-[#D97706] mx-auto opacity-60" />
              <h4 className="text-sm font-serif font-bold text-[#78350F]">
                No Muhurta dates found for selected filter
              </h4>
              <p className="text-xs text-[#8B735B]">
                Try choosing "All Months" or selecting a different ceremony type.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredMuhurtas.map((muh) => {
                const isSaved = savedMuhurtas.includes(muh.id);
                const isRashiMatch =
                  selectedRashi !== 'all' &&
                  (muh.recommendedRashis?.includes(selectedRashi) ||
                    muh.recommendedRashis?.includes('All Rashis auspicious during Navratri') ||
                    muh.recommendedRashis?.includes('All Rashis highly favored on Makar Sankranti'));

                return (
                  <div
                    key={muh.id}
                    className={`bg-white rounded-3xl border p-4 sm:p-5 space-y-3.5 transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSaved
                        ? 'border-[#D97706] ring-1 ring-[#D97706]/30 shadow-sm'
                        : 'border-[#E8DCC4] hover:border-[#D97706] shadow-2xs'
                    }`}
                  >
                    <div className="space-y-3.5">
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B735B] bg-[#FCFAF7] px-2 py-0.5 rounded border border-[#E8DCC4] inline-block">
                            {muh.month}
                          </span>
                          <h4 className="text-base font-serif font-bold text-[#78350F] mt-1 leading-tight">
                            {muh.formattedDate}
                          </h4>
                        </div>

                        {/* Score Badge */}
                        <div className="text-right shrink-0">
                          <div className="inline-flex items-center gap-1 bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-1 rounded-xl">
                            <Star className="w-3.5 h-3.5 fill-[#059669] text-[#059669]" />
                            <span className="text-xs font-bold text-[#065F46]">
                              {muh.suitabilityScore}% Score
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rashi Compatibility Alert Badge */}
                      {selectedRashi !== 'all' && isRashiMatch && (
                        <div className="bg-[#EFF6FF] border border-[#BFDBFE] px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 text-[#1E40AF]">
                          <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                          <span className="font-bold">
                            Highly Compatible with your Moon Sign ({selectedRashi})
                          </span>
                        </div>
                      )}

                      {/* Panchang Technical Attributes Pill Row */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#FCFAF7] p-2.5 rounded-2xl border border-[#E8DCC4]/80">
                        <div className="min-w-0">
                          <span className="text-[#8B735B] block">Tithi:</span>
                          <span className="font-bold text-[#78350F] truncate block">{muh.tithi}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-[#8B735B] block">Nakshatra:</span>
                          <span className="font-bold text-[#059669] truncate block">{muh.nakshatra}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-[#8B735B] block">Yoga / Karana:</span>
                          <span className="font-medium text-[#78350F] truncate block">
                            {muh.yoga} / {muh.karana}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-[#8B735B] block">Fixed Lagna:</span>
                          <span className="font-medium text-[#78350F] truncate block">{muh.fixedLagna}</span>
                        </div>
                      </div>

                      {/* Time Window Highlights */}
                      <div className="space-y-1.5">
                        <div className="bg-[#FEF3C7] border border-[#FDE68A] p-2.5 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <Clock className="w-4 h-4 text-[#D97706] shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] font-bold text-[#78350F] uppercase tracking-wider block truncate">
                                Primary Auspicious Time Window
                              </span>
                              <span className="font-serif font-bold text-[#92400E] block truncate">
                                {muh.timeWindow}
                              </span>
                            </div>
                          </div>
                          {muh.secondaryTimeWindow && (
                            <span className="text-[10px] font-bold text-[#B45309] bg-white px-2 py-0.5 rounded-lg border border-[#FDE68A] shrink-0 self-start sm:self-auto">
                              Abhijit: {muh.secondaryTimeWindow}
                            </span>
                          )}
                        </div>

                        {/* Forbidden Rahu Kalam Warning */}
                        <div className="bg-[#FEF2F2] border border-[#FCA5A5]/60 p-2 rounded-2xl text-[11px] flex items-center gap-2 text-[#991B1B]">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                          <span className="truncate">
                            <strong>Rahu Kalam (Avoid):</strong> {muh.rahuKalam}
                          </span>
                        </div>
                      </div>

                      {/* Summary Note */}
                      <p className="text-xs text-[#8B735B] leading-relaxed line-clamp-2">
                        {muh.summary}
                      </p>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-3 border-t border-[#E8DCC4]/60 flex items-center justify-between gap-2 mt-2">
                      <button
                        onClick={() => setSelectedMuhurtaDetail(muh)}
                        className="text-xs font-bold text-[#D97706] hover:text-[#B45309] flex items-center gap-1"
                      >
                        View Ritual Guidelines <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleSave(muh.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                          isSaved
                            ? 'bg-[#059669] text-white shadow-2xs'
                            : 'bg-[#FCFAF7] text-[#78350F] border border-[#E8DCC4] hover:bg-[#F3EFE0]'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" /> Saved
                          </>
                        ) : (
                          <>
                            <CalendarIcon className="w-3.5 h-3.5 text-[#D97706]" /> Save Date
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CALENDAR MONTH GRID VIEW */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-3xl border border-[#E8DCC4] p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-serif font-bold text-[#78350F]">
              📅 Panchang Calendar Overview ({selectedMonth === 'all' ? 'Upcoming Months' : selectedMonth})
            </h3>
            <span className="text-xs text-[#8B735B]">
              Highlighted badges indicate verified auspicious Muhurta dates
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMuhurtas.map((muh) => (
              <div
                key={muh.id}
                onClick={() => setSelectedMuhurtaDetail(muh)}
                className="p-4 rounded-2xl border border-[#E8DCC4] bg-[#FCFAF7] hover:bg-white hover:border-[#D97706] cursor-pointer transition-all space-y-2"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[#E8DCC4]/60 pb-2">
                  <span className="text-[11px] font-bold text-[#D97706] bg-[#FEF3C7] px-2.5 py-1 rounded-xl border border-[#FDE68A] shrink-0">
                    {muh.month}
                  </span>
                  <span className="text-xs font-bold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-1 rounded-xl shrink-0">
                    ⭐ {muh.suitabilityScore}% Rating
                  </span>
                </div>

                <p className="text-sm font-serif font-bold text-[#78350F] pt-1 leading-snug">
                  {muh.formattedDate}
                </p>

                <div className="text-[11px] text-[#8B735B] space-y-1">
                  <p>
                    <strong>Tithi:</strong> {muh.tithi}
                  </p>
                  <p>
                    <strong>Nakshatra:</strong> {muh.nakshatra}
                  </p>
                  <p className="text-[#92400E] font-bold">
                    <strong>Time:</strong> {muh.timeWindow}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ESSENTIAL VASTU RITUALS & SAMAGRI CHECKLIST */}
      <div className="bg-[#FCFAF7] rounded-3xl border border-[#E8DCC4] p-5 space-y-3">
        <h3 className="text-sm font-serif font-bold text-[#78350F] flex items-center gap-2">
          <Info className="w-4 h-4 text-[#D97706]" /> Essential Samagri & Ritual Preparation Rules
        </h3>
        <p className="text-xs text-[#8B735B]">
          Follow these time-tested Vedic steps during your chosen Muhurta time window to invoke lasting harmony:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {ceremonyMeta.importantRitualNotes.map((note, idx) => (
            <div
              key={idx}
              className="bg-white p-3 rounded-2xl border border-[#E8DCC4] text-xs space-y-1 flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
              <p className="text-[#6B5A4B] leading-relaxed">{note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* DETAILED MUHURTA POPUP MODAL */}
      {selectedMuhurtaDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E8DCC4] max-w-lg w-full p-6 space-y-4 max-h-[70vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DCC4]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded border border-[#FDE68A]">
                  Panchang Muhurta Deep Dive
                </span>
                <h3 className="text-lg font-serif font-bold text-[#78350F] mt-1">
                  {selectedMuhurtaDetail.formattedDate}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMuhurtaDetail(null)}
                className="w-8 h-8 rounded-full bg-[#F3EFE0] text-[#78350F] hover:bg-[#E8DCC4] font-bold text-sm flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Time Window Highlights */}
            <div className="bg-[#FEF3C7] border border-[#FDE68A] p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#78350F]">Primary Auspicious Window:</span>
                <span className="font-serif font-extrabold text-[#92400E] text-sm">
                  {selectedMuhurtaDetail.timeWindow}
                </span>
              </div>
              <p className="text-[#8B735B]">
                <strong>Fixed Lagna:</strong> {selectedMuhurtaDetail.fixedLagna}
              </p>
            </div>

            {/* Panchang Breakdown */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-[#78350F] uppercase tracking-wider text-[11px]">
                Planetary Attributes (Panchang)
              </h4>
              <div className="grid grid-cols-2 gap-2 bg-[#FCFAF7] p-3 rounded-2xl border border-[#E8DCC4]">
                <p>
                  <strong>Tithi:</strong> {selectedMuhurtaDetail.tithi}
                </p>
                <p>
                  <strong>Nakshatra:</strong> {selectedMuhurtaDetail.nakshatra}
                </p>
                <p>
                  <strong>Yoga:</strong> {selectedMuhurtaDetail.yoga}
                </p>
                <p>
                  <strong>Karana:</strong> {selectedMuhurtaDetail.karana}
                </p>
              </div>
            </div>

            {/* Warnings */}
            <div className="bg-[#FEF2F2] border border-[#FCA5A5]/60 p-3 rounded-2xl text-xs space-y-1 text-[#991B1B]">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" /> Forbidden Time Window:
              </p>
              <p>
                <strong>Rahu Kalam:</strong> {selectedMuhurtaDetail.rahuKalam}
              </p>
            </div>

            {/* Step-by-Step Guidelines */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-[#78350F] uppercase tracking-wider text-[11px]">
                Prescribed Ritual Instructions
              </h4>
              <ul className="space-y-1.5">
                {selectedMuhurtaDetail.guidelines.map((g, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[#6B5A4B]">
                    <span className="text-[#D97706] font-bold">•</span> {g}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-[#E8DCC4] flex gap-2">
              <button
                onClick={() => setSelectedMuhurtaDetail(null)}
                className="w-full py-2.5 bg-[#78350F] text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#5C280B] transition-all"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Filter Opt-In Button (Sticky Hovering Above Bottom Navigation Menu Bar) */}
      <div className="sticky bottom-3 z-40 flex justify-center w-full pointer-events-none mt-4">
        <div className="pointer-events-auto bg-[#78350F] text-white rounded-full p-1.5 shadow-xl border border-[#D97706]/40 flex items-center gap-2 backdrop-blur-md">
          <button
            onClick={() => {
              playTempleBellChime();
              setIsFilterModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-[#5C280B] transition-all"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#F59E0B]" />
            <span>Panchang Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#D97706] text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="h-4 w-[1px] bg-[#9A4918]" />

          <div className="flex items-center gap-0.5 pr-1">
            <button
              onClick={() => setViewMode('list')}
              title="List View"
              className={`p-1.5 rounded-full text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-[#D97706] text-white'
                  : 'text-[#E8DCC4] hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              title="Calendar View"
              className={`p-1.5 rounded-full text-xs font-bold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-[#D97706] text-white'
                  : 'text-[#E8DCC4] hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Filter Opt-In Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2.5 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#FCFAF7] rounded-3xl border border-[#E8DCC4] max-w-md w-full p-3.5 sm:p-6 shadow-2xl relative space-y-4 max-h-[70vh] overflow-y-auto overflow-x-hidden">
            {/* Close Button */}
            <button
              onClick={() => setIsFilterModalOpen(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 rounded-full text-[#8B735B] hover:text-[#78350F] hover:bg-[#F3EFE0] transition-all z-10"
              title="Close Filters"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Filter Options Form */}
            <div className="space-y-4 text-xs">
              {/* Event / Ceremony 5-Petal Lotus Flower Filter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#78350F] flex items-center gap-1.5 text-sm">
                    <Sparkles className="w-4 h-4 text-[#D97706]" />
                    Select Sacred Event / Ceremony
                  </label>
                </div>

                {/* 5-Petal Flower Rangoli Radial Layout (Dynamically Scaled for Mobile) */}
                <div className="w-full flex items-center justify-center overflow-hidden py-1">
                  <div className="relative w-[340px] sm:w-[385px] h-[340px] sm:h-[385px] shrink-0 scale-[0.76] min-[380px]:scale-[0.85] min-[440px]:scale-[0.92] sm:scale-100 origin-center -my-10 min-[380px]:-my-6 min-[440px]:-my-3 sm:my-1 transition-transform">
                  {/* SVG Background Rangoli Petal Art */}
                  <svg viewBox="0 0 360 360" className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-md">
                    <defs>
                      <linearGradient id="activePetalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#D97706" />
                        <stop offset="50%" stopColor="#B45309" />
                        <stop offset="100%" stopColor="#78350F" />
                      </linearGradient>

                      <linearGradient id="crimsonPetalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#EF4444" />
                        <stop offset="50%" stopColor="#DC2626" />
                        <stop offset="100%" stopColor="#991B1B" />
                      </linearGradient>

                      <radialGradient id="flowerAura" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.9" />
                        <stop offset="60%" stopColor="#FFFBEB" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.1" />
                      </radialGradient>

                      <filter id="rangoliGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#78350F" floodOpacity="0.2" />
                      </filter>
                    </defs>

                    {/* Decorative Backdrop Aura */}
                    <circle cx="180" cy="180" r="175" fill="url(#flowerAura)" />

                    {/* Outer Rangoli Swirling Vines (Kolam Art Style) */}
                    {[ -90, -18, 54, 126, 198 ].map((deg, i) => {
                      const rad = (deg * Math.PI) / 180;
                      const radNext = ((deg + 72) * Math.PI) / 180;

                      // Vine start/end coordinates (+10% scaled)
                      const x1 = 180 + 50 * Math.cos(rad);
                      const y1 = 180 + 50 * Math.sin(rad);
                      const x2 = 180 + 148 * Math.cos(radNext);
                      const y2 = 180 + 148 * Math.sin(radNext);

                      // Swirl control points
                      const cx1 = 180 + 121 * Math.cos(rad + 0.35);
                      const cy1 = 180 + 121 * Math.sin(rad + 0.35);
                      const cx2 = 180 + 176 * Math.cos(radNext - 0.25);
                      const cy2 = 180 + 176 * Math.sin(radNext - 0.25);

                      // Spiral loop dot
                      const sx = 180 + 126 * Math.cos(rad + 0.55);
                      const sy = 180 + 126 * Math.sin(rad + 0.55);

                      return (
                        <g key={`vine-${i}`} filter="url(#rangoliGlow)">
                          {/* Shadow Vine Line */}
                          <path
                            d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
                            fill="none"
                            stroke="#78350F"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            opacity="0.3"
                          />
                          {/* White Rangoli Vine Line */}
                          <path
                            d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
                            fill="none"
                            stroke="#FFFFFF"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                          {/* Decorative Spiral Tendril */}
                          <path
                            d={`M ${cx1} ${cy1} Q ${sx} ${sy} ${sx - 6 * Math.sin(rad)} ${sy + 6 * Math.cos(rad)}`}
                            fill="none"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <circle cx={sx} cy={sy} r="3.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1" />
                        </g>
                      );
                    })}

                    {/* Central 6-Petal Crimson Rangoli Flower */}
                    {[ 0, 60, 120, 180, 240, 300 ].map((deg, i) => {
                      const rad = (deg * Math.PI) / 180;
                      const tipX = 180 + 48 * Math.cos(rad);
                      const tipY = 180 + 48 * Math.sin(rad);
                      const c1X = 180 + 29 * Math.cos(rad - 0.45);
                      const c1Y = 180 + 29 * Math.sin(rad - 0.45);
                      const c2X = 180 + 29 * Math.cos(rad + 0.45);
                      const c2Y = 180 + 29 * Math.sin(rad + 0.45);

                      return (
                        <path
                          key={`center-petal-${i}`}
                          d={`M 180 180 Q ${c1X} ${c1Y} ${tipX} ${tipY} Q ${c2X} ${c2Y} 180 180 Z`}
                          fill="url(#crimsonPetalGrad)"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                      );
                    })}

                    {/* Render 5 Main Petal Lotus Blooms Outward (+10% Larger) */}
                    {[
                      { id: 'griha_pravesh', angle: -90 },
                      { id: 'bhumi_pujan', angle: -18 },
                      { id: 'chaukhat_sthapana', angle: 54 },
                      { id: 'borewell', angle: 126 },
                      { id: 'pooja_room', angle: 198 },
                    ].map((p) => {
                      const isSel = selectedCeremony === p.id;
                      const rad = (p.angle * Math.PI) / 180;

                      // 10% Larger Petal dimensions
                      const tipX = 180 + 168 * Math.cos(rad);
                      const tipY = 180 + 168 * Math.sin(rad);
                      const c1X = 180 + 102 * Math.cos(rad - 0.48);
                      const c1Y = 180 + 102 * Math.sin(rad - 0.48);
                      const c2X = 180 + 102 * Math.cos(rad + 0.48);
                      const c2Y = 180 + 102 * Math.sin(rad + 0.48);

                      // Golden Stamen center inside petal tip
                      const stamenX = 180 + 144 * Math.cos(rad);
                      const stamenY = 180 + 144 * Math.sin(rad);

                      return (
                        <g key={`petal-${p.id}`} filter="url(#rangoliGlow)">
                          {/* Outer White Rangoli Border */}
                          <path
                            d={`M 180 180 Q ${c1X} ${c1Y} ${tipX} ${tipY} Q ${c2X} ${c2Y} 180 180 Z`}
                            fill="none"
                            stroke="#FFFFFF"
                            strokeWidth={isSel ? '5.5' : '3.5'}
                          />
                          {/* Inner Colored Petal Fill */}
                          <path
                            d={`M 180 180 Q ${c1X} ${c1Y} ${tipX} ${tipY} Q ${c2X} ${c2Y} 180 180 Z`}
                            fill={isSel ? 'url(#activePetalGrad)' : '#FFFBEB'}
                            stroke={isSel ? '#F59E0B' : '#E8DCC4'}
                            strokeWidth={isSel ? '2' : '1'}
                            className="transition-all duration-300"
                          />
                          {/* Yellow Golden Rangoli Lotus Stamen Dot */}
                          <circle
                            cx={stamenX}
                            cy={stamenY}
                            r={isSel ? '6.5' : '5'}
                            fill="#F59E0B"
                            stroke="#FFFFFF"
                            strokeWidth="1.5"
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Center Circle Hub labeled "EVENT" */}
                  <div className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-br from-[#78350F] via-[#B45309] to-[#451A03] border-4 border-[#FDE68A] shadow-2xl flex flex-col items-center justify-center text-center p-1 cursor-default pointer-events-auto ring-4 ring-[#DC2626]/40">
                    <Sparkles className="w-4.5 h-4.5 text-[#FDE68A] animate-pulse mb-0.5" />
                    <span className="text-xs sm:text-sm font-serif font-black text-[#FEF3C7] tracking-wider uppercase drop-shadow-xs">
                      EVENT
                    </span>
                  </div>

                  {/* 5 Petal Interactive Option Buttons (+10% Scaled Position & Size) */}
                  {[
                    { id: 'griha_pravesh', label: 'Griha Pravesh', sub: 'House Warming', x: 0, y: -124 },
                    { id: 'bhumi_pujan', label: 'Bhumi Pujan', sub: 'Construction', x: 118, y: -38 },
                    { id: 'chaukhat_sthapana', label: 'Chaukhat', sub: 'Door Frame', x: 73, y: 101 },
                    { id: 'borewell', label: 'Borewell', sub: 'Water Boring', x: -73, y: 101 },
                    { id: 'pooja_room', label: 'Mandir Sthapana', sub: 'Pooja Altar', x: -118, y: -38 },
                  ].map((item) => {
                    const isSel = selectedCeremony === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedCeremony(item.id as CeremonyType);
                          playTempleBellChime();
                        }}
                        style={{
                          left: `calc(50% + ${item.x}px)`,
                          top: `calc(50% + ${item.y}px)`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className={`absolute z-30 w-[106px] sm:w-[116px] p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center shadow-lg ${
                          isSel
                            ? 'bg-[#78350F] text-white border-[#F59E0B] ring-4 ring-[#F59E0B]/50 scale-110 z-40'
                            : 'bg-white/95 backdrop-blur-xs text-[#78350F] border-[#E8DCC4] hover:bg-[#FEF3C7] hover:border-[#D97706]'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <span className={isSel ? 'text-[#F59E0B]' : 'text-[#D97706]'}>
                            {getCeremonyIcon(item.id as CeremonyType)}
                          </span>
                          {isSel && <Check className="w-3.5 h-3.5 text-[#F59E0B]" />}
                        </div>
                        <span className="text-[11px] sm:text-xs font-serif font-bold leading-tight block w-full truncate">
                          {item.label}
                        </span>
                        <span
                          className={`text-[9px] block w-full truncate ${
                            isSel ? 'text-[#FDE68A]' : 'text-[#8B735B]'
                          }`}
                        >
                          {item.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

              {/* Month Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#78350F] flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-[#D97706]" />
                  Target Month / Hindu Masa
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-white border border-[#E8DCC4] rounded-2xl p-2.5 font-medium text-[#78350F] outline-none focus:ring-2 focus:ring-[#D97706]"
                >
                  <option value="all">All Months</option>
                  <option value="August 2026">August 2026</option>
                  <option value="September 2026">September 2026</option>
                  <option value="October 2026">October 2026 (Navratri)</option>
                  <option value="November 2026">November 2026 (Kartika)</option>
                  <option value="December 2026">December 2026</option>
                  <option value="January 2027">January 2027 (Makar Sankranti)</option>
                </select>
              </div>

              {/* Moon Sign Rashi Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#78350F] flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-[#D97706]" />
                  Personal Moon Sign (Janma Rashi)
                </label>
                <select
                  value={selectedRashi}
                  onChange={(e) => setSelectedRashi(e.target.value)}
                  className="w-full bg-white border border-[#E8DCC4] rounded-2xl p-2.5 font-medium text-[#78350F] outline-none focus:ring-2 focus:ring-[#D97706]"
                >
                  <option value="all">All Moon Signs (General)</option>
                  <option value="Aries">Aries (Mesha)</option>
                  <option value="Taurus">Taurus (Vrishabha)</option>
                  <option value="Gemini">Gemini (Mithuna)</option>
                  <option value="Cancer">Cancer (Karka)</option>
                  <option value="Leo">Leo (Simha)</option>
                  <option value="Virgo">Virgo (Kanya)</option>
                  <option value="Libra">Libra (Tula)</option>
                  <option value="Scorpio">Scorpio (Vrishchika)</option>
                  <option value="Sagittarius">Sagittarius (Dhanu)</option>
                  <option value="Capricorn">Capricorn (Makara)</option>
                  <option value="Aquarius">Aquarius (Kumbha)</option>
                  <option value="Pisces">Pisces (Meena)</option>
                </select>
                <p className="text-[11px] text-[#8B735B]">
                  Filters dates that have special compatibility with your rashi.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#E8DCC4] flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedCeremony('griha_pravesh');
                  setSelectedCityId('mumbai');
                  setSelectedMonth('all');
                  setSelectedRashi('all');
                  setViewMode('list');
                }}
                className="px-4 py-2.5 bg-white border border-[#E8DCC4] text-[#8B735B] hover:text-[#78350F] text-xs font-bold rounded-2xl flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="flex-1 py-2.5 bg-[#78350F] hover:bg-[#5C280B] text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
