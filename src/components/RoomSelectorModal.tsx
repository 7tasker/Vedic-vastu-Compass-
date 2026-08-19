import React from 'react';
import { RoomType, VastuZone } from '../types';
import { ROOM_DEFINITIONS } from '../data/vastuData';
import { playTempleBellChime } from '../utils/vastuUtils';
import {
  X,
  Sparkles,
  DoorOpen,
  Flame,
  BedDouble,
  Baby,
  Users,
  Sofa,
  Utensils,
  Bath,
  BookOpen,
  Landmark,
  Layers,
  Droplets,
  Waves,
  Boxes,
  Sun,
} from 'lucide-react';

interface RoomSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoomId: string;
  onSelectRoom: (roomId: string) => void;
  currentZone?: VastuZone;
  effectiveDegree?: number;
  onAddRoomToAudit?: (roomId: string, degree: number) => void;
}

export const getRoomIconComponent = (iconName: string, className: string = 'w-5 h-5') => {
  switch (iconName) {
    case 'DoorOpen':
      return <DoorOpen className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'BedDouble':
      return <BedDouble className={className} />;
    case 'Baby':
      return <Baby className={className} />;
    case 'Users':
      return <Users className={className} />;
    case 'Sofa':
      return <Sofa className={className} />;
    case 'Utensils':
      return <Utensils className={className} />;
    case 'Bath':
      return <Bath className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'Vault':
      return <Landmark className={className} />;
    case 'Layers':
      return <Layers className={className} />;
    case 'Droplet':
      return <Droplets className={className} />;
    case 'Container':
      return <Waves className={className} />;
    case 'Boxes':
      return <Boxes className={className} />;
    case 'Sun':
      return <Sun className={className} />;
    default:
      return <Sparkles className={className} />;
  }
};

export const RoomSelectorModal: React.FC<RoomSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedRoomId,
  onSelectRoom,
}) => {
  if (!isOpen) return null;

  const handleRoomClick = (roomId: string) => {
    onSelectRoom(roomId);
    playTempleBellChime();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-[#FCFAF7] border-2 border-[#D97706]/70 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sacred Header */}
        <div className="bg-[#78350F] text-[#F3EFE0] px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between border-b border-[#5C280B]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D97706] text-white flex items-center justify-center shadow-xs border border-[#FDE68A]/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base font-serif font-bold text-white tracking-wide">
              Select Room
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#5C280B] hover:bg-[#431D08] text-[#F3EFE0] hover:text-white flex items-center justify-center transition-all cursor-pointer border border-[#9A420F]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clean 2-Column Grid of 16 Rooms (2 x 8 = 16) */}
        <div className="p-3.5 sm:p-4 max-h-[75vh] overflow-y-auto custom-gold-scrollbar">
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {ROOM_DEFINITIONS.map((room) => {
              const isSelected = room.id === selectedRoomId;

              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => handleRoomClick(room.id)}
                  className={`p-2.5 sm:p-3 rounded-2xl border-2 transition-all flex items-center gap-2.5 text-left cursor-pointer group ${
                    isSelected
                      ? 'bg-[#FFFBEB] border-[#D97706] shadow-md ring-2 ring-[#D97706]/30'
                      : 'bg-white border-[#E8DCC4] hover:border-[#D97706] hover:bg-[#FFFDF9] shadow-2xs'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${
                      isSelected
                        ? 'bg-[#78350F] text-white border-[#D97706]'
                        : 'bg-[#FFFBEB] text-[#78350F] border-[#FDE68A]'
                    }`}
                  >
                    {getRoomIconComponent(room.iconName, 'w-4 h-4')}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-xs font-serif font-bold truncate block leading-tight ${
                        isSelected ? 'text-[#78350F]' : 'text-[#3D342D]'
                      }`}
                    >
                      {room.label}
                    </span>
                    {room.id === 'entrance' ? (
                      <span className="text-[9.5px] font-sans font-bold text-[#D97706] bg-[#FFFBEB] px-1.5 py-0.5 rounded border border-[#FDE68A] inline-block mt-0.5">
                        Facing Exit
                      </span>
                    ) : room.hindiName ? (
                      <span className="text-[10px] text-[#8B735B] truncate block mt-0.5 opacity-80">
                        {room.hindiName}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
