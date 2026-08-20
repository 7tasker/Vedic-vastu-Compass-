import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VASTU_ZONES, ROOM_DEFINITIONS } from '../data/vastuData';
import { getZoneFromDegree, playTempleBellChime } from '../utils/vastuUtils';
import { recordUserLocationInFirestore } from '../lib/firebase';
import { RangoliCompassBackground } from './RangoliCompassBackground';
import { LotusRoomBoxBackground } from './LotusRoomBoxBackground';
import { RoomSelectorModal, getRoomIconComponent } from './RoomSelectorModal';
import {
  Compass,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Smartphone,
  ShieldAlert,
  Crosshair,
  SlidersHorizontal,
  X,
  Check,
  RefreshCw,
  HelpCircle,
  MapPin,
  Navigation,
  LocateFixed,
  Globe,
  Activity,
  Gauge,
  Zap,
  ShieldCheck,
  ChevronDown,
  Plus,
  LayoutGrid,
} from 'lucide-react';

interface VastuCompassViewProps {
  currentDegree: number;
  onDegreeChange: (deg: number) => void;
  onAddRoomWithDegree?: (roomType: string, deg: number, customLabel?: string) => void;
  isActive?: boolean;
}

/**
 * Calculate approximate geomagnetic declination based on latitude & longitude.
 * For Indian coordinates (lat 8..37, lng 68..97), declination ranges from ~+0.5° to +2.5° East.
 */
export function calculateMagneticDeclination(lat: number, lng: number): number {
  if (lat >= 8 && lat <= 38 && lng >= 68 && lng <= 98) {
    const dec = 0.5 + ((lng - 68) / 30) * 1.5;
    return Number(dec.toFixed(1));
  }
  const dec = Math.sin((lat * Math.PI) / 180) * Math.cos((lng * Math.PI) / 180) * 3;
  return Number(dec.toFixed(1));
}

export const VastuCompassView: React.FC<VastuCompassViewProps> = ({
  currentDegree: rawDegree,
  onDegreeChange,
  onAddRoomWithDegree,
  isActive = true,
}) => {
  const [isSensorActive, setIsSensorActive] = useState<boolean>(() => {
    const saved = localStorage.getItem('vastudrishti_compass_sensor_mode');
    return saved !== null ? saved === 'true' : true;
  });
  const [sensorPermissionDenied, setSensorPermissionDenied] = useState(false);
  const [selectedRoomToTest, setSelectedRoomToTest] = useState<string>('kitchen');
  const [isRoomPickerModalOpen, setIsRoomPickerModalOpen] = useState<boolean>(false);

  // First Installation Calibration check
  const [isInitialCalibrationDone, setIsInitialCalibrationDone] = useState<boolean>(() => {
    try {
      return localStorage.getItem('vastudrishti_initial_calibration_done') === 'true';
    } catch {
      return false;
    }
  });

  // Compass Calibration state
  const [calibrationOffset, setCalibrationOffset] = useState<number>(() => {
    const saved = localStorage.getItem('vastudrishti_compass_offset');
    return saved ? parseInt(saved, 10) || 0 : 0;
  });
  const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState(false);
  const [calibrationTab, setCalibrationTab] = useState<'quick' | 'fine' | 'location' | 'guide'>(() => {
    return !isInitialCalibrationDone ? 'guide' : 'quick';
  });

  // Current GPS Location State
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
    accuracy?: number;
    timestamp?: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('vastudrishti_user_location');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleDetectCurrentLocation = useCallback((silent: boolean = false) => {
    if (!navigator.geolocation) {
      if (!silent) setLocationError('Geolocation is not supported by your browser or device.');
      return;
    }
    if (!silent) setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const locData = {
          latitude: Number(latitude.toFixed(6)),
          longitude: Number(longitude.toFixed(6)),
          accuracy: Math.round(accuracy),
          city: 'Live GPS Location',
          country: latitude >= 0 ? 'Northern Hemisphere' : 'Southern Hemisphere',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setUserLocation(locData);
        try {
          localStorage.setItem('vastudrishti_user_location', JSON.stringify(locData));
        } catch {}
        setIsLocating(false);
        if (!silent) playTempleBellChime();

        // Record to Firestore Backend for analytics & user location info
        try {
          let userUid = 'guest_user';
          let userEmail = 'guest@vastudrishti.app';
          let userName = 'Guest Explorer';
          const savedUserStr = localStorage.getItem('vastu_active_user_profile');
          if (savedUserStr) {
            const parsed = JSON.parse(savedUserStr);
            if (parsed.uid) userUid = parsed.uid;
            if (parsed.email) userEmail = parsed.email;
            if (parsed.name) userName = parsed.name;
          }

          await recordUserLocationInFirestore({
            userId: userUid,
            userEmail,
            userName,
            latitude: locData.latitude,
            longitude: locData.longitude,
            accuracy: locData.accuracy,
            city: locData.city,
            country: locData.country,
            deviceHeading: rawDegree,
            timestamp: new Date().toISOString(),
          });
        } catch (err) {
          console.warn('Location Firestore recording notice:', err);
        }
      },
      (err) => {
        setIsLocating(false);
        if (!silent) {
          setLocationError(
            err.code === 1
              ? 'Location access was denied. Please allow GPS permission in your browser settings.'
              : err.message || 'Unable to retrieve your current location. Please try again.'
          );
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }, [rawDegree]);

  // Mandatory Auto-GPS alignment when user opens the compass view
  useEffect(() => {
    handleDetectCurrentLocation(true);
  }, [handleDetectCurrentLocation]);

  // Save offset to localStorage
  const handleUpdateOffset = (newOffset: number) => {
    const normalized = Math.round(((newOffset % 360) + 540) % 360) - 180; // keep between -180 and +180
    setCalibrationOffset(normalized);
    localStorage.setItem('vastudrishti_compass_offset', normalized.toString());
  };

  const markInitialCalibrationCompleted = () => {
    setIsInitialCalibrationDone(true);
    setNeedsCalibrationPrompt(false);
    setSensorHealth('high');
    setSensorAccuracyDeg(1);
    try {
      localStorage.setItem('vastudrishti_initial_calibration_done', 'true');
    } catch {}
    playTempleBellChime();
  };

  // Effective calibrated degree used across all calculations
  const effectiveDegree = Math.round(((rawDegree + calibrationOffset) % 360 + 360) % 360);
  const currentZone = getZoneFromDegree(effectiveDegree);

  // Smooth sub-degree hardware-accelerated visual angle tracking
  const [visualRotationDeg, setVisualRotationDeg] = useState<number>(effectiveDegree);
  const targetAngleRef = useRef<number>(effectiveDegree);
  const currentVisualAngleRef = useRef<number>(effectiveDegree);
  const animFrameIdRef = useRef<number | null>(null);

  // Synchronize target angle when rawDegree or calibrationOffset changes
  useEffect(() => {
    targetAngleRef.current = ((rawDegree + calibrationOffset) % 360 + 360) % 360;
  }, [rawDegree, calibrationOffset]);

  // Buttery-smooth 60fps/120fps continuous interpolation loop without 0/360 wrap glitch
  // Pauses automatically when user leaves compass tab and resumes on focus
  useEffect(() => {
    if (!isActive) {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      return;
    }

    const loop = () => {
      const target = targetAngleRef.current;
      const current = currentVisualAngleRef.current;
      
      // Compute shortest angular distance between current and target (-180 to +180)
      const diff = ((target - (current % 360) + 540) % 360) - 180;
      
      if (Math.abs(diff) > 0.01) {
        // High-responsiveness smoothing factor (0.28 per frame)
        const next = current + diff * (isSensorActive ? 0.28 : 0.45);
        currentVisualAngleRef.current = next;
        setVisualRotationDeg(next);
      }
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isActive, isSensorActive]);

  // Sensor Health & Accuracy State
  const [sensorHealth, setSensorHealth] = useState<'high' | 'medium' | 'needs_calibration' | 'manual'>(() => {
    if (!isInitialCalibrationDone) return 'needs_calibration';
    const savedMode = localStorage.getItem('vastudrishti_compass_sensor_mode');
    return savedMode === 'true' ? 'high' : 'manual';
  });
  const [sensorAccuracyDeg, setSensorAccuracyDeg] = useState<number | null>(null);
  const [needsCalibrationPrompt, setNeedsCalibrationPrompt] = useState<boolean>(() => !isInitialCalibrationDone);
  const [magneticFieldUt, setMagneticFieldUt] = useState<number | null>(null);
  const [sensorApiType, setSensorApiType] = useState<string>('Standard Sensor');

  // Device orientation & magnetometer listener for Android and iOS
  // Pauses all hardware sensor polling when user is on another tab to save battery & prevent background interference
  useEffect(() => {
    if (!isActive || !isSensorActive) {
      if (!isSensorActive) setSensorHealth('manual');
      setNeedsCalibrationPrompt(false);
      return;
    }

    let sampleCount = 0;

    const handleNeedsCalibration = (event: Event) => {
      event.preventDefault();
      setNeedsCalibrationPrompt(true);
      setSensorHealth('needs_calibration');
    };

    const handleOrientation = (event: DeviceOrientationEvent) => {
      let alpha = event.alpha;
      // webkitCompassHeading & accuracy for iOS Safari / Mobile WebKit
      const webkitHeading = (event as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
      const webkitAccuracy = (event as unknown as { webkitCompassAccuracy?: number }).webkitCompassAccuracy;
      const isAbsolute = (event as unknown as { absolute?: boolean }).absolute;

      if (isAbsolute) {
        setSensorApiType('Android Absolute Orientation');
      }

      if (webkitAccuracy !== undefined && webkitAccuracy >= 0) {
        const acc = Math.round(webkitAccuracy);
        setSensorAccuracyDeg(acc);
        if (acc <= 15 && isInitialCalibrationDone) {
          setSensorHealth('high');
          setNeedsCalibrationPrompt(false);
        } else if (acc <= 25) {
          setSensorHealth('medium');
        } else {
          setSensorHealth('needs_calibration');
          setNeedsCalibrationPrompt(true);
        }
      } else {
        sampleCount++;
        if (sampleCount > 3 && !needsCalibrationPrompt && isInitialCalibrationDone) {
          setSensorHealth('high');
          setSensorAccuracyDeg(2);
        }
      }

      if (webkitHeading !== undefined) {
        alpha = webkitHeading;
        setSensorApiType('iOS Compass Sensor');
      } else if (alpha !== null) {
        alpha = 360 - alpha; // Convert to clockwise
      }

      if (alpha !== null && !isNaN(alpha)) {
        // Feed continuous angle directly to target for smooth visual interpolation
        const normalized = ((alpha + calibrationOffset) % 360 + 360) % 360;
        targetAngleRef.current = normalized;
        onDegreeChange(Math.round(alpha));
      }
    };

    // Try Generic Sensor API Magnetometer if available (Chromium/Android)
    let magSensor: any = null;
    try {
      if ('Magnetometer' in window) {
        magSensor = new (window as any).Magnetometer({ frequency: 10 });
        magSensor.addEventListener('reading', () => {
          if (magSensor.x !== undefined && magSensor.y !== undefined && magSensor.z !== undefined) {
            const magnitude = Math.sqrt(magSensor.x * magSensor.x + magSensor.y * magSensor.y + magSensor.z * magSensor.z);
            setMagneticFieldUt(Math.round(magnitude));
          }
        });
        magSensor.start();
      }
    } catch (e) {
      // Generic Sensor Magnetometer fallback
    }

    // Modern Android devices fire 'deviceorientationabsolute' for true magnetic North
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', handleOrientation as any, true);
    }
    window.addEventListener('deviceorientation', handleOrientation, true);
    window.addEventListener('compassneedscalibration', handleNeedsCalibration, true);

    return () => {
      if ('ondeviceorientationabsolute' in window) {
        window.removeEventListener('deviceorientationabsolute', handleOrientation as any, true);
      }
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('compassneedscalibration', handleNeedsCalibration, true);
      if (magSensor) {
        try { magSensor.stop(); } catch {}
      }
    };
  }, [isActive, isSensorActive, onDegreeChange, needsCalibrationPrompt, isInitialCalibrationDone, calibrationOffset]);

  const toggleSensor = async () => {
    if (isSensorActive) {
      setIsSensorActive(false);
      try {
        localStorage.setItem('vastudrishti_compass_sensor_mode', 'false');
      } catch {}
      return;
    }

    // Check if DeviceOrientationEvent requires permission (iOS 13+)
    const req = (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<'granted' | 'denied'> }).requestPermission;
    if (typeof req === 'function') {
      try {
        const response = await req();
        if (response === 'granted') {
          setIsSensorActive(true);
          setSensorPermissionDenied(false);
          try {
            localStorage.setItem('vastudrishti_compass_sensor_mode', 'true');
          } catch {}
          playTempleBellChime();
        } else {
          setSensorPermissionDenied(true);
        }
      } catch {
        setSensorPermissionDenied(true);
      }
    } else if ('DeviceOrientationEvent' in window) {
      setIsSensorActive(true);
      setSensorPermissionDenied(false);
      try {
        localStorage.setItem('vastudrishti_compass_sensor_mode', 'true');
      } catch {}
      playTempleBellChime();
    } else {
      setSensorPermissionDenied(true);
    }
  };

  // Test selected room in current zone
  const testedRoomDef = ROOM_DEFINITIONS.find((r) => r.id === selectedRoomToTest);
  let roomSuitability: 'Ideal' | 'Passable' | 'Dosh' = 'Passable';
  if (testedRoomDef) {
    if (testedRoomDef.idealZones.includes(currentZone.code)) roomSuitability = 'Ideal';
    else if (testedRoomDef.disallowedZones.includes(currentZone.code)) roomSuitability = 'Dosh';
  }

  return (
    <div className="flex flex-col gap-3.5 sm:gap-5 p-3 sm:p-5 max-w-4xl mx-auto pb-24 font-sans text-[#3D342D]">
      {/* Top Banner / Status - Space-Optimized Compact Header */}
      <div className="bg-[#FCFAF7] border border-[#E8DCC4] rounded-2xl p-3 sm:p-3.5 flex flex-col gap-2.5 shadow-2xs w-full overflow-hidden">
        <div className="flex items-center gap-2.5 min-w-0 w-full">
          <div className="p-1.5 bg-[#FFFBEB] text-[#D97706] rounded-xl border border-[#FEF3C7] shrink-0">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs sm:text-sm font-serif font-bold text-[#78350F] leading-tight">
              16-Zone Vastu Shastra Compass
            </h2>
            <p className="text-[10px] sm:text-[11px] text-[#8B735B] leading-tight font-sans mt-0.5">
              Align device or rotate dial to analyze Pancha Mahabhuta energies.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full justify-start pt-1 border-t border-[#E8DCC4]/50">
          {/* Real-time Sensor Health Badge */}
          {isSensorActive ? (
            <button
              onClick={() => {
                setCalibrationTab('guide');
                setIsCalibrationModalOpen(true);
                playTempleBellChime();
              }}
              title="Click to check sensor calibration & run Figure-8 loop"
              className={`px-2.5 py-1 text-[10.5px] font-sans font-bold rounded-lg flex items-center gap-1.5 border transition-all cursor-pointer shadow-2xs ${
                sensorHealth === 'high'
                  ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0] hover:bg-[#D1FAE5]'
                  : sensorHealth === 'medium'
                  ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] hover:bg-[#FEF3C7]'
                  : 'bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5] animate-pulse hover:bg-[#FEE2E2]'
              }`}
            >
              {sensorHealth === 'high' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping shrink-0" />
                  <ShieldCheck className="w-3 h-3 text-[#10B981]" />
                  <span>High Acc (±{sensorAccuracyDeg || 1}°)</span>
                </>
              ) : sensorHealth === 'medium' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0" />
                  <Activity className="w-3 h-3 text-[#D97706]" />
                  <span>Normal (±{sensorAccuracyDeg || 3}°)</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-ping shrink-0" />
                  <AlertTriangle className="w-3 h-3 text-[#DC2626]" />
                  <span className="font-extrabold">Wave 8 Calib</span>
                </>
              )}
            </button>
          ) : (
            <div className="px-2 py-1 text-[10px] font-sans font-semibold text-[#8B735B] bg-white border border-[#E8DCC4] rounded-lg flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB]" />
              <span>Manual</span>
            </div>
          )}

          {/* Calibration Quick Action Button */}
          <button
            onClick={() => {
              setIsCalibrationModalOpen(true);
              playTempleBellChime();
            }}
            className={`px-2.5 py-1 text-[10.5px] font-sans font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 transition-all shadow-2xs cursor-pointer ${
              calibrationOffset !== 0
                ? 'bg-[#FEF3C7] text-[#78350F] border border-[#F59E0B] hover:bg-[#FDE68A]'
                : 'bg-white text-[#78350F] border border-[#E8DCC4] hover:bg-[#F3EFE0]'
            }`}
          >
            <Crosshair className="w-3 h-3 text-[#D97706]" />
            <span>Calibrate</span>
            {calibrationOffset !== 0 && (
              <span className="text-[9px] bg-[#D97706] text-white font-extrabold px-1 rounded">
                {calibrationOffset > 0 ? `+${calibrationOffset}°` : `${calibrationOffset}°`}
              </span>
            )}
          </button>

          {/* Device Sensor Toggle Button */}
          <button
            onClick={toggleSensor}
            className={`px-2.5 py-1 text-[10.5px] font-sans font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 transition-all shadow-2xs cursor-pointer ${
              isSensorActive
                ? 'bg-[#10B981] text-white hover:bg-[#059669]'
                : 'bg-[#78350F] text-[#F3EFE0] hover:bg-[#5C280B]'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            {isSensorActive ? 'Device Sensor: ON' : 'Device Sensor'}
          </button>
        </div>
      </div>

      {/* Sensor Calibration Alert Banner when magnetic interference detected or initial calibration required */}
      {(sensorHealth === 'needs_calibration' || needsCalibrationPrompt || !isInitialCalibrationDone) && (
        <div className="bg-[#FEF2F2] border-2 border-[#FCA5A5] p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#FEE2E2] text-[#DC2626] rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#991B1B]">
                {!isInitialCalibrationDone
                  ? 'Sensor Distorted — Initial Calibration Required'
                  : 'Magnetic Distortion / Sensor Interference Detected'}
              </h4>
              <p className="text-[11px] text-[#7F1D1D]">
                {!isInitialCalibrationDone
                  ? 'Initial setup detected. Please calibrate your smartphone sensor with a Figure-8 wave or align GPS to ensure exact Vastu zone accuracy.'
                  : 'Your device magnetometer accuracy has degraded. Wave your phone in a Figure-8 loop to restore 100% Vastu accuracy.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setCalibrationTab('guide');
              setIsCalibrationModalOpen(true);
              playTempleBellChime();
            }}
            className="px-3 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold uppercase tracking-wider rounded-xl shrink-0 shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" /> Calibrate Now
          </button>
        </div>
      )}

      {sensorPermissionDenied && (
        <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs p-3.5 rounded-2xl flex items-center gap-2 font-sans">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Device orientation sensor not available on this browser/device. Use manual compass slider below.</span>
        </div>
      )}

      {/* Main Interactive Compass Dial Card */}
      <div className="bg-gradient-to-b from-[#FFFDF9] via-[#FCFAF7] to-[#F3EFE0] rounded-3xl border-2 border-[#E8DCC4] p-6 shadow-md flex flex-col items-center gap-6 relative overflow-hidden">
        {/* Four Sacred Corner Flourishes */}
        <div className="absolute top-3 left-3 text-[#D97706]/20 font-serif font-black text-xs select-none">❖ VASTU</div>
        <div className="absolute top-3 right-3 text-[#D97706]/20 font-serif font-black text-xs select-none">SHASTRA ❖</div>
        <div className="absolute bottom-3 left-3 text-[#D97706]/20 font-serif font-black text-xs select-none">❖ 360°</div>
        <div className="absolute bottom-3 right-3 text-[#D97706]/20 font-serif font-black text-xs select-none">ALIGN ❖</div>

        {/* Degree Header & Current Zone */}
        <div className="text-center z-10">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-[#F3EFE0] text-[#78350F] text-xs font-sans font-semibold mb-1 border border-[#E8DCC4] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#D97706] animate-ping" />
            Facing Angle: <span className="font-bold text-[#3D342D] text-sm">{effectiveDegree}°</span>
          </div>
          <p className="text-xs font-sans font-medium text-[#8B735B] flex items-center justify-center gap-2 mt-1">
            <span>Deity: <strong className="text-[#3D342D]">{currentZone.deity}</strong></span>
            <span>•</span>
            <span>Element: <strong className="text-[#D97706]">{currentZone.element}</strong></span>
          </p>
        </div>

        {/* 360° Rotating Compass Visualizer */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 my-2 flex items-center justify-center select-none">
          {/* Authentic Indian Floral Lotus Rangoli Background Design - Perfectly Centered on Dial */}
          <RangoliCompassBackground opacity={0.6} />

          {/* Outer Decorative Rings */}
          <div className="absolute w-full h-full border border-[#E8DCC4] rounded-full opacity-60"></div>
          <div className="absolute w-[90%] h-[90%] border-2 border-[#D97706] rounded-full opacity-20"></div>

          {/* Outer Degree Track Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-[#F3EFE0] shadow-inner flex items-center justify-center bg-white/40 backdrop-blur-[0.5px]"></div>

          {/* Rotating Dial Circle */}
          <div
            className="absolute inset-5 rounded-full border border-[#E8DCC4] flex items-center justify-center will-change-transform"
            style={{ transform: `rotate(${-visualRotationDeg}deg)` }}
          >
            {/* 16 Zone Spokes & Labels */}
            {VASTU_ZONES.map((zone) => {
              const rad = ((zone.centerDegree - 90) * Math.PI) / 180;
              const radius = 108; // offset radius
              const x = Math.cos(rad) * radius;
              const y = Math.sin(rad) * radius;

              const isSelected = zone.code === currentZone.code;

              return (
                <div
                  key={zone.code}
                  className="absolute flex items-center justify-center will-change-transform"
                  style={{ transform: `translate(${x}px, ${y}px)` }}
                >
                  <span
                    className={`text-[10px] font-sans font-extrabold px-2 py-0.5 rounded-full border transition-colors ${
                      isSelected
                        ? 'bg-[#78350F] text-[#FCFAF7] border-[#D97706] scale-125 z-20 shadow-md ring-2 ring-[#D97706]/40'
                        : 'bg-[#FCFAF7]/90 text-[#8B735B] border-[#E8DCC4]'
                    }`}
                    style={{ transform: `rotate(${visualRotationDeg}deg)` }}
                  >
                    {zone.code}
                  </span>
                </div>
              );
            })}

            {/* Inner Sacred Mandala Sun Dial */}
            <div className="w-32 h-32 rounded-full border-2 border-dashed border-[#D97706]/50 bg-[#FFFBEB] flex items-center justify-center relative shadow-xs">
              <div className="text-center will-change-transform" style={{ transform: `rotate(${visualRotationDeg}deg)` }}>
                <span className="text-xl font-serif font-extrabold text-[#78350F] block">{currentZone.code}</span>
                <span className="text-[10px] font-sans uppercase tracking-wider text-[#A68A64] font-bold block">{currentZone.shortName}</span>
              </div>
            </div>
          </div>

          {/* Fixed Top Needle Pointer */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
            <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-14 border-b-[#D97706] drop-shadow-md" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#78350F]" />
          </div>
        </div>

        {/* Instant Room Selection & Add to Audit Bar (Positioned directly below compass) */}
        <div className="w-full max-w-md z-10 bg-gradient-to-b from-[#FFFDF9] via-[#FFFDF5] to-[#FFFBEB] p-4 rounded-3xl border-2 border-[#D97706]/60 shadow-md flex flex-col gap-3 relative overflow-hidden">
          {/* Synchronized Sacred Lotus Mandala & Corner Background */}
          <LotusRoomBoxBackground opacity={0.6} />

          {/* Centered Header Label */}
          <div className="flex items-center justify-center relative z-10">
            <span className="text-[11px] font-sans font-extrabold uppercase tracking-widest text-[#78350F] flex items-center gap-1.5 text-center">
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
              ROOM SELECTION
            </span>
          </div>

          {/* Room Selector Interactive Button & Add Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 relative z-10">
            {/* Room Selection Pop-up Trigger */}
            <button
              type="button"
              onClick={() => {
                setIsRoomPickerModalOpen(true);
                playTempleBellChime();
              }}
              className="flex-1 bg-white hover:bg-[#FFFDF9] border-2 border-[#E8DCC4] hover:border-[#D97706] rounded-2xl p-2.5 px-3 flex items-center justify-between gap-2.5 shadow-2xs transition-all text-left cursor-pointer group"
              title="Click to open Room Selection Menu"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#FFFBEB] text-[#78350F] border border-[#FDE68A] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  {getRoomIconComponent(testedRoomDef?.iconName || 'Sparkles', 'w-4 h-4 text-[#78350F]')}
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-serif font-bold text-[#3D342D] truncate block">
                    {testedRoomDef?.label || 'Select Room'}
                  </span>
                  {testedRoomDef?.id === 'entrance' ? (
                    <span className="text-[10px] font-sans font-semibold text-[#D97706] bg-[#FFFBEB] px-1.5 py-0.2 rounded border border-[#FDE68A] inline-block mt-0.5">
                      Facing Exit
                    </span>
                  ) : testedRoomDef?.hindiName ? (
                    <span className="text-[10px] text-[#8B735B] truncate block opacity-80">
                      {testedRoomDef.hindiName}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#F3EFE0] text-[#78350F] text-[10.5px] font-bold uppercase tracking-wider group-hover:bg-[#D97706] group-hover:text-white transition-all shadow-2xs">
                <LayoutGrid className="w-3 h-3" />
                <span>Select</span>
                <ChevronDown className="w-3 h-3" />
              </div>
            </button>

            {onAddRoomWithDegree && (
              <button
                type="button"
                onClick={() => {
                  onAddRoomWithDegree(selectedRoomToTest, effectiveDegree);
                  playTempleBellChime();
                }}
                className="py-3 px-4 text-xs font-bold uppercase tracking-wider rounded-2xl bg-[#78350F] hover:bg-[#5C280B] text-[#F3EFE0] shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95 cursor-pointer border border-[#9A420F]"
              >
                <Plus className="w-4 h-4 text-[#D97706]" />
                <span className="whitespace-nowrap">ADD TO AUDIT</span>
              </button>
            )}
          </div>
        </div>

        {/* Manual Degree Slider Controls (Only visible when Sensor Mode is OFF) */}
        {!isSensorActive && (
          <div className="w-full max-w-md flex flex-col gap-2 z-10 px-2 font-sans animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-semibold text-[#8B735B]">
              <span className="uppercase tracking-widest text-[10px]">Manual Orientation:</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    onDegreeChange(0);
                    handleUpdateOffset(0);
                    playTempleBellChime();
                  }}
                  className="text-[#D97706] hover:text-[#B45309] flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset North (0°)
                </button>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="359"
              value={effectiveDegree}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                // Calculate adjusted raw degree based on calibration offset
                const newRaw = Math.round(((val - calibrationOffset) % 360 + 360) % 360);
                targetAngleRef.current = val;
                currentVisualAngleRef.current = val;
                setVisualRotationDeg(val);
                onDegreeChange(newRaw);
              }}
              className="w-full h-3 bg-[#FFFBEB] border-2 border-[#D97706] rounded-full appearance-none cursor-pointer accent-[#D97706] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#D97706]"
            />
            <div className="flex justify-between text-[10px] font-bold text-[#A68A64] px-1">
              <span>0° N</span>
              <span>90° E</span>
              <span>180° S</span>
              <span>270° W</span>
              <span>360° N</span>
            </div>
          </div>
        )}
      </div>

      {/* Zone Details & Elemental Alignment Cards */}
      <div className="flex flex-col gap-5 font-sans">
        {/* BOX 2: Directional Suitability Guide */}
        <div className="bg-[#FCFAF7] rounded-3xl border-2 border-[#E8DCC4] p-4 sm:p-6 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#E8DCC4] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D97706] shrink-0" />
              <h4 className="text-base font-serif font-bold text-[#78350F]">
                Directional Suitability Guide — {currentZone.shortName} ({effectiveDegree}°)
              </h4>
            </div>
            <span className="text-xs font-semibold text-[#8B735B]">
              Add or check room placement for this specific direction
            </span>
          </div>

          {/* TWO-COLUMN GRID BELOW: Best Suited For vs Strictly Avoid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            {/* Column 1: Best Suited For (Auspicious) */}
            <div className="bg-white p-4 rounded-2xl border border-[#D1FAE5] shadow-2xs flex flex-col justify-between min-w-0">
              <div>
                <span className="text-[11px] font-bold text-[#059669] uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" /> Best Suited For (Auspicious):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentZone.bestSuitedFor.map((item, idx) => (
                    <span
                      key={`${item}_${idx}`}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] inline-block"
                    >
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: Strictly Avoid (Vastu Dosh Risks) */}
            <div className="bg-white p-4 rounded-2xl border border-[#FCA5A5]/60 shadow-2xs flex flex-col justify-between min-w-0">
              <div>
                <span className="text-[11px] font-bold text-[#991B1B] uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-[#991B1B] shrink-0" /> Strictly Avoid Here (Vastu Dosh):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentZone.strictlyAvoid.map((item, idx) => (
                    <span
                      key={`${item}_${idx}`}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] inline-block"
                    >
                      ✕ {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOX 3: Zone Direction Attributes Summary */}
        <div className="bg-[#FCFAF7] rounded-3xl border border-[#E8DCC4] p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full inline-block border border-[#E8DCC4] shrink-0"
                style={{ backgroundColor: currentZone.colorHex }}
              />
              <h4 className="text-base font-serif font-bold text-[#78350F]">
                {currentZone.name} ({currentZone.code}) Direction Attributes
              </h4>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F3EFE0] text-[#78350F] border border-[#E8DCC4]">
                {currentZone.minDegree}° – {currentZone.maxDegree}° Range
              </span>
            </div>
            <p className="text-xs text-[#3D342D] leading-relaxed">{currentZone.description}</p>
          </div>

          {/* Key Traits Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs w-full lg:w-auto shrink-0 bg-white p-3 rounded-2xl border border-[#E8DCC4]">
            <div className="text-center px-2 py-1 border-r border-[#E8DCC4]/50">
              <span className="text-[10px] text-[#8B735B] uppercase tracking-wider block font-bold">Deity</span>
              <span className="font-bold text-[#3D342D] text-xs truncate block">{currentZone.deity}</span>
            </div>
            <div className="text-center px-2 py-1 border-r border-[#E8DCC4]/50">
              <span className="text-[10px] text-[#8B735B] uppercase tracking-wider block font-bold">Planet</span>
              <span className="font-bold text-[#3D342D] text-xs truncate block">{currentZone.rulingPlanet}</span>
            </div>
            <div className="text-center px-2 py-1 border-r border-[#E8DCC4]/50">
              <span className="text-[10px] text-[#8B735B] uppercase tracking-wider block font-bold">Element</span>
              <span className="font-bold text-[#D97706] text-xs truncate block">{currentZone.element}</span>
            </div>
            <div className="text-center px-2 py-1">
              <span className="text-[10px] text-[#8B735B] uppercase tracking-wider block font-bold">Colors</span>
              <span className="font-bold text-[#3D342D] text-xs truncate block">{currentZone.color}</span>
            </div>
          </div>
        </div>
      </div>

      {/* COMPASS CALIBRATION MODAL */}
      {isCalibrationModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
          <div className="bg-[#FCFAF7] rounded-3xl border border-[#E8DCC4] max-w-lg w-full p-5 sm:p-6 shadow-2xl relative space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E8DCC4] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#FEF3C7] text-[#D97706] rounded-xl border border-[#FDE68A]">
                  <Crosshair className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-[#78350F]">
                    Compass Calibration & Alignment
                  </h3>
                  <p className="text-[11px] text-[#8B735B]">
                    Detect current GPS location, coordinate alignment & sensor offset for 100% precise Vastu readings.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCalibrationModalOpen(false)}
                className="p-1.5 rounded-full text-[#8B735B] hover:text-[#78350F] hover:bg-[#F3EFE0] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#F3EFE0] rounded-2xl text-[11px] font-bold text-[#78350F]">
              <button
                onClick={() => setCalibrationTab('quick')}
                className={`py-2 rounded-xl transition-all ${
                  calibrationTab === 'quick' ? 'bg-[#78350F] text-white shadow-xs' : 'hover:bg-white/50'
                }`}
              >
                Quick Zero
              </button>
              <button
                onClick={() => setCalibrationTab('fine')}
                className={`py-2 rounded-xl transition-all ${
                  calibrationTab === 'fine' ? 'bg-[#78350F] text-white shadow-xs' : 'hover:bg-white/50'
                }`}
              >
                Fine Tune
              </button>
              <button
                onClick={() => setCalibrationTab('location')}
                className={`py-2 rounded-xl transition-all ${
                  calibrationTab === 'location' ? 'bg-[#78350F] text-white shadow-xs' : 'hover:bg-white/50'
                }`}
              >
                Location
              </button>
              <button
                onClick={() => setCalibrationTab('guide')}
                className={`py-2 rounded-xl transition-all ${
                  calibrationTab === 'guide' ? 'bg-[#78350F] text-white shadow-xs' : 'hover:bg-white/50'
                }`}
              >
                Sensor 8-Loop
              </button>
            </div>

            {/* Top Right Sub-bar: Offset & Reset to Factory Default */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-[#8B735B]">
                Current Offset: <strong className="text-[#78350F]">{calibrationOffset > 0 ? `+${calibrationOffset}°` : `${calibrationOffset}°`}</strong>
              </span>
              <button
                onClick={() => {
                  handleUpdateOffset(0);
                  playTempleBellChime();
                }}
                className="text-[11px] font-bold text-[#991B1B] hover:text-[#7F1D1D] flex items-center gap-1.5 px-2.5 py-1 bg-[#FEF2F2] hover:bg-[#FEE2E2] rounded-lg border border-[#FECACA] transition-all cursor-pointer shadow-2xs"
                title="Reset compass calibration offset to 0°"
              >
                <RotateCcw className="w-3 h-3 text-[#991B1B]" /> Reset to Factory Default (0°)
              </button>
            </div>

            {/* TAB 1: QUICK ZERO NORTH */}
            {calibrationTab === 'quick' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-[#E8DCC4] text-center space-y-2">
                  <span className="text-xs font-bold text-[#8B735B] uppercase tracking-wider block">
                    Current Uncalibrated Raw Heading
                  </span>
                  <div className="text-3xl font-serif font-black text-[#78350F]">
                    {rawDegree}°
                  </div>
                  <div className="text-xs text-[#D97706] font-semibold">
                    Calibrated Heading: <strong className="text-[#3D342D]">{effectiveDegree}°</strong>
                  </div>
                </div>

                <div className="bg-[#FFFBEB] p-4 rounded-2xl border border-[#FEF3C7] space-y-3">
                  <h4 className="text-xs font-bold text-[#78350F] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#D97706]" />
                    Point Phone to Physical North (0°)
                  </h4>
                  <p className="text-xs text-[#8B735B] leading-relaxed">
                    Stand facing true North in your building or plot. Tap below to set your current physical facing direction directly as 0° North.
                  </p>
                  <button
                    onClick={() => {
                      // Set offset so current raw degree maps to 0
                      const newOffset = (360 - rawDegree) % 360;
                      handleUpdateOffset(newOffset);
                      playTempleBellChime();
                    }}
                    className="w-full py-3 px-4 bg-[#78350F] hover:bg-[#5C280B] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Crosshair className="w-4 h-4 text-[#F59E0B]" />
                    Set Current Facing Direction as True North (0°)
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: FINE TUNE OFFSET */}
            {calibrationTab === 'fine' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-[#E8DCC4] space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-[#78350F]">
                    <span>Manual Calibration Offset:</span>
                    <span className="text-sm font-black text-[#D97706]">
                      {calibrationOffset > 0 ? `+${calibrationOffset}°` : `${calibrationOffset}°`}
                    </span>
                  </div>

                  {/* Step Adjustment Buttons */}
                  <div className="grid grid-cols-6 gap-1.5">
                    {[-15, -5, -1, 1, 5, 15].map((step) => (
                      <button
                        key={step}
                        onClick={() => {
                          handleUpdateOffset(calibrationOffset + step);
                          playTempleBellChime();
                        }}
                        className="py-2 text-xs font-bold rounded-xl border border-[#E8DCC4] bg-[#FCFAF7] hover:bg-[#FEF3C7] text-[#78350F] transition-all"
                      >
                        {step > 0 ? `+${step}°` : `${step}°`}
                      </button>
                    ))}
                  </div>

                  {/* Range Slider for Offset */}
                  <div className="pt-2 space-y-1">
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={calibrationOffset}
                      onChange={(e) => handleUpdateOffset(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-[#F3EFE0] rounded-lg appearance-none cursor-pointer accent-[#D97706]"
                    />
                    <div className="flex justify-between text-[10px] text-[#8B735B] font-bold">
                      <span>-180° (West Shift)</span>
                      <span>0° (Standard)</span>
                      <span>+180° (East Shift)</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-[#8B735B] bg-[#FFFBEB] p-3 rounded-xl border border-[#FEF3C7] flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                  <span>
                    Fine-tuning allows correcting for local structural steel beams, iron door frames, or electrical panels that distort magnetic readings.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 3: CURRENT LOCATION & GPS COORDINATES */}
            {calibrationTab === 'location' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-[#E8DCC4] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-[#FEF3C7] text-[#D97706] rounded-xl border border-[#FDE68A]">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-serif font-bold text-[#78350F]">
                          GPS Geolocation Coordinates
                        </h4>
                        <span className="text-[10px] text-[#8B735B]">
                          Live coordinates for geographical position & directional accuracy
                        </span>
                      </div>
                    </div>

                    {userLocation && (
                      <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#10B981]" /> Auto-Filled
                      </span>
                    )}
                  </div>

                  {/* Detect Live GPS Button */}
                  <button
                    type="button"
                    onClick={() => handleDetectCurrentLocation(false)}
                    disabled={isLocating}
                    className="w-full py-2.5 px-4 bg-[#78350F] hover:bg-[#5C280B] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLocating ? (
                      <>
                        <RefreshCw className="w-4 h-4 text-[#F59E0B] animate-spin" />
                        Detecting Live GPS Coordinates...
                      </>
                    ) : (
                      <>
                        <LocateFixed className="w-4 h-4 text-[#F59E0B]" />
                        {userLocation ? 'Re-Sync Live GPS Location' : 'Detect & Auto-Fill My GPS Location'}
                      </>
                    )}
                  </button>

                  {/* Location Error Notice */}
                  {locationError && (
                    <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-xs text-[#991B1B] flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{locationError}</span>
                    </div>
                  )}

                  {/* Active Location Coordinates Display */}
                  {userLocation ? (
                    <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8DCC4] space-y-2.5">
                      <div className="flex items-center justify-between text-xs border-b border-[#E8DCC4] pb-2">
                        <span className="font-bold text-[#78350F] flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-[#D97706]" /> {userLocation.city || 'Detected Location'}
                        </span>
                        <span className="text-[10px] text-[#8B735B] font-mono">
                          Synced at {userLocation.timestamp}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="bg-white p-2 rounded-lg border border-[#E8DCC4]">
                          <span className="text-[10px] text-[#8B735B] block font-sans">Latitude:</span>
                          <strong className="text-[#78350F]">{userLocation.latitude}° N</strong>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-[#E8DCC4]">
                          <span className="text-[10px] text-[#8B735B] block font-sans">Longitude:</span>
                          <strong className="text-[#78350F]">{userLocation.longitude}° E</strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#8B735B] pt-0.5">
                        <span>Accuracy: <strong>±{userLocation.accuracy || 5}m</strong></span>
                        <span>{userLocation.country || 'Northern Hemisphere'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#FFFBEB] rounded-xl border border-[#FEF3C7] text-xs text-[#8B735B] text-center">
                      GPS coordinates are recording automatically in background. Tap the button above to manually refresh.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: SENSOR MAGNETOMETER FIGURE-8 GUIDE */}
            {calibrationTab === 'guide' && (
              <div className="space-y-4 text-center">
                <div className="bg-white p-5 rounded-2xl border border-[#E8DCC4] flex flex-col items-center gap-3">
                  {/* Figure 8 Vector Animation */}
                  <div className="relative w-36 h-24 flex items-center justify-center">
                    <svg viewBox="0 0 160 100" className="w-full h-full text-[#D97706]">
                      <path
                        d="M 40 50 C 10 10, 10 90, 40 50 C 70 10, 150 10, 120 50 C 90 90, 10 90, 40 50 C 70 10, 150 90, 120 50"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeDasharray="6 4"
                        className="animate-pulse"
                      />
                      <circle cx="80" cy="50" r="6" fill="#78350F" />
                    </svg>
                    <Smartphone className="w-6 h-6 text-[#78350F] absolute animate-bounce" />
                  </div>

                  <h4 className="text-sm font-serif font-bold text-[#78350F]">
                    Smartphone Magnetometer Sensor Wave
                  </h4>
                  <p className="text-xs text-[#8B735B] leading-relaxed max-w-sm">
                    Hold your phone flat in hand and wave it smoothly in a <strong>Figure-8 loop</strong> 3 to 4 times in the air. This recalculates internal gyroscope coils and removes accumulated magnetic static.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      markInitialCalibrationCompleted();
                      setIsCalibrationModalOpen(false);
                    }}
                    className="w-full mt-2 py-3 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    Figure-8 Wave Complete (Mark Calibrated)
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs p-3 rounded-xl border transition-all ${
                  sensorHealth === 'high'
                    ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                    : sensorHealth === 'medium'
                    ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                    : isSensorActive
                    ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]'
                    : 'bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB]'
                }">
                  <div className="flex items-center gap-2 font-bold">
                    {sensorHealth === 'high' ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                        <span>Magnetometer Health: High Precision (±{sensorAccuracyDeg || 1}°)</span>
                      </>
                    ) : sensorHealth === 'medium' ? (
                      <>
                        <Activity className="w-4 h-4 text-[#D97706] shrink-0" />
                        <span>Magnetometer Health: Good (±{sensorAccuracyDeg || 3}°)</span>
                      </>
                    ) : isSensorActive ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 animate-bounce" />
                        <span>Magnetometer: Sensor Distorted (Wave Figure-8)</span>
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4 text-[#9CA3AF] shrink-0" />
                        <span>Sensor Idle (Manual Mode)</span>
                      </>
                    )}
                  </div>

                  {isSensorActive && (
                    <button
                      onClick={() => {
                        markInitialCalibrationCompleted();
                      }}
                      className="px-2 py-1 bg-white hover:bg-[#F3EFE0] text-[#78350F] text-[10px] font-bold rounded-lg border border-[#E8DCC4] transition-all cursor-pointer"
                    >
                      Clear Warnings
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Footer Done Action */}
            <div className="pt-2">
              <button
                onClick={() => {
                  markInitialCalibrationCompleted();
                  setIsCalibrationModalOpen(false);
                }}
                className="w-full py-3 bg-[#78350F] hover:bg-[#5C280B] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 text-[#F59E0B]" /> Done Calibrating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2 x 4 Room Selection Pop-up Modal */}
      <RoomSelectorModal
        isOpen={isRoomPickerModalOpen}
        onClose={() => setIsRoomPickerModalOpen(false)}
        selectedRoomId={selectedRoomToTest}
        onSelectRoom={(roomId) => setSelectedRoomToTest(roomId)}
        currentZone={currentZone}
        effectiveDegree={effectiveDegree}
        onAddRoomToAudit={onAddRoomWithDegree}
      />
    </div>
  );
};

