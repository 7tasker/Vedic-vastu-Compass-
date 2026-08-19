import React, { useState } from 'react';
import { PropertyRecord, PlacedRoom, UserProfile } from '../types';
import { calculateHouseAudit, playTempleBellChime } from '../utils/vastuUtils';
import {
  MapPin,
  Navigation,
  Plus,
  Building2,
  Home,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Scale,
  X,
  Sparkles,
  Trash2,
  ExternalLink,
  Lock,
  Key,
} from 'lucide-react';

interface PropertyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: PropertyRecord[];
  activePropertyId: string;
  onSelectProperty: (id: string) => void;
  onSaveProperty: (property: PropertyRecord) => void;
  onDeleteProperty: (id: string) => void;
  currentPlacedRooms: PlacedRoom[];
  currentFacingDegree: number;
  isAuditUnlocked?: boolean;
  onUnlockAudit?: (planId?: string) => void;
  userProfile?: UserProfile;
  unlockedPropertyIds?: string[];
  isPropertyUnlocked?: (id: string) => boolean;
  onImportProperties?: (props: PropertyRecord[]) => void;
}

export const PropertyManagerModal: React.FC<PropertyManagerModalProps> = ({
  isOpen,
  onClose,
  properties,
  activePropertyId,
  onSelectProperty,
  onSaveProperty,
  onDeleteProperty,
  currentPlacedRooms,
  currentFacingDegree,
  isAuditUnlocked = false,
  onUnlockAudit,
  userProfile,
  unlockedPropertyIds = [],
  isPropertyUnlocked,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'compare'>('list');

  // Check if a specific property ID is unlocked
  const checkIsUnlocked = (propId: string): boolean => {
    if (isPropertyUnlocked) return isPropertyUnlocked(propId);
    if (isAuditUnlocked) return true;
    if (unlockedPropertyIds.includes(propId)) return true;
    return false;
  };

  // Single Pass property limit rules:
  // - 2 addresses total if demo property is present (1 demo + 1 custom)
  // - 1 address total if demo property was deleted
  // - Unlimited if Pro member / unlocked
  const isGlobalPro = userProfile?.isProMember || isAuditUnlocked;
  const hasDemoProperty = properties.some((p) => p.isDemo || p.id === 'prop_1' || p.id === 'prop_2');
  const maxAllowedProperties = isGlobalPro ? Infinity : (hasDemoProperty ? 2 : 1);
  const isLimitReached = properties.length >= maxAllowedProperties;

  // Form state for adding/editing property
  const [propertyName, setPropertyName] = useState('');
  const [address, setAddress] = useState('');
  const [addressType, setAddressType] = useState<'manual' | 'gps'>('manual');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>();
  const [propertyType, setPropertyType] = useState<PropertyRecord['propertyType']>('Flat/Apartment');
  const [facingDeg, setFacingDeg] = useState(currentFacingDegree);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');

  if (!isOpen) return null;

  // Handle GPS Geolocation
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Detecting current GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setAddressType('gps');
        const formattedAddress = `GPS: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E (Auto-Detected Location)`;
        setAddress(formattedAddress);
        setIsLocating(false);
        setLocationStatus('✓ Location captured successfully!');
        if (!propertyName) {
          setPropertyName(`Property @ ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`);
        }
      },
      (error) => {
        setIsLocating(false);
        setLocationStatus(`GPS Detection Error: ${error.message}. You can enter manually.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCreateProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyName.trim()) return;

    if (isLimitReached) {
      if (onUnlockAudit) {
        onUnlockAudit('lifetime_pro');
      }
      return;
    }

    const newProp: PropertyRecord = {
      id: `prop_${Date.now()}`,
      name: propertyName.trim(),
      address: address.trim() || 'Address Not Provided',
      addressType,
      coordinates: coords,
      propertyType,
      facingDegree: facingDeg,
      placedRooms: currentPlacedRooms,
      createdAt: new Date().toLocaleDateString(),
    };

    onSaveProperty(newProp);
    onSelectProperty(newProp.id);
    playTempleBellChime();
    // Reset form
    setPropertyName('');
    setAddress('');
    setAddressType('manual');
    setCoords(undefined);
    setActiveTab('list');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 pb-16 sm:pb-4 font-sans animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] w-full max-w-2xl rounded-3xl border-2 border-[#E8DCC4] shadow-2xl overflow-hidden flex flex-col max-h-[72vh]">
        {/* Modal Header */}
        <div className="bg-[#78350F] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#5C280B]">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-[#D97706]" />
            <div>
              <h3 className="text-base font-serif font-bold leading-tight">Property Manager & Vastu Comparer</h3>
              <p className="text-[10px] text-[#E8DCC4] uppercase tracking-wider">
                Individual address audit pass tracking & GPS comparison
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#5C280B] text-[#E8DCC4] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="bg-[#FCFAF7] border-b border-[#E8DCC4] px-4 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider flex-wrap gap-1">
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'list' ? 'bg-[#78350F] text-white shadow-xs' : 'text-[#8B735B] hover:bg-[#F3EFE0]'
              }`}
            >
              My Properties ({properties.length})
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'add' ? 'bg-[#78350F] text-white shadow-xs' : 'text-[#8B735B] hover:bg-[#F3EFE0]'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-[#D97706]" /> Add New
            </button>
          </div>

          {properties.length > 1 && (
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'compare'
                  ? 'bg-[#D97706] text-white shadow-xs'
                  : 'text-[#D97706] bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FEF3C7]'
              }`}
            >
              <Scale className="w-3.5 h-3.5" /> Compare Houses
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* TAB 1: LIST PROPERTIES */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#78350F] uppercase tracking-wider">
                  Saved Property Audit Records:
                </span>
                <span className="text-[11px] text-[#8B735B]">Click a house to switch active audit</span>
              </div>

              {properties.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-[#E8DCC4] p-6 space-y-3">
                  <Home className="w-8 h-8 text-[#A68A64] mx-auto opacity-50" />
                  <p className="text-xs text-[#8B735B]">No custom properties recorded yet.</p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="px-4 py-2 bg-[#78350F] text-white text-xs font-bold rounded-xl uppercase tracking-wider inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#D97706]" /> Record First House Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {properties.map((prop) => {
                    const report = calculateHouseAudit(prop.placedRooms);
                    const isActive = prop.id === activePropertyId;
                    const isThisPropUnlocked = checkIsUnlocked(prop.id);

                    return (
                      <div
                        key={prop.id}
                        onClick={() => {
                          onSelectProperty(prop.id);
                          playTempleBellChime();
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                          isActive
                            ? 'bg-[#FFFBEB] border-2 border-[#D97706] shadow-md ring-2 ring-[#D97706]/20'
                            : 'bg-white border-[#E8DCC4] hover:border-[#D97706]/60 hover:shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-sm font-serif font-bold text-[#78350F] block">
                                {prop.name}
                              </span>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#F3EFE0] text-[#78350F] inline-block uppercase tracking-wider mt-0.5">
                                {prop.propertyType} • Facing {prop.facingDegree}°
                              </span>
                            </div>

                            {isThisPropUnlocked ? (
                              <span
                                className={`text-xs font-black px-2.5 py-1 rounded-full text-white ${
                                  report.overallScore >= 80
                                    ? 'bg-[#10B981]'
                                    : report.overallScore >= 60
                                    ? 'bg-[#D97706]'
                                    : 'bg-[#991B1B]'
                                }`}
                              >
                                {report.overallScore}% Vastu
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectProperty(prop.id);
                                  if (onUnlockAudit) onUnlockAudit('single_property');
                                }}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-[#F59E0B] bg-[#78350F] hover:bg-[#5C280B] border border-[#D97706]/40 flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="Unlock audit score & remedies for this specific address"
                              >
                                <Lock className="w-3 h-3 text-[#F59E0B]" /> Unlock (₹299)
                              </button>
                            )}
                          </div>

                          <div className="mt-2.5 text-xs text-[#8B735B] flex items-center gap-1.5 bg-[#FAF7F2] p-2 rounded-xl border border-[#E8DCC4]">
                            <MapPin className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                            <span className="truncate">{prop.address}</span>
                            {prop.addressType === 'gps' && (
                              <span className="text-[9px] font-bold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.2 rounded border border-[#D1FAE5] shrink-0">
                                GPS
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] border-t border-[#E8DCC4]/50 pt-2 text-[#8B735B]">
                          <span>
                            {prop.placedRooms.length} Rooms • {report.doshCount} Defects
                          </span>

                          <div className="flex items-center gap-2">
                            {isActive && (
                              <span className="text-[10px] font-bold text-[#D97706] flex items-center gap-1 bg-[#FFFBEB] px-2 py-0.5 rounded-full border border-[#D97706]/30">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Active Audit
                              </span>
                            )}
                            {properties.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteProperty(prop.id);
                                }}
                                className="text-[#A68A64] hover:text-[#991B1B] p-1.5 rounded-lg hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                                title="Delete Property Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADD PROPERTY WITH GPS OR MANUAL ADDRESS */}
          {activeTab === 'add' && (
            isLimitReached ? (
              <div className="bg-[#FFFBEB] p-6 rounded-3xl border-2 border-[#D97706]/40 text-center space-y-4 font-sans animate-in fade-in duration-200">
                <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] flex items-center justify-center mx-auto text-[#D97706] shadow-xs">
                  <Lock className="w-6 h-6 text-[#D97706]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-serif font-bold text-[#78350F]">
                    Address Limit Reached ({properties.length}/{maxAllowedProperties})
                  </h4>
                  <p className="text-xs text-[#8B735B] max-w-md mx-auto leading-relaxed">
                    {hasDemoProperty
                      ? 'Single Pass includes 1 custom property address (+ 1 demo info). You have reached the 2-address limit.'
                      : 'Single Pass is limited to 1 address when demo info is deleted. You currently have 1 property recorded.'}
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-[#E8DCC4] max-w-md mx-auto text-[11px] text-[#78350F] font-medium space-y-1">
                  <p className="font-bold uppercase tracking-wider text-[#D97706]">Upgrade to Pro to unlock:</p>
                  <p>• Unlimited property audit records & GPS comparisons</p>
                  <p>• 16-Zone precision compass overlays & custom remedies</p>
                </div>

                {onUnlockAudit && (
                  <button
                    type="button"
                    onClick={() => {
                      onUnlockAudit('lifetime_pro');
                    }}
                    className="px-6 py-3 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" /> Upgrade to Unlimited Pro Pass
                  </button>
                )}
              </div>
            ) : (
            <form onSubmit={handleCreateProperty} className="space-y-4 font-sans">
              <div className="bg-[#FFFBEB] p-3.5 rounded-2xl border border-[#FEF3C7] text-xs text-[#78350F] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>
                  Record house details & exact geolocation to compare Vastu compliance across multiple flats or properties.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#78350F] uppercase tracking-wider">
                    Property Nickname / Label:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bandra Beach Apartment, Villa #5"
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    className="text-xs font-medium bg-white border border-[#E8DCC4] rounded-xl p-2.5 focus:ring-2 focus:ring-[#D97706] outline-none text-[#3D342D]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#78350F] uppercase tracking-wider">
                    Property Type:
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as any)}
                    className="text-xs font-medium bg-white border border-[#E8DCC4] rounded-xl p-2.5 focus:ring-2 focus:ring-[#D97706] outline-none text-[#3D342D]"
                  >
                    <option value="Flat/Apartment">Flat / Apartment</option>
                    <option value="Independent House">Independent House</option>
                    <option value="Villa">Villa / Bungalow</option>
                    <option value="Commercial Office">Commercial Office / Shop</option>
                    <option value="Plot">Open Plot / Land</option>
                  </select>
                </div>
              </div>

              {/* Address Input Mode (Manual vs Current Location GPS) */}
              <div className="bg-white p-4 rounded-2xl border border-[#E8DCC4] space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8DCC4]/60 pb-2">
                  <label className="text-xs font-bold text-[#78350F] uppercase tracking-wider">
                    Property Address & Location:
                  </label>
                  <div className="flex gap-1.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setAddressType('manual')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        addressType === 'manual'
                          ? 'bg-[#78350F] text-white'
                          : 'bg-[#F3EFE0] text-[#8B735B]'
                      }`}
                    >
                      Manual Entry
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddressType('gps')}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        addressType === 'gps'
                          ? 'bg-[#D97706] text-white'
                          : 'bg-[#F3EFE0] text-[#8B735B]'
                      }`}
                    >
                      <Navigation className="w-3 h-3" /> GPS Geolocation
                    </button>
                  </div>
                </div>

                {addressType === 'gps' && (
                  <div className="bg-[#ECFDF5] p-3 rounded-xl border border-[#D1FAE5] flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#065F46] flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-[#059669] animate-pulse" /> Current Geolocation Mode
                      </span>
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={isLocating}
                        className="px-3 py-1 bg-[#059669] hover:bg-[#047857] text-white text-[11px] font-bold rounded-lg uppercase tracking-wider shadow-2xs cursor-pointer"
                      >
                        {isLocating ? 'Locating...' : 'Detect GPS Now'}
                      </button>
                    </div>

                    {locationStatus && (
                      <p className="text-[11px] text-[#047857] font-medium">{locationStatus}</p>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    required
                    placeholder="Enter full address, area, landmark, or city..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="text-xs font-medium bg-white border border-[#E8DCC4] rounded-xl p-2.5 focus:ring-2 focus:ring-[#D97706] outline-none text-[#3D342D]"
                  />
                </div>
              </div>

              {/* Facing Orientation Angle */}
              <div className="bg-[#F3EFE0]/50 p-3.5 rounded-2xl border border-[#E8DCC4] flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#78350F] uppercase tracking-wider text-[10px]">
                    Main Entrance / House Facing Direction:
                  </span>
                  <span className="font-bold text-[#D97706] font-serif bg-white px-2 py-0.5 rounded border border-[#E8DCC4]">
                    {facingDeg}° Orientation
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="359"
                  value={facingDeg}
                  onChange={(e) => setFacingDeg(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer accent-[#D97706]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="w-1/3 py-2.5 px-4 bg-[#F3EFE0] hover:bg-[#E8DCC4] text-[#78350F] text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 px-4 bg-[#78350F] hover:bg-[#5C280B] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-[#D97706]" /> Save Property Record
                </button>
              </div>
            </form>
          )
        )}

          {/* TAB 3: COMPARE HOUSES VASTU SIDE-BY-SIDE */}
          {activeTab === 'compare' && (
            <div className="space-y-4 font-sans">
              <div className="flex justify-between items-center border-b border-[#E8DCC4] pb-2">
                <span className="text-xs font-bold text-[#78350F] uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-[#D97706]" /> Side-by-Side Vastu Scorecard Comparison
                </span>
                <span className="text-[11px] text-[#8B735B]">Comparing {properties.length} Houses</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {properties.map((prop) => {
                  const report = calculateHouseAudit(prop.placedRooms);
                  const isThisPropUnlocked = checkIsUnlocked(prop.id);

                  return (
                    <div
                      key={prop.id}
                      className="bg-white rounded-2xl border-2 border-[#E8DCC4] p-4 flex flex-col justify-between gap-3 shadow-xs"
                    >
                      <div>
                        <div className="flex items-start justify-between border-b border-[#E8DCC4]/60 pb-2">
                          <div>
                            <h4 className="font-serif font-bold text-base text-[#78350F]">{prop.name}</h4>
                            <p className="text-[10px] text-[#8B735B] flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-[#D97706]" /> {prop.address}
                            </p>
                          </div>
                          {isThisPropUnlocked ? (
                            <span
                              className={`text-sm font-black px-3 py-1 rounded-full text-white ${
                                report.overallScore >= 80
                                  ? 'bg-[#10B981]'
                                  : report.overallScore >= 60
                                  ? 'bg-[#D97706]'
                                  : 'bg-[#991B1B]'
                              }`}
                            >
                              {report.overallScore}%
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full text-[#F59E0B] bg-[#78350F] border border-[#D97706]/40 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-[#F59E0B]" /> Locked
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-3 text-center border-b border-[#E8DCC4]/40 text-xs">
                          <div className="bg-[#ECFDF5] p-2 rounded-xl border border-[#D1FAE5]">
                            <span className="text-[10px] text-[#065F46] uppercase font-bold block">Ideal Rooms</span>
                            <span className="font-bold text-[#059669] text-base">{report.auspiciousCount}</span>
                          </div>
                          <div className="bg-[#FFFBEB] p-2 rounded-xl border border-[#FEF3C7]">
                            <span className="text-[10px] text-[#D97706] uppercase font-bold block">Passable</span>
                            <span className="font-bold text-[#D97706] text-base">{report.passableCount}</span>
                          </div>
                          <div className="bg-[#FEF2F2] p-2 rounded-xl border border-[#FCA5A5]/60">
                            <span className="text-[10px] text-[#991B1B] uppercase font-bold block">Dosh Defects</span>
                            <span className="font-bold text-[#991B1B] text-base">{report.doshCount}</span>
                          </div>
                        </div>

                        <div className="pt-2 text-xs space-y-1 text-[#3D342D]">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-[#8B735B]">Facing Orientation:</span>
                            <span className="font-bold">{prop.facingDegree}° Angle</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-[#8B735B]">Vastu Grade:</span>
                            <span className="font-bold text-[#78350F]">
                              {isThisPropUnlocked ? report.grade : 'Locked'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#8B735B] italic pt-1">{report.summaryText}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onSelectProperty(prop.id);
                          onClose();
                        }}
                        className="w-full py-2 bg-[#78350F] hover:bg-[#5C280B] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-2xs cursor-pointer"
                      >
                        Select & Audit This Property
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

