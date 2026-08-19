import React, { useState, useEffect } from 'react';
import {
  Upload,
  Eye,
  Compass,
  Layers,
  Info,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Maximize2,
  Minimize2,
  X,
  ZoomIn,
  ZoomOut,
  Trash2,
  Check,
  Building2,
  Lock,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sliders,
  Move,
} from 'lucide-react';
import { PropertyRecord } from '../types';
import { playTempleBellChime } from '../utils/vastuUtils';

interface VastuMandalaViewProps {
  activeProperty?: PropertyRecord;
  onUpdateActivePropertyLayout?: (layoutData: {
    floorplanUrl?: string | null;
    floorplanOpacity?: number;
    floorplanRotation?: number;
    floorplanScale?: number;
    floorplanFlipH?: boolean;
    floorplanFlipV?: boolean;
  }) => void;
  isUnlocked?: boolean;
  onUnlockAudit?: () => void;
}

export const VastuMandalaView: React.FC<VastuMandalaViewProps> = ({
  activeProperty,
  onUpdateActivePropertyLayout,
  isUnlocked = false,
  onUnlockAudit,
}) => {
  const [floorplanUrl, setFloorplanUrl] = useState<string | null>(activeProperty?.floorplanUrl || null);
  const [opacity, setOpacity] = useState<number>(activeProperty?.floorplanOpacity ?? 0.6);
  const [rotation, setRotation] = useState<number>(activeProperty?.floorplanRotation ?? 0);
  const [scale, setScale] = useState<number>(activeProperty?.floorplanScale ?? 1.0);
  const [flipH, setFlipH] = useState<boolean>(activeProperty?.floorplanFlipH ?? false);
  const [flipV, setFlipV] = useState<boolean>(activeProperty?.floorplanFlipV ?? false);
  const [posX, setPosX] = useState<number>(0);
  const [posY, setPosY] = useState<number>(0);
  const [activeGridCell, setActiveGridCell] = useState<string | null>('brahmasthan');
  const [isSavedNotice, setIsSavedNotice] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showHoverZoneInfo, setShowHoverZoneInfo] = useState<boolean>(true);

  // ESC Key listener to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Sync state if activeProperty changes
  useEffect(() => {
    if (activeProperty) {
      setFloorplanUrl(activeProperty.floorplanUrl || null);
      setOpacity(activeProperty.floorplanOpacity ?? 0.6);
      setRotation(activeProperty.floorplanRotation ?? 0);
      setScale(activeProperty.floorplanScale ?? 1.0);
      setFlipH(activeProperty.floorplanFlipH ?? false);
      setFlipV(activeProperty.floorplanFlipV ?? false);
    }
  }, [activeProperty?.id]);

  // Helper to notify parent and auto-save layout updates
  const notifyLayoutUpdate = (updates: {
    floorplanUrl?: string | null;
    floorplanOpacity?: number;
    floorplanRotation?: number;
    floorplanScale?: number;
    floorplanFlipH?: boolean;
    floorplanFlipV?: boolean;
  }) => {
    if (onUpdateActivePropertyLayout) {
      onUpdateActivePropertyLayout(updates);
      setIsSavedNotice(true);
      setTimeout(() => setIsSavedNotice(false), 2000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isUnlocked) {
      e.preventDefault();
      if (onUnlockAudit) onUnlockAudit();
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    // Compress uploaded image before saving to fit comfortably in Firestore/localStorage
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1000;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setFloorplanUrl(compressedDataUrl);
          notifyLayoutUpdate({
            floorplanUrl: compressedDataUrl,
            floorplanOpacity: opacity,
            floorplanRotation: rotation,
            floorplanScale: scale,
            floorplanFlipH: flipH,
            floorplanFlipV: flipV,
          });
        } else {
          const rawUrl = event.target?.result as string;
          setFloorplanUrl(rawUrl);
          notifyLayoutUpdate({ floorplanUrl: rawUrl });
        }
        playTempleBellChime();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleOpacityChange = (val: number) => {
    setOpacity(val);
    notifyLayoutUpdate({ floorplanOpacity: val });
  };

  const handleRotationChange = (val: number) => {
    setRotation(val);
    notifyLayoutUpdate({ floorplanRotation: val });
  };

  const handleScaleChange = (val: number) => {
    setScale(val);
    notifyLayoutUpdate({ floorplanScale: val });
  };

  const handleFlipHChange = (val: boolean) => {
    setFlipH(val);
    notifyLayoutUpdate({ floorplanFlipH: val });
  };

  const handleFlipVChange = (val: boolean) => {
    setFlipV(val);
    notifyLayoutUpdate({ floorplanFlipV: val });
  };

  const handleRemoveFloorplan = () => {
    setFloorplanUrl(null);
    notifyLayoutUpdate({ floorplanUrl: null });
  };

  const mandalaCells = [
    {
      id: 'nw',
      name: 'North-West (Vayu)',
      deity: 'Vayu Dev (Air)',
      purushaPart: 'Left Hand & Arms',
      bestUse: 'Guest Room, Garage, Support, Movement',
      bg: 'bg-[#FCFAF7] border-[#E8DCC4]',
      text: 'text-[#78350F]',
    },
    {
      id: 'n',
      name: 'North (Kuber)',
      deity: 'Lord Kuber',
      purushaPart: 'Chest & Throat',
      bestUse: 'Cash Locker, Living Room, Entrance',
      bg: 'bg-[#FCFAF7] border-[#E8DCC4]',
      text: 'text-[#78350F]',
    },
    {
      id: 'ne',
      name: 'North-East (Eeshanya)',
      deity: 'Lord Shiva',
      purushaPart: 'Head & Third Eye (Sahasrara)',
      bestUse: 'Pooja Room, Meditation, Water Tank',
      bg: 'bg-[#FCFAF7] border-[#E8DCC4]',
      text: 'text-[#78350F]',
    },
    {
      id: 'w',
      name: 'West (Varuna)',
      deity: 'Lord Varuna',
      purushaPart: 'Abdomen & Stomach',
      bestUse: 'Dining Hall, Overhead Water Tank',
      bg: 'bg-[#FCFAF7] border-[#E8DCC4]',
      text: 'text-[#78350F]',
    },
    {
      id: 'brahmasthan',
      name: 'Brahmasthan (Center)',
      deity: 'Lord Brahma (Creator)',
      purushaPart: 'Heart & Umbilicus (Navel)',
      bestUse: 'Keep Completely Empty, Light & Open Courtyard',
      bg: 'bg-[#FFFBEB] border-[#D97706] ring-2 ring-[#D97706]/40',
      text: 'text-[#78350F] font-black',
    },
    {
      id: 'e',
      name: 'East (Surya / Indra)',
      deity: 'Lord Indra & Sun',
      purushaPart: 'Right Shoulder & Solar Plexus',
      bestUse: 'Main Door, Living Room, Veranda',
      bg: 'bg-[#FCFAF7] border-[#E8DCC4]',
      text: 'text-[#78350F]',
    },
    {
      id: 'sw',
      name: 'South-West (Nairrutya)',
      deity: 'Pitru & Nairrut',
      purushaPart: 'Feet & Lower Legs',
      bestUse: 'Master Bedroom, Heavy Safe, Stability',
      bg: 'bg-[#FCFAF7] border-[#E8DCC4]',
      text: 'text-[#78350F]',
    },
    {
      id: 's',
      name: 'South (Yama)',
      deity: 'Lord Yama',
      purushaPart: 'Thighs & Knees',
      bestUse: 'Master Bed Headrest, Fame & Rest',
      bg: 'bg-[#FCFAF7] border-[#E8DCC4]',
      text: 'text-[#78350F]',
    },
    {
      id: 'se',
      name: 'South-East (Agneya)',
      deity: 'Agni Dev (Fire)',
      purushaPart: 'Right Hand & Digestion',
      bestUse: 'Kitchen (Cooktop), Meter Box',
      bg: 'bg-[#FCFAF7] border-[#E8DCC4]',
      text: 'text-[#78350F]',
    },
  ];

  const currentSelectedCell = mandalaCells.find((c) => c.id === activeGridCell) || mandalaCells[4];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto pb-24 font-sans text-[#3D342D]">
      {/* Header Banner */}
      <div className="bg-[#78350F] text-[#F3EFE0] border border-[#5C280B] rounded-3xl p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-sans font-extrabold px-2.5 py-0.5 rounded-full bg-[#D97706] text-white uppercase tracking-widest">
              3x3 Navavarga Energy Grid
            </span>
            {activeProperty && (
              <span className="text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full bg-[#5C280B] text-[#FEF3C7] border border-[#D97706]/40 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-[#F59E0B]" />
                {activeProperty.name}
              </span>
            )}
            {isSavedNotice && (
              <span className="text-[10px] font-sans font-extrabold px-2 py-0.5 rounded-full bg-[#059669] text-white flex items-center gap-1 animate-in fade-in">
                <Check className="w-3 h-3" /> Layout Saved
              </span>
            )}
          </div>

          <h2 className="text-xl font-serif font-bold text-white mt-1.5 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#D97706]" /> Vastu Purusha Mandala Visualizer
          </h2>
          <p className="text-xs text-[#E8DCC4] mt-1 max-w-xl leading-relaxed">
            Overlay your home plan on the 9-part Vastu grid. Adjust scaling, orientation, and flips to fit your structure perfectly.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Upload Floorplan Button (Locked until payment) */}
          {!isUnlocked ? (
            <button
              type="button"
              onClick={onUnlockAudit}
              className="px-4 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md transition-all flex items-center gap-2 animate-pulse"
              title="Unlock Pro Access to Overlay House Layout"
            >
              <Lock className="w-4 h-4 text-[#FEF3C7]" />
              <span>Overlay Layout</span>
            </button>
          ) : (
            <label className="px-4 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-xs transition-all flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              {floorplanUrl ? 'Change Layout' : 'Overlay Layout'}
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          )}
        </div>
      </div>

      {/* Grid Canvas & Controls */}
      <div className="grid grid-cols-1 landscape:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
        {/* Left 2 Cols: Interactive 3x3 Grid Overlay */}
        <div className="landscape:col-span-1 lg:col-span-2 bg-[#FCFAF7] rounded-3xl border border-[#E8DCC4] p-4 sm:p-5 shadow-xs flex flex-col items-center gap-4">
          {/* Overlay Controls Bar */}
          {floorplanUrl && (
            <div className="w-full bg-[#FCFAF7] p-3.5 sm:p-4 rounded-3xl border border-[#E8DCC4] shadow-xs space-y-3">
              {/* Header / Title Bar */}
              <div className="flex items-center justify-between border-b border-[#E8DCC4] pb-2">
                <span className="text-[10px] font-sans font-extrabold text-[#78350F] bg-[#F3EFE0] px-3 py-0.5 rounded-full border border-[#E8DCC4] uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#D97706]" /> Layout Overlay Adjustments
                </span>
              </div>

              {/* Section 1: 2-Column Symmetric Grid for Sliders & Orientation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {/* Box A: Opacity & Rotate Sliders */}
                <div className="bg-white p-3 rounded-2xl border border-[#E8DCC4] space-y-2.5 shadow-2xs">
                  {/* Opacity */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-[#78350F]">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-[#D97706]" /> Grid Opacity
                      </span>
                      <span className="font-mono text-[11px] text-[#8B735B]">{Math.round(opacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={opacity}
                      onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                      className="w-full accent-[#D97706] h-1.5 bg-[#F3EFE0] rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Rotate */}
                  <div className="space-y-1 pt-1.5 border-t border-[#F3EFE0]">
                    <div className="flex items-center justify-between text-xs font-bold text-[#78350F]">
                      <span className="flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5 text-[#D97706]" /> Rotate Angle
                      </span>
                      <span className="font-mono text-[11px] text-[#8B735B]">{rotation}°</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="359"
                        value={rotation}
                        onChange={(e) => handleRotationChange(parseInt(e.target.value, 10))}
                        className="w-full accent-[#D97706] h-1.5 bg-[#F3EFE0] rounded-lg cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => handleRotationChange((rotation + 90) % 360)}
                        className="px-2 py-0.5 bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#78350F] rounded-lg text-[10px] font-bold border border-[#FDE68A] shrink-0 cursor-pointer transition-all"
                        title="Rotate 90° Clockwise"
                      >
                        +90°
                      </button>
                    </div>
                  </div>
                </div>

                {/* Box B: Mirror Flips & Zoom Level Controls */}
                <div className="bg-white p-3 rounded-2xl border border-[#E8DCC4] space-y-2.5 shadow-2xs flex flex-col justify-between">
                  {/* Mirror Flips */}
                  <div>
                    <span className="text-[10px] font-bold text-[#78350F] uppercase tracking-wider block mb-1">
                      Mirror Flips
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleFlipHChange(!flipH)}
                        className={`py-1 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          flipH
                            ? 'bg-[#78350F] text-white border-[#5C280B] shadow-xs'
                            : 'bg-[#FAF7F2] text-[#78350F] border-[#E8DCC4] hover:bg-[#F3EFE0]'
                        }`}
                      >
                        <FlipHorizontal className="w-3.5 h-3.5 text-[#D97706]" /> Flip H
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFlipVChange(!flipV)}
                        className={`py-1 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          flipV
                            ? 'bg-[#78350F] text-white border-[#5C280B] shadow-xs'
                            : 'bg-[#FAF7F2] text-[#78350F] border-[#E8DCC4] hover:bg-[#F3EFE0]'
                        }`}
                      >
                        <FlipVertical className="w-3.5 h-3.5 text-[#D97706]" /> Flip V
                      </button>
                    </div>
                  </div>

                  {/* Zoom Controls */}
                  <div className="pt-1.5 border-t border-[#F3EFE0]">
                    <span className="text-[10px] font-bold text-[#78350F] uppercase tracking-wider block mb-1">
                      Zoom Scale Controls
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleScaleChange(Math.max(0.3, parseFloat((scale - 0.1).toFixed(2))))}
                        className="py-1 bg-[#FAF7F2] hover:bg-[#F3EFE0] border border-[#E8DCC4] rounded-xl text-xs font-bold text-[#78350F] flex items-center justify-center cursor-pointer transition-all"
                        title="Zoom Out (-10%)"
                      >
                        <ZoomOut className="w-3.5 h-3.5 text-[#D97706]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScaleChange(1.0)}
                        className="py-1 bg-[#FAF7F2] hover:bg-[#F3EFE0] border border-[#E8DCC4] rounded-xl text-[10px] font-bold text-[#78350F] flex items-center justify-center cursor-pointer transition-all"
                        title="Reset Scale 100%"
                      >
                        100%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScaleChange(Math.min(3.0, parseFloat((scale + 0.1).toFixed(2))))}
                        className="py-1 bg-[#FAF7F2] hover:bg-[#F3EFE0] border border-[#E8DCC4] rounded-xl text-xs font-bold text-[#78350F] flex items-center justify-center cursor-pointer transition-all"
                        title="Zoom In (+10%)"
                      >
                        <ZoomIn className="w-3.5 h-3.5 text-[#D97706]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScaleChange(1.15)}
                        className="py-1 bg-[#FEF3C7] hover:bg-[#FDE68A] border border-[#FDE68A] rounded-xl text-[10px] font-bold text-[#78350F] flex items-center justify-center cursor-pointer transition-all"
                        title="Fit to Mandala Frame"
                      >
                        Fit
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Position Movements & Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {/* Box C: Move Layout Directional Nudges */}
                <div className="bg-white p-2.5 rounded-2xl border border-[#E8DCC4] flex items-center justify-between gap-2 shadow-2xs">
                  <span className="text-xs font-bold text-[#78350F] flex items-center gap-1.5 shrink-0">
                    <Move className="w-3.5 h-3.5 text-[#D97706]" /> Move Layout:
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPosY((prev) => prev - 10)}
                      className="p-1.5 bg-[#FAF7F2] hover:bg-[#F3EFE0] text-[#78350F] rounded-lg border border-[#E8DCC4] cursor-pointer transition-all"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosY((prev) => prev + 10)}
                      className="p-1.5 bg-[#FAF7F2] hover:bg-[#F3EFE0] text-[#78350F] rounded-lg border border-[#E8DCC4] cursor-pointer transition-all"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosX((prev) => prev - 10)}
                      className="p-1.5 bg-[#FAF7F2] hover:bg-[#F3EFE0] text-[#78350F] rounded-lg border border-[#E8DCC4] cursor-pointer transition-all"
                      title="Move Left"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosX((prev) => prev + 10)}
                      className="p-1.5 bg-[#FAF7F2] hover:bg-[#F3EFE0] text-[#78350F] rounded-lg border border-[#E8DCC4] cursor-pointer transition-all"
                      title="Move Right"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Box D: Primary Actions (Full Screen & Remove Overlay) */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFullscreen(true);
                      setShowHoverZoneInfo(true);
                      playTempleBellChime();
                    }}
                    className="flex-1 py-2.5 bg-[#78350F] hover:bg-[#5C280B] text-[#FEF3C7] rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                    title="Open Full Screen Mode"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-[#F59E0B]" /> Full Screen Mode
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveFloorplan}
                    className="px-3 py-2.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5] rounded-2xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                    title="Remove House Layout Overlay"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Interactive 3x3 Mandala Grid Canvas Frame */}
          <div className="relative w-full aspect-square max-w-md rounded-2xl border-2 border-[#E8DCC4] overflow-hidden shadow-inner flex items-center justify-center bg-white">
            {/* Uploaded Image Background Overlay with Transforms */}
            {floorplanUrl ? (
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-2">
                <img
                  src={floorplanUrl}
                  alt="House Layout Floorplan"
                  className="max-w-full max-h-full object-contain transition-transform duration-150 ease-out origin-center"
                  style={{
                    transform: `translate(${posX}px, ${posY}px) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1}) scale(${scale})`,
                    opacity: 0.95,
                  }}
                />
              </div>
            ) : !isUnlocked ? (
              <div className="text-center p-6 space-y-3 text-[#3D342D] max-w-xs">
                <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] border-2 border-[#D97706]/40 text-[#D97706] flex items-center justify-center mx-auto shadow-xs">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-serif font-bold text-[#78350F]">
                    House Layout Overlay Locked
                  </h4>
                  <p className="text-[11px] text-[#8B735B] leading-relaxed">
                    Unlock Pro Access to overlay your property map, adjust 16-zone alignment, scale, rotate, and flip.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onUnlockAudit}
                  className="mt-1 px-4 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-full shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2 mx-auto"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FEF3C7]" />
                  <span>Unlock Overlay Option</span>
                </button>
              </div>
            ) : (
              <div className="text-center p-6 space-y-2 text-[#A68A64]">
                <Layers className="w-10 h-10 mx-auto opacity-30 text-[#78350F]" />
                <p className="text-xs font-medium text-[#8B735B]">
                  No house layout plan overlay uploaded yet.
                </p>
                <label className="inline-block mt-1 px-3 py-1.5 bg-[#F3EFE0] hover:bg-[#E8DCC4] text-[#78350F] text-xs font-bold rounded-xl border border-[#E8DCC4] cursor-pointer transition-all">
                  Upload Floorplan Image
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            )}

            {/* 3x3 Mandala Grid Lines Overlay */}
            <div
              className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1.5 p-1.5 transition-opacity duration-200 pointer-events-auto z-10"
              style={{ opacity }}
            >
              {mandalaCells.map((cell) => {
                const isActive = cell.id === activeGridCell;

                return (
                  <button
                    key={cell.id}
                    onClick={() => {
                      setActiveGridCell(cell.id);
                      setShowHoverZoneInfo(true);
                      playTempleBellChime();
                    }}
                    className={`rounded-2xl p-2.5 border flex flex-col justify-center items-start transition-all text-left shadow-2xs ${cell.bg} ${
                      isActive ? 'scale-[1.02] ring-2 ring-[#D97706] z-20 shadow-md' : 'hover:opacity-90'
                    }`}
                  >
                    <span className="text-[10px] font-sans font-extrabold uppercase tracking-widest block text-[#A68A64]">
                      {cell.name.split(' ')[0]}
                    </span>
                    <span className={`text-[11px] font-serif font-extrabold leading-tight ${cell.text}`}>
                      {cell.deity}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Selected Grid Cell Information */}
        <div className="bg-[#FCFAF7] rounded-3xl border border-[#E8DCC4] p-5 shadow-xs space-y-4">
          <div className="border-b border-[#E8DCC4] pb-3">
            <span className="text-[10px] font-sans font-bold text-[#78350F] bg-[#F3EFE0] px-2.5 py-1 rounded-full border border-[#E8DCC4] uppercase tracking-wider">
              Selected Zone Details
            </span>
            <h3 className="text-base font-serif font-bold text-[#78350F] mt-2">{currentSelectedCell.name}</h3>
            <p className="text-xs text-[#8B735B] mt-0.5">
              Deity: <strong className="text-[#3D342D]">{currentSelectedCell.deity}</strong>
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-white p-3.5 rounded-2xl border border-[#E8DCC4]">
              <span className="font-bold text-[#78350F] block mb-1 flex items-center gap-1 uppercase tracking-wider text-[10px]">
                <Compass className="w-3.5 h-3.5 text-[#D97706]" /> Vastu Purusha Limb:
              </span>
              <p className="text-[#3D342D] font-medium">{currentSelectedCell.purushaPart}</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-[#E8DCC4]">
              <span className="font-bold text-[#78350F] block mb-1 flex items-center gap-1 uppercase tracking-wider text-[10px]">
                <Info className="w-3.5 h-3.5 text-[#D97706]" /> Ideal Usage in Home:
              </span>
              <p className="text-[#3D342D] font-semibold">{currentSelectedCell.bestUse}</p>
            </div>
          </div>

          {currentSelectedCell.id === 'brahmasthan' && (
            <div className="bg-[#FFFBEB] border border-[#FEF3C7] p-3.5 rounded-2xl text-xs text-[#78350F] space-y-1">
              <span className="font-bold block">✨ Brahmasthan Sacred Rule:</span>
              <p className="leading-relaxed text-[11px] text-[#8B735B]">
                The central 1/9th grid is the heart of Vastu Purusha. Avoid heavy concrete columns, toilets, gas stoves, or staircases here to keep positive energy circulating throughout the home.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FULL SCREEN MANDALA VISUALIZER OVERLAY */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-[#1F0E06]/98 text-white flex flex-col p-2 sm:p-3 overflow-hidden backdrop-blur-xl animate-in fade-in duration-200">
          {/* Top Header Bar */}
          <div className="w-full max-w-7xl mx-auto bg-[#5C280B] px-3.5 py-1.5 rounded-xl border border-[#9A420F] flex items-center justify-between gap-2 shadow-lg shrink-0 mb-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <Layers className="w-5 h-5 text-[#F59E0B] shrink-0" />
              <div className="min-w-0 flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-serif font-bold text-white truncate">
                  Vastu Purusha Mandala
                </h3>
                {activeProperty && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#D97706] text-white shrink-0 hidden sm:inline-block">
                    {activeProperty.name}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="px-3 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-extrabold uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center gap-1.5 border border-[#F59E0B]/50 cursor-pointer shrink-0"
              title="Exit Full Screen View (ESC)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Fullscreen</span>
            </button>
          </div>

          {/* Main Content Area: Side-by-Side in Landscape with Max-Scale Canvas & Spacious Zone Info */}
          <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col landscape:flex-row items-center justify-center gap-3 sm:gap-6 min-h-0 my-auto py-1 px-1 sm:px-2 overflow-hidden">
            {/* Left Section: Max-Scale Mandala Canvas Frame */}
            <div className="flex-1 flex items-center justify-center h-full w-full min-h-0 min-w-0 shrink">
              <div className="relative aspect-square h-full max-h-[calc(100vh-135px)] sm:max-h-[calc(100vh-145px)] w-auto max-w-full rounded-2xl border-2 border-[#D97706]/80 bg-[#FAF7F2] overflow-hidden flex items-center justify-center shadow-2xl shrink-0">
                {/* Background Floorplan Image Overlay */}
                {floorplanUrl ? (
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-2">
                    <img
                      src={floorplanUrl}
                      alt="House Layout Floorplan"
                      className="max-w-full max-h-full object-contain transition-transform duration-150 ease-out origin-center"
                      style={{
                        transform: `translate(${posX}px, ${posY}px) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1}) scale(${scale})`,
                        opacity: 0.95,
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center p-3 space-y-1 text-[#A68A64]">
                    <Layers className="w-8 h-8 mx-auto opacity-30 text-[#78350F]" />
                    <p className="text-[10px] font-medium text-[#8B735B]">
                      No house layout plan overlay uploaded yet.
                    </p>
                  </div>
                )}

                {/* 3x3 Mandala Grid Lines Overlay */}
                <div
                  className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1 p-1.5 transition-opacity duration-200 pointer-events-auto z-10"
                  style={{ opacity }}
                >
                  {mandalaCells.map((cell) => {
                    const isActive = cell.id === activeGridCell;

                    return (
                      <button
                        key={cell.id}
                        onClick={() => {
                          setActiveGridCell(cell.id);
                          setShowHoverZoneInfo(true);
                          playTempleBellChime();
                        }}
                        className={`rounded-xl p-1.5 sm:p-2 border flex flex-col justify-center items-start transition-all text-left shadow-2xs ${cell.bg} ${
                          isActive ? 'scale-[1.03] ring-3 ring-[#D97706] z-20 shadow-xl' : 'hover:opacity-90'
                        }`}
                      >
                        <span className="text-[8px] sm:text-[9px] font-sans font-extrabold uppercase tracking-wider block text-[#A68A64]">
                          {cell.name.split(' ')[0]}
                        </span>
                        <span className={`text-[10px] sm:text-xs font-serif font-extrabold leading-tight ${cell.text}`}>
                          {cell.deity}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Section: Spacious Zone Info Card (No Truncation, Easy Reading) */}
            <div className="w-full max-w-[360px] landscape:w-[320px] sm:landscape:w-[350px] lg:landscape:w-[380px] shrink-0 flex flex-col justify-center min-w-0">
              {activeGridCell && showHoverZoneInfo ? (
                <div className="bg-[#FFFBEB] text-[#3D342D] p-3.5 sm:p-4 rounded-2xl border-2 border-[#D97706] shadow-2xl space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-start justify-between gap-2 border-b border-[#FDE68A] pb-2">
                    <div className="min-w-0 pr-1">
                      <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-[#D97706] text-white uppercase tracking-wider inline-block mb-1">
                        SELECTED ZONE
                      </span>
                      <h4 className="text-sm sm:text-base font-serif font-bold text-[#78350F] leading-snug">
                        {currentSelectedCell.name}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowHoverZoneInfo(false)}
                      className="p-1.5 rounded-xl bg-[#FDE68A] hover:bg-[#FCD34D] text-[#78350F] transition-all cursor-pointer shrink-0 mt-0.5"
                      title="Close Zone Info"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-[#FEF3C7] px-3 py-2 rounded-xl border border-[#FDE68A] flex flex-wrap items-center justify-between gap-1 text-xs">
                    <span className="font-bold text-[#78350F] text-xs">Ruling Deity</span>
                    <span className="font-extrabold text-[#D97706] font-serif text-xs sm:text-sm">{currentSelectedCell.deity}</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-[#E8DCC4] shadow-2xs">
                      <span className="font-bold text-[#78350F] text-[9px] uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-[#D97706]" /> Body Limb:
                      </span>
                      <p className="text-[#3D342D] font-medium leading-snug text-xs sm:text-sm">{currentSelectedCell.purushaPart}</p>
                    </div>

                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-[#E8DCC4] shadow-2xs">
                      <span className="font-bold text-[#78350F] text-[9px] uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-[#D97706]" /> Ideal Usage:
                      </span>
                      <p className="text-[#3D342D] font-semibold leading-snug text-xs sm:text-sm">{currentSelectedCell.bestUse}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#3D1A07]/80 text-[#E8DCC4] p-4 rounded-2xl border border-[#78350F] text-center space-y-2 shadow-lg">
                  <Compass className="w-7 h-7 text-[#F59E0B] mx-auto opacity-80" />
                  <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Select a Mandala Zone</h4>
                  <p className="text-xs text-[#E8DCC4] leading-relaxed">
                    Tap any grid cell on the Mandala to inspect ruling deities, body limbs, and recommended activities.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Centered Controls Bar at the Bottom */}
          {floorplanUrl && (
            <div className="w-auto max-w-full mx-auto mt-1 bg-[#3D1A07]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#78350F] flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs shadow-xl shrink-0 z-30">
              {/* Directional Move Buttons */}
              <div className="flex items-center gap-1 border-r border-[#5C280B] pr-2">
                <span className="text-[9px] text-[#E8DCC4] font-bold hidden sm:inline">Move:</span>
                <button
                  type="button"
                  onClick={() => setPosY((prev) => prev - 10)}
                  className="w-7 h-7 bg-[#5C280B] hover:bg-[#78350F] active:bg-[#D97706] text-[#FEF3C7] rounded-lg border border-[#9A420F] cursor-pointer flex items-center justify-center shadow-2xs"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPosY((prev) => prev + 10)}
                  className="w-7 h-7 bg-[#5C280B] hover:bg-[#78350F] active:bg-[#D97706] text-[#FEF3C7] rounded-lg border border-[#9A420F] cursor-pointer flex items-center justify-center shadow-2xs"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPosX((prev) => prev - 10)}
                  className="w-7 h-7 bg-[#5C280B] hover:bg-[#78350F] active:bg-[#D97706] text-[#FEF3C7] rounded-lg border border-[#9A420F] cursor-pointer flex items-center justify-center shadow-2xs"
                  title="Move Left"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPosX((prev) => prev + 10)}
                  className="w-7 h-7 bg-[#5C280B] hover:bg-[#78350F] active:bg-[#D97706] text-[#FEF3C7] rounded-lg border border-[#9A420F] cursor-pointer flex items-center justify-center shadow-2xs"
                  title="Move Right"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Zoom Buttons */}
              <div className="flex items-center gap-1 border-r border-[#5C280B] pr-2">
                <button
                  type="button"
                  onClick={() => handleScaleChange(Math.max(0.3, parseFloat((scale - 0.1).toFixed(2))))}
                  className="w-7 h-7 bg-[#5C280B] hover:bg-[#78350F] active:bg-[#D97706] text-[#FEF3C7] rounded-lg border border-[#9A420F] cursor-pointer flex items-center justify-center shadow-2xs"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[10px] text-[#FEF3C7] font-extrabold px-1 min-w-[32px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => handleScaleChange(Math.min(3.0, parseFloat((scale + 0.1).toFixed(2))))}
                  className="w-7 h-7 bg-[#5C280B] hover:bg-[#78350F] active:bg-[#D97706] text-[#FEF3C7] rounded-lg border border-[#9A420F] cursor-pointer flex items-center justify-center shadow-2xs"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScaleChange(1.0)}
                  className="px-2 py-1 h-7 bg-[#5C280B] hover:bg-[#78350F] text-[#FEF3C7] rounded-lg text-[10px] font-extrabold border border-[#9A420F] cursor-pointer flex items-center justify-center"
                  title="Reset 100%"
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={() => handleScaleChange(1.15)}
                  className="px-2 py-1 h-7 bg-[#D97706] hover:bg-[#B45309] text-white rounded-lg text-[10px] font-extrabold cursor-pointer flex items-center justify-center shadow-2xs"
                  title="Fit Frame"
                >
                  Fit
                </button>
              </div>

              {/* Opacity & Rotation Controls */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-[#E8DCC4] font-bold hidden sm:inline">Opacity:</span>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                  className="w-12 accent-[#F59E0B] h-1.5 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => handleRotationChange((rotation + 90) % 360)}
                  className="px-2 py-1 h-7 bg-[#5C280B] hover:bg-[#78350F] text-[#FEF3C7] rounded-lg text-[10px] font-extrabold border border-[#9A420F] cursor-pointer flex items-center justify-center"
                  title="Rotate 90 degrees"
                >
                  +90°
                </button>
                <button
                  type="button"
                  onClick={() => handleFlipHChange(!flipH)}
                  className={`px-2 py-1 h-7 rounded-lg text-[10px] font-extrabold border cursor-pointer flex items-center justify-center ${
                    flipH ? 'bg-[#D97706] text-white border-[#F59E0B]' : 'bg-[#5C280B] text-[#FEF3C7] border-[#9A420F]'
                  }`}
                >
                  Flip H
                </button>
                <button
                  type="button"
                  onClick={() => handleFlipVChange(!flipV)}
                  className={`px-2 py-1 h-7 rounded-lg text-[10px] font-extrabold border cursor-pointer flex items-center justify-center ${
                    flipV ? 'bg-[#D97706] text-white border-[#F59E0B]' : 'bg-[#5C280B] text-[#FEF3C7] border-[#9A420F]'
                  }`}
                >
                  Flip V
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
