import React from 'react';

interface LotusRoomBoxBackgroundProps {
  className?: string;
  opacity?: number;
}

export const LotusRoomBoxBackground: React.FC<LotusRoomBoxBackgroundProps> = ({
  className = '',
  opacity = 0.5,
}) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden rounded-2xl transition-opacity duration-300 ${className}`}
      style={{ opacity }}
    >
      <svg
        viewBox="0 0 450 180"
        preserveAspectRatio="none"
        className="w-full h-full select-none"
      >
        <defs>
          {/* Radiant Vedic Amber & Sandalwood Petal Gradient */}
          <linearGradient id="roomLotusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#FDE68A" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0.45" />
          </linearGradient>

          <linearGradient id="cornerLotusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFDF9" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0.8" />
          </linearGradient>

          <filter id="lotusSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#78350F" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Center Synchronized Radiating Lotus Mandala Watermark */}
        <g transform="translate(225, 90)" filter="url(#lotusSoftGlow)" opacity="0.45">
          {/* 8 Radiating Center Petals */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <g key={`center-petal-${deg}`} transform={`rotate(${deg})`}>
              <path
                d="M 0 -20 C -12 -35, -14 -60, 0 -75 C 14 -60, 12 -35, 0 -20 Z"
                fill="url(#roomLotusGrad)"
                stroke="#78350F"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <path
                d="M 0 -22 Q 0 -48 0 -70"
                fill="none"
                stroke="#92400E"
                strokeWidth="0.8"
                opacity="0.6"
              />
            </g>
          ))}

          {/* Central Sacred Concentric Circles */}
          <circle cx="0" cy="0" r="22" fill="#FFFDF9" stroke="#78350F" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="16" fill="none" stroke="#D97706" strokeWidth="1" strokeDasharray="3 2" />
          <circle cx="0" cy="0" r="8" fill="#FDE68A" stroke="#B45309" strokeWidth="1" />
        </g>

        {/* Top-Left Sacred Lotus Corner Ornament */}
        <g transform="translate(18, 18)" filter="url(#lotusSoftGlow)">
          <path
            d="M 0 0 C 14 4, 24 16, 26 30 C 16 28, 4 18, 0 0 Z"
            fill="url(#cornerLotusGrad)"
            stroke="#78350F"
            strokeWidth="1.2"
          />
          <path
            d="M 0 0 C 4 14, 16 24, 30 26 C 28 16, 18 4, 0 0 Z"
            fill="url(#roomLotusGrad)"
            stroke="#78350F"
            strokeWidth="1.2"
          />
          <circle cx="2" cy="2" r="3.5" fill="#D97706" stroke="#78350F" strokeWidth="1" />
        </g>

        {/* Top-Right Sacred Lotus Corner Ornament */}
        <g transform="translate(432, 18) scale(-1, 1)" filter="url(#lotusSoftGlow)">
          <path
            d="M 0 0 C 14 4, 24 16, 26 30 C 16 28, 4 18, 0 0 Z"
            fill="url(#cornerLotusGrad)"
            stroke="#78350F"
            strokeWidth="1.2"
          />
          <path
            d="M 0 0 C 4 14, 16 24, 30 26 C 28 16, 18 4, 0 0 Z"
            fill="url(#roomLotusGrad)"
            stroke="#78350F"
            strokeWidth="1.2"
          />
          <circle cx="2" cy="2" r="3.5" fill="#D97706" stroke="#78350F" strokeWidth="1" />
        </g>

        {/* Bottom-Left Sacred Lotus Corner Ornament */}
        <g transform="translate(18, 162) scale(1, -1)" filter="url(#lotusSoftGlow)">
          <path
            d="M 0 0 C 14 4, 24 16, 26 30 C 16 28, 4 18, 0 0 Z"
            fill="url(#cornerLotusGrad)"
            stroke="#78350F"
            strokeWidth="1.2"
          />
          <path
            d="M 0 0 C 4 14, 16 24, 30 26 C 28 16, 18 4, 0 0 Z"
            fill="url(#roomLotusGrad)"
            stroke="#78350F"
            strokeWidth="1.2"
          />
          <circle cx="2" cy="2" r="3.5" fill="#D97706" stroke="#78350F" strokeWidth="1" />
        </g>

        {/* Bottom-Right Sacred Lotus Corner Ornament */}
        <g transform="translate(432, 162) scale(-1, -1)" filter="url(#lotusSoftGlow)">
          <path
            d="M 0 0 C 14 4, 24 16, 26 30 C 16 28, 4 18, 0 0 Z"
            fill="url(#cornerLotusGrad)"
            stroke="#78350F"
            strokeWidth="1.2"
          />
          <path
            d="M 0 0 C 4 14, 16 24, 30 26 C 28 16, 18 4, 0 0 Z"
            fill="url(#roomLotusGrad)"
            stroke="#78350F"
            strokeWidth="1.2"
          />
          <circle cx="2" cy="2" r="3.5" fill="#D97706" stroke="#78350F" strokeWidth="1" />
        </g>

        {/* Decorative Golden Border Trim Accent Lines */}
        <line x1="45" y1="8" x2="405" y2="8" stroke="#D97706" strokeWidth="1" strokeDasharray="6 4" opacity="0.4" />
        <line x1="45" y1="172" x2="405" y2="172" stroke="#D97706" strokeWidth="1" strokeDasharray="6 4" opacity="0.4" />
      </svg>
    </div>
  );
};
