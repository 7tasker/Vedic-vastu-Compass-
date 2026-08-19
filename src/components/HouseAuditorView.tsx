import React, { useState, useEffect } from 'react';
import { PlacedRoom, RoomType, PropertyRecord, SubscriptionPlanId, UserProfile } from '../types';
import { ROOM_DEFINITIONS, VASTU_ZONES, SUBSCRIPTION_PLANS } from '../data/vastuData';
import { calculateHouseAudit, playTempleBellChime, getZoneFromDegree } from '../utils/vastuUtils';
import { generateVastuPDFReport } from '../utils/pdfGenerator';
import { recordAuditReportInFirestore } from '../lib/firebase';
import { RoomSelectorModal, getRoomIconComponent } from './RoomSelectorModal';
import {
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Flame,
  Droplet,
  Mountain,
  Wind,
  Globe,
  Compass,
  ArrowRight,
  RotateCcw,
  Building2,
  MapPin,
  Lock,
  Sparkles,
  Key,
  ShieldCheck,
  DoorClosed,
  X,
  Clock,
  Calendar,
  Shield,
  Check,
  Download,
  FileText,
  ChevronDown,
  LayoutGrid,
} from 'lucide-react';

interface HouseAuditorViewProps {
  placedRooms: PlacedRoom[];
  onAddRoom: (room: PlacedRoom) => void;
  onRemoveRoom: (id: string) => void;
  onClearRooms: () => void;
  onSetRooms?: (rooms: PlacedRoom[]) => void;
  onSelectRemedyForRoom?: (roomId: string) => void;
  onNavigateToTab?: (tab: string) => void;
  isAuditUnlocked?: boolean;
  onUnlockAudit?: (planId?: SubscriptionPlanId) => void;
  activeProperty?: PropertyRecord;
  userProfile?: UserProfile;
  onOpenPropertyManager?: () => void;
}

export const HouseAuditorView: React.FC<HouseAuditorViewProps> = ({
  placedRooms,
  onAddRoom,
  onRemoveRoom,
  onClearRooms,
  onSetRooms,
  onNavigateToTab,
  isAuditUnlocked = false,
  onUnlockAudit,
  activeProperty,
  userProfile,
  onOpenPropertyManager,
}) => {
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType>('entrance');
  const [isRoomPickerModalOpen, setIsRoomPickerModalOpen] = useState<boolean>(false);
  const [inputDegree, setInputDegree] = useState<number>(45); // default North-East

  const [officialReportRef, setOfficialReportRef] = useState<string | null>(() => {
    return localStorage.getItem('vastu_active_report_ref') || null;
  });
  const [isSavingReport, setIsSavingReport] = useState<boolean>(false);
  const [reportSaveNotice, setReportSaveNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!officialReportRef && placedRooms.length > 0) {
      const year = new Date().getFullYear();
      const rand = Math.floor(100000 + Math.random() * 900000);
      const newRef = `RPT-${year}-${rand}`;
      setOfficialReportRef(newRef);
      localStorage.setItem('vastu_active_report_ref', newRef);
      window.dispatchEvent(new Event('vastu_active_report_updated'));
    }
  }, [placedRooms.length, officialReportRef]);

  const auditReport = calculateHouseAudit(placedRooms, officialReportRef || undefined);

  const [isEntranceWarningModalOpen, setIsEntranceWarningModalOpen] = useState<boolean>(false);
  const [quickEntranceDegree, setQuickEntranceDegree] = useState<number>(45);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  const handleGenerateOfficialReport = async () => {
    if (placedRooms.length === 0) {
      alert('Please add at least one room placement before generating an audit report.');
      return;
    }
    if (!placedRooms.some((r) => r.roomType === 'entrance')) {
      setIsEntranceWarningModalOpen(true);
      return;
    }
    setIsSavingReport(true);
    setReportSaveNotice(null);

    try {
      const year = new Date().getFullYear();
      const rand = Math.floor(100000 + Math.random() * 900000);
      const refNum = officialReportRef || `RPT-${year}-${rand}`;
      const finalReport = calculateHouseAudit(placedRooms, refNum);

      await recordAuditReportInFirestore({
        reportRefNumber: refNum,
        userId: userProfile?.uid || 'guest',
        userName: userProfile?.name || 'Vedic Architect User',
        userEmail: userProfile?.email || 'guest@vastu-app.in',
        propertyName: activeProperty?.name || 'Residential Property',
        propertyType: activeProperty?.propertyType || 'Flat/Apartment',
        facingDirection: activeProperty?.facingDegree !== undefined ? `${activeProperty.facingDegree}°` : 'East',
        overallScore: finalReport.overallScore,
        grade: finalReport.grade,
        summaryText: finalReport.summaryText,
        doshCount: finalReport.doshCount || 0,
        remedyCount: finalReport.analyses?.filter((r) => r.remedies && r.remedies.length > 0).length || 0,
        totalRooms: placedRooms.length,
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
      });

      setOfficialReportRef(refNum);
      localStorage.setItem('vastu_active_report_ref', refNum);
      window.dispatchEvent(new Event('vastu_active_report_updated'));
      setReportSaveNotice(`✓ Official Audit Report Generated & Saved in Database! Ref #: ${refNum}`);
      playTempleBellChime();
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      alert('Error saving report: ' + (err?.message || 'Error'));
    } finally {
      setIsSavingReport(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (placedRooms.length > 0 && !placedRooms.some((r) => r.roomType === 'entrance')) {
      setIsEntranceWarningModalOpen(true);
      return;
    }
    if (!isAuditUnlocked) {
      if (onUnlockAudit) onUnlockAudit();
      return;
    }

    let currentRef = officialReportRef;
    if (!currentRef && placedRooms.length > 0) {
      const year = new Date().getFullYear();
      const rand = Math.floor(100000 + Math.random() * 900000);
      currentRef = `RPT-${year}-${rand}`;
      setOfficialReportRef(currentRef);

      const finalReport = calculateHouseAudit(placedRooms, currentRef);
      recordAuditReportInFirestore({
        reportRefNumber: currentRef,
        userId: userProfile?.uid || 'guest',
        userName: userProfile?.name || 'Vedic Architect User',
        userEmail: userProfile?.email || 'guest@vastu-app.in',
        propertyName: activeProperty?.name || 'Residential Property',
        propertyType: activeProperty?.propertyType || 'Flat/Apartment',
        facingDirection: activeProperty?.facingDegree !== undefined ? `${activeProperty.facingDegree}°` : 'East',
        overallScore: finalReport.overallScore,
        grade: finalReport.grade,
        summaryText: finalReport.summaryText,
        doshCount: finalReport.doshCount || 0,
        remedyCount: finalReport.analyses?.filter((r) => r.remedies && r.remedies.length > 0).length || 0,
        totalRooms: placedRooms.length,
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
      }).catch(console.warn);
    }

    setIsGeneratingPdf(true);
    playTempleBellChime();
    setTimeout(() => {
      try {
        const finalReport = calculateHouseAudit(placedRooms, currentRef || undefined);
        generateVastuPDFReport(activeProperty, finalReport, placedRooms, userProfile);
      } catch (err) {
        console.error('Failed to generate PDF:', err);
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 150);
  };

  // Auto show warning modal if entrance is missing
  useEffect(() => {
    if (auditReport.isEntranceMissing) {
      setIsEntranceWarningModalOpen(true);
    }
  }, [auditReport.isEntranceMissing]);

  const handleAddQuickEntrance = () => {
    const zone = getZoneFromDegree(quickEntranceDegree);
    const newRoom: PlacedRoom = {
      id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      roomType: 'entrance',
      degree: quickEntranceDegree,
      zoneCode: zone.code,
      customLabel: 'Main Entrance',
    };
    onAddRoom(newRoom);
    setIsEntranceWarningModalOpen(false);
    playTempleBellChime();
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newRoom: PlacedRoom = {
      id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      roomType: selectedRoomType,
      degree: inputDegree,
      zoneCode: 'NE',
    };
    onAddRoom(newRoom);
    playTempleBellChime();
  };

  // Pre-load quick sample layouts
  const loadSampleLayout = (type: 'ideal' | 'defective' | '2bhk') => {
    playTempleBellChime();
    const ts = Date.now();
    let sampleRooms: PlacedRoom[] = [];

    if (type === 'ideal') {
      sampleRooms = [
        { id: `r_ideal_1_${ts}`, roomType: 'entrance', degree: 45, zoneCode: 'NE', customLabel: 'Main Gate' },
        { id: `r_ideal_2_${ts}`, roomType: 'pooja', degree: 45, zoneCode: 'NE', customLabel: 'Mandir' },
        { id: `r_ideal_3_${ts}`, roomType: 'kitchen', degree: 135, zoneCode: 'SE', customLabel: 'Kitchen' },
        { id: `r_ideal_4_${ts}`, roomType: 'master_bedroom', degree: 225, zoneCode: 'SW', customLabel: 'Master Bedroom' },
        { id: `r_ideal_5_${ts}`, roomType: 'toilet', degree: 202, zoneCode: 'SSW', customLabel: 'Toilet' },
        { id: `r_ideal_6_${ts}`, roomType: 'living_room', degree: 0, zoneCode: 'N', customLabel: 'Living Room' },
      ];
    } else if (type === 'defective') {
      sampleRooms = [
        { id: `r_def_1_${ts}`, roomType: 'entrance', degree: 225, zoneCode: 'SW', customLabel: 'Main Gate (SW Dosh)' },
        { id: `r_def_2_${ts}`, roomType: 'toilet', degree: 45, zoneCode: 'NE', customLabel: 'Toilet in NE (Severe Dosh)' },
        { id: `r_def_3_${ts}`, roomType: 'kitchen', degree: 45, zoneCode: 'NE', customLabel: 'Kitchen in NE (Agni Dosh)' },
        { id: `r_def_4_${ts}`, roomType: 'master_bedroom', degree: 135, zoneCode: 'SE', customLabel: 'Bedroom in SE' },
      ];
    } else {
      // Typical 2BHK
      sampleRooms = [
        { id: `r_2bhk_1_${ts}`, roomType: 'entrance', degree: 90, zoneCode: 'E', customLabel: 'East Entrance' },
        { id: `r_2bhk_2_${ts}`, roomType: 'pooja', degree: 45, zoneCode: 'NE', customLabel: 'Mandir Corner' },
        { id: `r_2bhk_3_${ts}`, roomType: 'kitchen', degree: 135, zoneCode: 'SE', customLabel: 'Kitchen' },
        { id: `r_2bhk_4_${ts}`, roomType: 'master_bedroom', degree: 225, zoneCode: 'SW', customLabel: 'Master Bed' },
        { id: `r_2bhk_5_${ts}`, roomType: 'kids_bedroom', degree: 315, zoneCode: 'NW', customLabel: 'Kids Bed' },
        { id: `r_2bhk_6_${ts}`, roomType: 'toilet', degree: 292, zoneCode: 'WNW', customLabel: 'Bathroom' },
      ];
    }

    if (onSetRooms) {
      onSetRooms(sampleRooms);
    } else {
      onClearRooms();
      sampleRooms.forEach((rm) => onAddRoom(rm));
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto pb-28 sm:pb-32 font-sans text-[#3D342D]">
      {/* Main Entrance Mandatory Warning Banner (if entrance missing) */}
      {auditReport.isEntranceMissing && (
        <div className="bg-[#FEF2F2] border-2 border-[#EF4444] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EF4444] text-white shrink-0 animate-pulse">
              <DoorClosed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-serif font-bold text-sm text-[#991B1B]">
                  Main Entrance Mandatory!
                </h4>
                <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-[#DC2626] text-white">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-[#7F1D1D] mt-0.5">
                Main Entrance location is required to calculate your authentic House Audit Score.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsEntranceWarningModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
          >
            <DoorClosed className="w-4 h-4" /> Add Main Entrance Now
          </button>
        </div>
      )}

      {/* House Audit Score Overview Card */}
      <div className="bg-[#78350F] text-[#F3EFE0] rounded-3xl p-4 sm:p-6 shadow-md relative overflow-hidden border border-[#5C280B]">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D97706]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-4 sm:gap-5 relative z-10">
          {/* Top Row: Gauge + Alignment Details */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {/* Score Gauge Circle */}
            <button
              onClick={() => {
                if (auditReport.isEntranceMissing) {
                  setIsEntranceWarningModalOpen(true);
                } else if (!isAuditUnlocked && onUnlockAudit) {
                  onUnlockAudit();
                  playTempleBellChime();
                }
              }}
              className={`relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center rounded-full border-4 shadow-md transition-transform hover:scale-105 cursor-pointer ${
                auditReport.isEntranceMissing
                  ? 'bg-[#451A03] border-[#EF4444]'
                  : 'bg-[#5C280B] border-[#D97706]'
              }`}
              title={
                auditReport.isEntranceMissing
                  ? 'Click to add mandatory Main Entrance'
                  : !isAuditUnlocked
                  ? 'Click to unlock full Vastu score'
                  : 'House Audit Score'
              }
            >
              <div className="text-center relative">
                {auditReport.isEntranceMissing ? (
                  <>
                    <DoorClosed className="w-6 h-6 text-[#EF4444] mx-auto mb-0.5 animate-bounce" />
                    <span className="text-[10.5px] font-sans font-black text-[#EF4444] block uppercase tracking-wider">
                      REQ ENTRANCE
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      className={`text-2xl sm:text-3xl font-serif font-black text-white block tracking-tight transition-all ${
                        !isAuditUnlocked ? 'filter blur-xs select-none opacity-80' : ''
                      }`}
                    >
                      {auditReport.overallScore}%
                    </span>
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#E8DCC4] block mt-0.5">
                      {!isAuditUnlocked ? (
                        <span className="inline-flex items-center gap-1 text-[#F59E0B] font-extrabold bg-[#451A03]/80 px-1.5 py-0.5 rounded-full border border-[#D97706]/40">
                          <Lock className="w-2.5 h-2.5" /> LOCKED
                        </span>
                      ) : (
                        `Grade ${auditReport.grade}`
                      )}
                    </span>
                  </>
                )}
              </div>
            </button>

            {/* Alignment Details */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span className="text-[10px] font-sans font-extrabold px-2.5 py-0.5 rounded-full bg-[#D97706] text-white uppercase tracking-wider whitespace-nowrap shadow-2xs">
                  Compatibility Index
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-serif font-bold text-white leading-tight">
                Overall House Alignment
              </h2>
              <p className="text-xs text-[#E8DCC4] mt-1 sm:mt-1.5 leading-relaxed max-w-xl">
                {isAuditUnlocked
                  ? auditReport.summaryText
                  : 'Unlock any Vastu Pro plan to reveal your exact House Alignment score %, room-by-room Dosh diagnoses, and remedial solutions.'}
              </p>
            </div>
          </div>

          {/* Quick Stats Badges & PDF Button Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 sm:pt-4 border-t border-[#9A420F]/50">
            <div className="bg-[#5C280B]/80 border border-[#9A420F]/50 rounded-2xl px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 shadow-xs">
              <span className="text-xs text-[#E8DCC4] flex items-center gap-1.5 font-medium whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" /> Auspicious:
              </span>
              <span className="text-sm font-bold text-[#10B981]">{auditReport.auspiciousCount}</span>
            </div>

            <div className="bg-[#5C280B]/80 border border-[#9A420F]/50 rounded-2xl px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 shadow-xs">
              <span className="text-xs text-[#E8DCC4] flex items-center gap-1.5 font-medium whitespace-nowrap">
                <AlertTriangle className="w-4 h-4 text-[#FCA5A5] shrink-0" /> Vastu Dosh:
              </span>
              <span className="text-sm font-bold text-[#FCA5A5]">{auditReport.doshCount}</span>
            </div>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="col-span-2 sm:col-span-1 px-4 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 border border-[#F59E0B] cursor-pointer"
            >
              <FileText className="w-4 h-4 text-white shrink-0" />
              <span className="whitespace-nowrap">{isGeneratingPdf ? 'Generating...' : 'Download PDF Report'}</span>
            </button>
          </div>

          {/* Preset Sample Layout Buttons */}
          <div className="pt-3 border-t border-[#9A420F]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-[#E8DCC4] font-bold uppercase tracking-wider text-[10px] whitespace-nowrap">
              Load Preset Layout:
            </span>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => loadSampleLayout('2bhk')}
                className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-[#5C280B] hover:bg-[#431D08] text-[#F3EFE0] border border-[#9A420F] transition-all whitespace-nowrap cursor-pointer"
              >
                Typical 2BHK
              </button>
              <button
                onClick={() => loadSampleLayout('ideal')}
                className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-[#10B981] hover:bg-[#059669] text-white transition-all shadow-xs whitespace-nowrap cursor-pointer"
              >
                🌟 Ideal Vastu
              </button>
              <button
                onClick={() => loadSampleLayout('defective')}
                className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-[#991B1B] hover:bg-[#7F1D1D] text-white transition-all shadow-xs whitespace-nowrap cursor-pointer"
              >
                🚨 House Defects
              </button>
              {placedRooms.length > 0 && (
                <button
                  onClick={onClearRooms}
                  className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-[#5C280B] hover:bg-[#431D08] text-[#E8DCC4] border border-[#9A420F] transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rooms to Audit List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base font-serif font-bold text-[#78350F] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#D97706]" /> Rooms to Audit ({placedRooms.length})
          </h3>

          {onNavigateToTab && auditReport.doshCount > 0 && (
            <button
              onClick={() => onNavigateToTab('remedies')}
              className="text-xs font-bold text-[#D97706] hover:text-[#B45309] flex items-center gap-1 bg-[#FFFBEB] px-3.5 py-1.5 rounded-full border border-[#FEF3C7] uppercase tracking-wider text-[10px] whitespace-nowrap shadow-xs"
            >
              View All {auditReport.doshCount} Remedies <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {placedRooms.length === 0 ? (
          <div className="bg-[#FCFAF7] border-2 border-dashed border-[#D6C7B2] rounded-3xl p-8 text-center flex flex-col items-center gap-2 shadow-xs">
            <Compass className="w-10 h-10 text-[#A68A64]" />
            <h4 className="text-sm font-serif font-bold text-[#78350F]">No Rooms Added Yet</h4>
            <p className="text-xs text-[#8B735B] max-w-sm">
              Use the manual entry form below or click "Preset Layout" to load a sample house and check its Vastu Shastra compatibility.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {auditReport.analyses.map((item, idx) => {
              const zoneObj = VASTU_ZONES.find((z) => z.code === item.zoneCode);

              return (
                <div
                  key={item.roomId ? `${item.roomId}_${idx}` : `analysis_${idx}`}
                  className={`rounded-3xl border p-5 transition-all shadow-md flex flex-col justify-between gap-3.5 ${
                    item.status === 'Auspicious'
                      ? 'bg-[#ECFDF5]/60 border-[#A7F3D0]'
                      : item.status === 'Inauspicious'
                      ? 'bg-[#FEF2F2]/70 border-[#FCA5A5]'
                      : 'bg-white border-[#D6C7B2]'
                  }`}
                >
                  <div className="flex flex-col gap-2 pb-2 border-b border-[#D6C7B2]/60">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="text-sm font-serif font-bold text-[#78350F] truncate">{item.roomLabel}</span>
                        <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#D6C7B2] text-[#3D342D] whitespace-nowrap shadow-2xs">
                          {item.degree}° ({item.zoneCode})
                        </span>
                      </div>

                      <button
                        onClick={() => onRemoveRoom(item.roomId)}
                        className="text-[#A68A64] hover:text-[#991B1B] p-1 rounded-lg hover:bg-white transition-all shrink-0"
                        title="Delete Room"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-[#8B735B]">
                        Zone: <span className="font-semibold text-[#3D342D]">{item.zoneName}</span>
                        {zoneObj && (
                          <span className="text-[#A68A64] ml-1 hidden sm:inline">
                            ({zoneObj.deity})
                          </span>
                        )}
                      </p>

                      <div className="shrink-0">
                        {item.status === 'Auspicious' && (
                          <span className="text-[10px] font-sans font-bold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0] flex items-center gap-1 uppercase tracking-wider whitespace-nowrap shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Ideal
                          </span>
                        )}
                        {item.status === 'Passable' && (
                          <span className="text-[10px] font-sans font-bold text-[#D97706] bg-[#FFFBEB] px-2.5 py-0.5 rounded-full border border-[#FDE68A] flex items-center gap-1 uppercase tracking-wider whitespace-nowrap shadow-2xs">
                            <HelpCircle className="w-3.5 h-3.5 shrink-0" /> Passable
                          </span>
                        )}
                        {item.status === 'Inauspicious' && (
                          <span className="text-[10px] font-sans font-bold text-[#991B1B] bg-[#FEF2F2] px-2.5 py-0.5 rounded-full border border-[#FCA5A5] flex items-center gap-1 uppercase tracking-wider whitespace-nowrap shadow-2xs">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Dosh!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.conflictReason && (
                    <div className="relative overflow-hidden rounded-2xl shadow-xs">
                      {!isAuditUnlocked && (
                        <div className="absolute inset-0 z-10 bg-[#FEF2F2]/90 backdrop-blur-xs flex items-center justify-center p-2 text-center">
                          <span className="text-[11px] font-bold text-[#991B1B] flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-[#D97706]" /> Dosh Diagnosis Locked — Upgrade to View
                          </span>
                        </div>
                      )}
                      <p className={`text-xs text-[#991B1B] bg-[#FEF2F2] p-3 rounded-2xl border border-[#FCA5A5] leading-relaxed font-sans ${
                        !isAuditUnlocked ? 'filter blur-sm select-none opacity-20' : ''
                      }`}>
                        ⚠️ {item.conflictReason}
                      </p>
                    </div>
                  )}

                  {/* Remedial Quick Suggestion */}
                  {item.remedies.length > 0 && (
                    <div className="relative overflow-hidden rounded-2xl shadow-xs">
                      {!isAuditUnlocked && (
                        <div className="absolute inset-0 z-10 bg-[#FCFAF7]/95 backdrop-blur-xs flex items-center justify-center p-2 text-center">
                          <span className="text-[11px] font-bold text-[#78350F] flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-[#D97706]" /> Remedy Locked — Choose Plan to Unlock
                          </span>
                        </div>
                      )}
                      <div className={`bg-white rounded-2xl p-3 border border-[#D6C7B2] text-xs ${
                        !isAuditUnlocked ? 'filter blur-sm select-none opacity-20' : ''
                      }`}>
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-[#78350F] block">
                            🕯️ Suggested Remedy: {item.remedies[0].title}
                          </span>
                          {(item.remedies[0].category?.toLowerCase() === 'yantra' ||
                            item.remedies[0].title?.toLowerCase().includes('yantra') ||
                            item.remedies[0].description?.toLowerCase().includes('yantra') ||
                            item.remedies[0].howToApply?.toLowerCase().includes('yantra') ||
                            item.remedies[0].materialsNeeded?.some((m) => m.toLowerCase().includes('yantra'))) && (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-extrabold border border-red-300 uppercase tracking-wider shrink-0">
                              Consultation required
                            </span>
                          )}
                        </div>
                        <p className="text-[#8B735B] line-clamp-2 text-[11px] leading-relaxed">
                          {item.remedies[0].howToApply}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Entry without Compass Form Card */}
      <div className="bg-[#FCFAF7] rounded-3xl border border-[#D6C7B2] p-4 sm:p-5 shadow-md">
        <h3 className="text-sm font-serif font-bold text-[#78350F] mb-3.5 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#D97706]" /> Manual Entry without Compass
        </h3>

        <form onSubmit={handleAdd} className="flex flex-col gap-3.5">
          {/* 1. ROOM CATEGORY */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#78350F] uppercase tracking-wider text-[10px]">
              Room Category:
            </label>
            <button
              type="button"
              onClick={() => {
                setIsRoomPickerModalOpen(true);
                playTempleBellChime();
              }}
              className="w-full text-xs font-medium bg-white hover:bg-[#FFFDF9] border border-[#D6C7B2] hover:border-[#D97706] rounded-2xl p-3 flex items-center justify-between gap-3 text-[#3D342D] shadow-xs transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-[#FFFBEB] text-[#78350F] border border-[#FDE68A] flex items-center justify-center shrink-0 shadow-2xs">
                  {getRoomIconComponent(ROOM_DEFINITIONS.find((r) => r.id === selectedRoomType)?.iconName || 'Sparkles', 'w-4 h-4')}
                </div>
                <span className="font-serif font-bold text-sm truncate">
                  {ROOM_DEFINITIONS.find((r) => r.id === selectedRoomType)?.label || 'Select Room'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#78350F] font-bold uppercase shrink-0">
                <LayoutGrid className="w-3.5 h-3.5 text-[#D97706]" />
                <ChevronDown className="w-3.5 h-3.5 text-[#8B735B]" />
              </div>
            </button>
          </div>

          {/* 2. FACING ANGLE / DIRECTION */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#D6C7B2] shadow-xs flex flex-col gap-2.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-[#78350F] uppercase tracking-wider text-[10px]">
                Facing Angle / Direction:
              </label>
              <span className="text-xs font-serif font-bold text-[#D97706] bg-[#FFFBEB] px-3 py-1 rounded-lg border border-[#FDE68A] shadow-xs">
                {inputDegree}° Angle
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="359"
              value={inputDegree}
              onChange={(e) => setInputDegree(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-[#F3EFE0] rounded-lg appearance-none cursor-pointer accent-[#D97706] my-1"
            />
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {[
                { label: 'N (0°)', deg: 0 },
                { label: 'NE (45°)', deg: 45 },
                { label: 'E (90°)', deg: 90 },
                { label: 'SE (135°)', deg: 135 },
                { label: 'S (180°)', deg: 180 },
                { label: 'SW (225°)', deg: 225 },
                { label: 'W (270°)', deg: 270 },
                { label: 'NW (315°)', deg: 315 },
              ].map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => setInputDegree(preset.deg)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border cursor-pointer ${
                    inputDegree === preset.deg
                      ? 'bg-[#D97706] text-white border-[#B45309] shadow-xs'
                      : 'bg-[#F3EFE0] text-[#8B735B] border-[#D6C7B2] hover:bg-[#E8DCC4]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. BUTTON TO ADD ROOM */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-[#78350F] hover:bg-[#5C280B] text-white text-xs font-bold uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F59E0B]" /> Add Room
          </button>
        </form>
      </div>

      {/* Pancha Mahabhuta Elemental Distribution */}
      {placedRooms.length > 0 && (
        <div className="bg-white rounded-3xl border border-[#D6C7B2] p-5 shadow-md space-y-3 relative overflow-hidden">
          {!isAuditUnlocked && (
            <div className="absolute inset-0 z-10 bg-[#FAF7F2]/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center gap-1.5">
              <span className="text-xs font-bold text-[#78350F] flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#D97706]" /> Pancha Mahabhuta Elemental Balance Locked
              </span>
              <p className="text-[11px] text-[#8B735B]">
                Unlock any plan to view exact 5-element energy proportions for your home.
              </p>
            </div>
          )}

          <h4 className="text-sm font-serif font-bold text-[#78350F] flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#D97706]" /> Pancha Mahabhuta (5 Elements) Distribution
          </h4>

          <div className={`grid grid-cols-2 sm:grid-cols-5 gap-3 text-center ${
            !isAuditUnlocked ? 'filter blur-md select-none opacity-20' : ''
          }`}>
            <div className="p-3 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] shadow-xs">
              <Droplet className="w-4 h-4 text-[#2563EB] mx-auto mb-1" />
              <span className="text-[10px] font-bold text-[#1E40AF] uppercase tracking-wider block">Water</span>
              <span className="text-base font-serif font-extrabold text-[#1D4ED8]">{auditReport.elementalBalance.Water}%</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] shadow-xs">
              <Flame className="w-4 h-4 text-[#D97706] mx-auto mb-1" />
              <span className="text-[10px] font-bold text-[#B45309] uppercase tracking-wider block">Fire</span>
              <span className="text-base font-serif font-extrabold text-[#D97706]">{auditReport.elementalBalance.Fire}%</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#F3EFE0] border border-[#D6C7B2] shadow-xs">
              <Mountain className="w-4 h-4 text-[#78350F] mx-auto mb-1" />
              <span className="text-[10px] font-bold text-[#78350F] uppercase tracking-wider block">Earth</span>
              <span className="text-base font-serif font-extrabold text-[#78350F]">{auditReport.elementalBalance.Earth}%</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] shadow-xs">
              <Wind className="w-4 h-4 text-[#059669] mx-auto mb-1" />
              <span className="text-[10px] font-bold text-[#065F46] uppercase tracking-wider block">Air</span>
              <span className="text-base font-serif font-extrabold text-[#059669]">{auditReport.elementalBalance.Air}%</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#D6C7B2] shadow-xs col-span-2 sm:col-span-1">
              <Sparkles className="w-4 h-4 text-[#9333EA] mx-auto mb-1" />
              <span className="text-[10px] font-bold text-[#3D342D] uppercase tracking-wider block">Space</span>
              <span className="text-base font-serif font-extrabold text-[#3D342D]">{auditReport.elementalBalance.Space}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Official Audit Report & Property Bar */}
      <div className="bg-[#FFFBEB] border-2 border-[#FDE68A] rounded-2xl p-4 shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-[#FEF3C7] text-[#D97706] shrink-0 border border-[#FDE68A]">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif font-bold text-sm sm:text-base text-[#78350F]">
                {activeProperty ? activeProperty.name : 'Default Property Audit'}
              </h3>
              {officialReportRef ? (
                <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0] whitespace-nowrap">
                  ✓ REGISTERED IN DB
                </span>
              ) : (
                <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] whitespace-nowrap">
                  LIVE WORKING CANVAS
                </span>
              )}
            </div>
            <p className="text-xs text-[#8B735B] flex flex-wrap items-center gap-1 mt-0.5 break-words">
              <MapPin className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
              <span className="font-medium">{activeProperty ? activeProperty.address : '104 Vastu Park, Mumbai'}</span>
              {officialReportRef && (
                <span className="font-bold text-[#78350F] whitespace-nowrap">
                  • Ref #: {officialReportRef}
                </span>
              )}
            </p>
            <p className="text-[11px] text-[#A1886F] mt-1 leading-snug">
              {officialReportRef
                ? 'Saved to database. Add or edit room directions above and click Update Report when ready.'
                : 'Enter room directions above, then click "Generate Official Report" to save a single entry in database.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full lg:w-auto shrink-0">
          <button
            onClick={handleGenerateOfficialReport}
            disabled={isSavingReport || placedRooms.length === 0}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#78350F] hover:bg-[#5C280B] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            title="Generate and Register Official Audit Report in Database"
          >
            <Sparkles className="w-4 h-4 text-[#F59E0B] shrink-0" />
            <span className="whitespace-nowrap">
              {isSavingReport
                ? 'Saving...'
                : officialReportRef
                ? 'Update Report'
                : '⚡ Generate Official Report'}
            </span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Download PDF Audit Report"
          >
            <Download className="w-3.5 h-3.5 text-white shrink-0" />
            <span className="whitespace-nowrap">{isGeneratingPdf ? 'Generating...' : 'Download Report'}</span>
          </button>

          {onOpenPropertyManager && (
            <button
              onClick={onOpenPropertyManager}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#78350F] text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-[#FDE68A] shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <MapPin className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
              <span className="whitespace-nowrap">Record / Compare Properties</span>
            </button>
          )}
        </div>
      </div>

      {reportSaveNotice && (
        <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-xs font-bold text-[#065F46] flex items-center justify-between gap-2 shadow-2xs">
          <span>{reportSaveNotice}</span>
          <button
            onClick={() => setReportSaveNotice(null)}
            className="text-[10px] text-[#047857] hover:underline uppercase font-extrabold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Entrance Mandatory Warning Modal Popup */}
      {isEntranceWarningModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FCFAF7] border-2 border-[#D97706] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[70vh] overflow-y-auto">
            <button
              onClick={() => setIsEntranceWarningModalOpen(false)}
              className="absolute top-4 right-4 text-[#8B735B] hover:text-[#3D342D] p-1.5 rounded-full bg-[#F3EFE0] transition-all"
              title="Close warning"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] shrink-0">
                <DoorClosed className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#991B1B] bg-[#FEF2F2] px-2.5 py-0.5 rounded-full border border-[#FCA5A5]">
                  Mandatory Requirement
                </span>
                <h3 className="text-lg font-serif font-bold text-[#78350F] mt-0.5">
                  Main Entrance Missing!
                </h3>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[#3D342D] leading-relaxed">
              <p className="bg-[#FFFBEB] p-3 rounded-2xl border border-[#FEF3C7] text-[#78350F]">
                <strong>Vedic Vastu Mandate:</strong> According to Vastu Shastra, the Main Entrance (<em>Mukhya Dvara</em>) is the primary gateway through which cosmic energy (Prana) enters the home. <strong>A House Audit Score cannot be generated without defining your Main Entrance placement.</strong>
              </p>

              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-[#78350F] uppercase tracking-wider text-[10px] block">
                  Select Main Entrance Facing Direction:
                </label>

                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#E8DCC4]">
                  <span className="text-xs font-serif font-bold text-[#78350F]">
                    {getZoneFromDegree(quickEntranceDegree).name} ({getZoneFromDegree(quickEntranceDegree).code})
                  </span>
                  <span className="text-xs font-bold text-[#D97706] bg-[#FFFBEB] px-2.5 py-0.5 rounded-md border border-[#FEF3C7]">
                    {quickEntranceDegree}° Angle
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="359"
                  value={quickEntranceDegree}
                  onChange={(e) => setQuickEntranceDegree(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-[#F3EFE0] rounded-lg appearance-none cursor-pointer accent-[#D97706]"
                />

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: 'NE (45°) - Ishanya', deg: 45 },
                    { label: 'E (90°) - East', deg: 90 },
                    { label: 'N (0°) - North', deg: 0 },
                    { label: 'SE (135°)', deg: 135 },
                    { label: 'SW (225°)', deg: 225 },
                    { label: 'NW (315°)', deg: 315 },
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => setQuickEntranceDegree(preset.deg)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border ${
                        quickEntranceDegree === preset.deg
                          ? 'bg-[#D97706] text-white border-[#B45309] shadow-xs'
                          : 'bg-[#F3EFE0] text-[#8B735B] border-[#E8DCC4] hover:bg-[#E8DCC4]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#E8DCC4] flex flex-col sm:flex-row items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEntranceWarningModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#E8DCC4] text-[#8B735B] hover:text-[#3D342D] text-xs font-bold uppercase tracking-wider transition-all text-center"
              >
                I'll Add It Later
              </button>
              <button
                type="button"
                onClick={handleAddQuickEntrance}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#78350F] hover:bg-[#5C280B] text-[#F3EFE0] text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 border border-[#D97706]"
              >
                <DoorClosed className="w-4 h-4 text-[#D97706]" /> Set Main Entrance & Calculate Score
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2 x 4 Room Selection Pop-up Modal */}
      <RoomSelectorModal
        isOpen={isRoomPickerModalOpen}
        onClose={() => setIsRoomPickerModalOpen(false)}
        selectedRoomId={selectedRoomType}
        onSelectRoom={(roomId) => setSelectedRoomType(roomId as RoomType)}
        currentZone={getZoneFromDegree(inputDegree)}
        effectiveDegree={inputDegree}
      />
    </div>
  );
};
