import React, { useState, useEffect } from 'react';
import { FESTIVAL_POOJA_DATA, FestivalPoojaData } from '../data/festivalPoojaData';
import { jsPDF } from 'jspdf';
import {
  Flame,
  Sparkles,
  Sun,
  Crown,
  Shield,
  Compass,
  Calendar,
  Moon,
  Heart,
  Gift,
  Download,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  ChevronRight,
  FileText,
  Printer,
  Sparkle,
  Layers,
  Building,
  Check,
  RefreshCw,
} from 'lucide-react';

interface KalashamPoojaGuideViewProps {
  onOpenConsult?: () => void;
  initialFestivalId?: string;
}

export const KalashamPoojaGuideView: React.FC<KalashamPoojaGuideViewProps> = ({ onOpenConsult, initialFestivalId }) => {
  const [selectedYear, setSelectedYear] = useState<2026 | 2027>(2026);
  const [selectedFestivalId, setSelectedFestivalId] = useState<string>(initialFestivalId || 'diwali');

  useEffect(() => {
    if (initialFestivalId) {
      setSelectedFestivalId(initialFestivalId);
    }
  }, [initialFestivalId]);
  const [activeTab, setActiveTab] = useState<'vidhi' | 'samagri'>('vidhi');
  const [checkedVidhiSteps, setCheckedVidhiSteps] = useState<Record<number, boolean>>({});
  const [checkedSamagriItems, setCheckedSamagriItems] = useState<Record<string, boolean>>({});
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);

  const selectedFestival: FestivalPoojaData =
    FESTIVAL_POOJA_DATA.find((f) => f.id === selectedFestivalId) || FESTIVAL_POOJA_DATA[0];

  const yearDetails = selectedFestival.dates[selectedYear];

  const toggleVidhiStep = (stepNumber: number) => {
    setCheckedVidhiSteps((prev) => ({ ...prev, [stepNumber]: !prev[stepNumber] }));
  };

  const toggleSamagriItem = (itemId: string) => {
    setCheckedSamagriItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleExportPdf = () => {
    setGeneratingPdf(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      let y = margin;

      // Header Banner
      doc.setFillColor(120, 53, 15); // #78350F
      doc.rect(0, 0, pageWidth, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('VASTU DRISHTI • SACRED POOJA VIDHI & PANCHANG GUIDE', margin, 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(232, 220, 196);
      doc.text(`${selectedFestival.title.toUpperCase()} (${selectedYear}) • OFFICIAL VEDIC REFERENCE`, margin, 19);

      doc.setFillColor(217, 119, 6); // Gold strip
      doc.rect(0, 26, pageWidth, 1.5, 'F');

      y = 33;

      // Festival Info Card
      doc.setFillColor(252, 250, 247);
      doc.setDrawColor(232, 220, 196);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 34, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(120, 53, 15);
      doc.text(`${selectedFestival.title} (${selectedYear})`, margin + 4, y + 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(217, 119, 6);
      doc.text(`Date: ${yearDetails.dateDisplay}`, margin + 4, y + 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(60, 50, 45);
      doc.text(`Tithi: ${yearDetails.tithi} | Nakshatra: ${yearDetails.nakshatra} | Yoga: ${yearDetails.yoga}`, margin + 4, y + 20);
      doc.text(`Deity: ${selectedFestival.deity} | Facing Direction: ${yearDetails.facingDirection}`, margin + 4, y + 25);
      doc.text(`Start Window: ${yearDetails.startWindow} | Rahu Kalam (Avoid): ${yearDetails.rahuKalam}`, margin + 4, y + 30);

      y += 40;

      // Section: Samagri Checklist
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(120, 53, 15);
      doc.text('ITEMIZED SAMAGRI CHECKLIST:', margin, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      selectedFestival.samagriList.forEach((item, index) => {
        doc.setTextColor(60, 50, 45);
        const lineText = `[  ] ${index + 1}. ${item.name} (${item.quantity}) - ${item.purpose}`;
        doc.text(lineText, margin + 2, y);
        y += 5;
      });

      y += 5;

      // Section: Sequential Vidhi & Mantras
      if (y > pageHeight - 60) {
        doc.addPage();
        y = margin;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(120, 53, 15);
      doc.text('STEP-BY-STEP RITUAL VIDHI & SANCTIFIED MANTRAS:', margin, y);
      y += 6;

      selectedFestival.vidhiSteps.forEach((step) => {
        if (y > pageHeight - 45) {
          doc.addPage();
          y = margin;
        }

        doc.setFillColor(243, 239, 224);
        doc.setDrawColor(232, 220, 196);
        doc.roundedRect(margin, y, pageWidth - margin * 2, 7, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(120, 53, 15);
        doc.text(`Step ${step.stepNumber}: ${step.title} (${step.timing})`, margin + 3, y + 4.8);

        y += 9;

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(180, 83, 9);
        doc.text(`Mantra: ${step.mantraEnglish}`, margin + 2, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(60, 50, 45);
        const splitInstructions = doc.splitTextToSize(`Guidance: ${step.instructions}`, pageWidth - margin * 2 - 4);
        doc.text(splitInstructions, margin + 2, y);

        y += splitInstructions.length * 4.2 + 4;
      });

      // Footer Stamp
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(140, 120, 100);
      doc.text(`Generated by Vastu Compass Vedic App • ${new Date().toLocaleDateString()}`, margin, pageHeight - 8);

      doc.save(`VastuCompass_${selectedFestival.id}_${selectedYear}_Vidhi_Guide.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const getFestivalIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-5 h-5 text-amber-500" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'Sun':
        return <Sun className="w-5 h-5 text-amber-500" />;
      case 'Crown':
        return <Crown className="w-5 h-5 text-amber-500" />;
      case 'Shield':
        return <Shield className="w-5 h-5 text-amber-500" />;
      case 'Compass':
        return <Compass className="w-5 h-5 text-amber-500" />;
      case 'Moon':
        return <Moon className="w-5 h-5 text-amber-500" />;
      case 'Heart':
        return <Heart className="w-5 h-5 text-amber-500" />;
      case 'Gift':
        return <Gift className="w-5 h-5 text-amber-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#4A1D07] via-[#78350F] to-[#3D1A08] p-6 sm:p-8 text-[#F3EFE0] shadow-lg border border-[#D97706]/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D97706]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-[#D97706] to-[#78350F] p-0.5 shrink-0 shadow-md flex flex-col items-center justify-center border border-[#FEF3C7]/30">
              <div className="w-full h-full rounded-[14px] bg-[#4A1D07] flex flex-col items-center justify-center p-2 text-center">
                <span className="text-2xl sm:text-3xl">🪔</span>
                <span className="text-[8px] font-bold text-[#FDE68A] uppercase tracking-tighter mt-0.5">KALASHAM</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D97706]/20 border border-[#D97706]/40 text-[#FDE68A] text-[10px] font-bold uppercase tracking-widest">
                <Sparkles className="w-3 h-3 text-[#FDE68A] animate-pulse" />
                Panchang & Sacred Pooja Vidhi Engine • Ref No: PJA-2026-771920
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
                Festival Panchang & Step-by-Step Pooja Vidhi
              </h2>
              <p className="text-xs text-[#E8DCC4] max-w-xl leading-relaxed">
                Complete Vedic guidance on when to start Pooja during major festivals, precise Panchang time windows, Kalasham installation, and authentic step-by-step rituals.
              </p>
            </div>
          </div>

          {/* Action Buttons Top Right */}
          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={() => setSelectedYear(selectedYear === 2026 ? 2027 : 2026)}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all border border-[#FDE68A]/30"
            >
              <Calendar className="w-4 h-4 text-[#FEF3C7]" />
              <span>Viewing Year: {selectedYear}</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={generatingPdf}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-white/10 hover:bg-white/20 text-[#F3EFE0] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all border border-white/20 disabled:opacity-50"
            >
              {generatingPdf ? <RefreshCw className="w-4 h-4 animate-spin text-[#FDE68A]" /> : <Download className="w-4 h-4 text-[#FDE68A]" />}
              <span>Export PDF Vidhi</span>
            </button>
          </div>
        </div>
      </div>

      {/* SELECTOR FOR FESTIVAL OR VASTU CEREMONY (HORIZONTAL SCROLL) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[#78350F] uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#D97706]" /> Select Festival or Vastu Ceremony:
          </span>
          <span className="text-[11px] font-medium text-[#8B735B]">
            Panchang Year: <strong className="text-[#78350F]">{selectedYear}</strong>
          </span>
        </div>

        {/* Horizontal Scrollable Row */}
        <div className="flex overflow-x-auto gap-3 pb-2 pt-1 px-1 scrollbar-thin scrollbar-thumb-[#D97706]/40 scrollbar-track-transparent">
          {FESTIVAL_POOJA_DATA.map((fest) => {
            const isSelected = fest.id === selectedFestivalId;
            const datesInfo = fest.dates[selectedYear];

            return (
              <button
                key={fest.id}
                onClick={() => setSelectedFestivalId(fest.id)}
                className={`min-w-[230px] sm:min-w-[270px] shrink-0 p-3 rounded-2xl text-left transition-all border flex items-center gap-3 shadow-2xs ${
                  isSelected
                    ? 'bg-[#78350F] text-[#F3EFE0] border-[#5C280B] ring-2 ring-[#D97706]'
                    : 'bg-[#FCFAF7] hover:bg-[#F3EFE0] border-[#E8DCC4] text-[#3D342D]'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-[#D97706] text-white' : 'bg-[#F3EFE0] text-[#78350F]'
                  }`}
                >
                  {getFestivalIcon(fest.iconName)}
                </div>

                <div className="space-y-0.5 overflow-hidden">
                  <div className="font-serif font-bold text-xs truncate">{fest.title}</div>
                  <div className={`text-[10px] truncate ${isSelected ? 'text-[#FDE68A]' : 'text-[#8B735B]'}`}>
                    {datesInfo.dateDisplay.split(',')[1]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* FESTIVAL HEADER & MAIN TIMINGS PANCHANG DISPLAY */}
      <div className="bg-[#FCFAF7] border border-[#E8DCC4] rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8DCC4] pb-4">
          <div className="space-y-1">
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] font-bold text-[10px] uppercase tracking-wider border border-[#FDE68A]">
              {selectedFestival.titleSanskrit}
            </div>
            <h3 className="font-serif font-bold text-xl text-[#78350F]">
              {selectedFestival.title} ({selectedYear})
            </h3>
            <p className="text-xs text-[#8B735B] max-w-2xl leading-relaxed">
              {selectedFestival.description}
            </p>
          </div>

          <div className="bg-white border border-[#E8DCC4] rounded-2xl p-4 text-right shadow-2xs shrink-0 self-start md:self-auto">
            <div className="text-[10px] font-bold text-[#8B735B] uppercase tracking-wider">Festival Date ({selectedYear})</div>
            <div className="text-sm font-serif font-bold text-[#D97706] mt-0.5">{yearDetails.dateDisplay}</div>
          </div>
        </div>

        {/* 4 HIGH-VISIBILITY PANCHANG & MUHURTA CARDS (2x2 TILE LAYOUT) */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
          {/* Card 1: Start Pooja Window */}
          <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-3 sm:p-4 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 text-[#065F46] text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              Start Pooja Window
            </div>
            <div className="text-sm sm:text-base font-bold text-[#047857]">{yearDetails.startWindow}</div>
            <div className="text-[10px] text-[#065F46] font-medium">({yearDetails.startWindowLabel})</div>
          </div>

          {/* Card 2: Peak Muhurta */}
          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-3 sm:p-4 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 text-[#92400E] text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
              Peak Muhurta
            </div>
            <div className="text-sm sm:text-base font-bold text-[#B45309]">{yearDetails.peakMuhurta}</div>
            <div className="text-[10px] text-[#92400E] font-medium">({yearDetails.peakMuhurtaLagna})</div>
          </div>

          {/* Card 3: Facing Direction */}
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-3 sm:p-4 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 text-[#1E40AF] text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
              Facing Direction
            </div>
            <div className="text-xs sm:text-sm font-bold text-[#1D4ED8]">{yearDetails.facingDirection}</div>
            <div className="text-[10px] text-[#1E40AF] font-medium">{yearDetails.facingZone}</div>
          </div>

          {/* Card 4: Inauspicious Timings (Rahu Kalam & Dur Muhurta Avoid) */}
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-3 sm:p-4 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 text-[#991B1B] text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
              Inauspicious (Avoid)
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-[#DC2626]">
                <span className="text-[#991B1B] font-medium text-[10px] uppercase">Rahu Kalam:</span> {yearDetails.rahuKalam}
              </div>
              <div className="text-xs font-bold text-[#B91C1C]">
                <span className="text-[#991B1B] font-medium text-[10px] uppercase">Dur Muhurta:</span> {yearDetails.durMuhurta}
              </div>
            </div>
            <div className="text-[9px] sm:text-[10px] text-[#991B1B] font-medium italic">Strictly avoid starting Pujan</div>
          </div>
        </div>

        {/* Tithi & Panchang Details Bar */}
        <div className="bg-white border border-[#E8DCC4] rounded-2xl p-4 text-xs flex flex-wrap items-center justify-between gap-4 text-[#3D342D]">
          <div>
            <span className="font-bold text-[#78350F]">Tithi:</span> {yearDetails.tithi}
          </div>
          <div>
            <span className="font-bold text-[#78350F]">Nakshatra:</span> {yearDetails.nakshatra}
          </div>
          <div>
            <span className="font-bold text-[#78350F]">Yoga:</span> {yearDetails.yoga}
          </div>
          <div>
            <span className="font-bold text-[#78350F]">Deity:</span> {selectedFestival.deity}
          </div>
        </div>

        {/* TOGGLE TAB FOR VIDHI OR SAMAGRI */}
        <div className="flex bg-[#FFFBEB] p-1.5 rounded-2xl gap-1.5 border-4 border-double border-[#D97706] shadow-2xs">
          <button
            onClick={() => setActiveTab('vidhi')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'vidhi'
                ? 'bg-[#78350F] text-[#FFFBEB] border border-[#FDE68A] shadow-xs'
                : 'text-[#78350F] hover:bg-[#FEF3C7] hover:text-[#5C280B]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#D97706] shrink-0" />
            <span>Pooja Vidhi ({selectedFestival.vidhiSteps.length} Steps)</span>
          </button>

          <button
            onClick={() => setActiveTab('samagri')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'samagri'
                ? 'bg-[#78350F] text-[#FFFBEB] border border-[#FDE68A] shadow-xs'
                : 'text-[#78350F] hover:bg-[#FEF3C7] hover:text-[#5C280B]'
            }`}
          >
            <FileText className="w-4 h-4 text-[#D97706] shrink-0" />
            <span>Samagri Checklist ({selectedFestival.samagriList.length} Items)</span>
          </button>
        </div>

        {/* TAB 1: SEQUENTIAL POOJA VIDHI & SANCTIFIED MANTRAS */}
        {activeTab === 'vidhi' && (
          <div className="space-y-4">
            {selectedFestival.vidhiSteps.map((step) => {
              const isDone = !!checkedVidhiSteps[step.stepNumber];

              return (
                <div
                  key={step.stepNumber}
                  onClick={() => toggleVidhiStep(step.stepNumber)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs space-y-3 ${
                    isDone
                      ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#14532D]'
                      : 'bg-white border-[#E8DCC4] text-[#3D342D] hover:border-[#D97706]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#E8DCC4]/50 pb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          isDone ? 'bg-[#10B981] text-white' : 'bg-[#F3EFE0] text-[#78350F]'
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4" /> : step.stepNumber}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-serif font-bold text-sm sm:text-base text-[#78350F]">
                            {step.title}
                          </h4>
                          <span className="text-[10px] font-sans px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] font-semibold whitespace-nowrap">
                            {step.timing}
                          </span>
                        </div>
                        <div className="text-xs text-[#8B735B] font-medium">{step.subtitle}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVidhiStep(step.stepNumber);
                      }}
                      className={`self-start sm:self-auto shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border whitespace-nowrap cursor-pointer shadow-2xs ${
                        isDone
                          ? 'bg-[#10B981] text-white border-[#059669]'
                          : 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A] hover:bg-[#FEF3C7]'
                      }`}
                    >
                      {isDone ? '✓ COMPLETED' : 'MARK DONE'}
                    </button>
                  </div>

                  {/* Sanskrit Mantra Box */}
                  <div className="bg-[#FAF7F2] border border-[#E8DCC4] p-3.5 rounded-xl space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#D97706]">Sanskrit Mantra:</div>
                    <div className="font-serif font-bold text-xs text-[#78350F] leading-relaxed">{step.mantraSanskrit}</div>
                    <div className="text-[11px] text-[#8B735B] italic font-sans mt-0.5">{step.mantraEnglish}</div>
                  </div>

                  {/* Instructions */}
                  <div className="text-xs leading-relaxed text-[#3D342D] font-medium pt-1">
                    <strong>Guidance:</strong> {step.instructions}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: SAMAGRI CHECKLIST */}
        {activeTab === 'samagri' && (
          <div className="space-y-3">
            <div className="text-xs text-[#8B735B] font-medium">
              Tick items as you arrange them for ceremony preparation:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedFestival.samagriList.map((item) => {
                const isChecked = !!checkedSamagriItems[item.id];

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSamagriItem(item.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 shadow-2xs ${
                      isChecked
                        ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#14532D]'
                        : 'bg-white border-[#E8DCC4] text-[#3D342D] hover:border-[#D97706]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                        isChecked ? 'bg-[#10B981] text-white' : 'border border-[#CBD5E1] bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </div>

                    <div className="space-y-0.5">
                      <div className="font-bold text-xs text-[#78350F] flex items-center gap-2">
                        <span>{item.name}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#F3EFE0] text-[#8B735B] font-medium border border-[#E8DCC4]">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8B735B] leading-relaxed">{item.purpose}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
