import React from 'react';

interface RangoliCompassBackgroundProps {
  className?: string;
  opacity?: number;
}

export const RangoliCompassBackground: React.FC<RangoliCompassBackgroundProps> = ({
  className = '',
  opacity = 0.55,
}) => {
  // 16 petals for the layers (aligned with the 16 Vastu directions every 22.5°)
  const petalCount16 = 16;
  const angles16 = Array.from({ length: petalCount16 }, (_, i) => i * 22.5);
  const angles16Staggered = Array.from({ length: petalCount16 }, (_, i) => i * 22.5 + 11.25);

  return (
    <div
      className={`absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-300 ${className}`}
      style={{ opacity }}
    >
      <svg
        viewBox="0 0 600 600"
        className="w-[440px] h-[440px] sm:w-[500px] sm:h-[500px] max-w-none max-h-none select-none overflow-visible"
      >
        <defs>
          {/* Soft drop shadow for clean Vedic mandala depth */}
          <filter id="lotusOutlineGlow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#78350F" floodOpacity="0.2" />
          </filter>

          {/* Middle Layer: Radiant Vedic Amber & Sandalwood Petals */}
          <linearGradient id="lotusMidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#FDE68A" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.6" />
          </linearGradient>

          {/* Inner Layer: Pure Sacred Ivory Petals */}
          <linearGradient id="lotusInnerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
            <stop offset="80%" stopColor="#FFFDF9" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        <g transform="translate(300, 300)" filter="url(#lotusOutlineGlow)">
          {/* STAGE 2: MIDDLE 16-PETAL LOTUS (Interlocking Petal Layer) */}
          {angles16.map((angle) => (
            <g key={`mid-${angle}`} transform={`rotate(${angle})`}>
              <path
                d="M 0 -92 C -28 -112, -32 -162, 0 -188 C 32 -162, 28 -112, 0 -92 Z"
                fill="url(#lotusMidGrad)"
                stroke="#78350F"
                strokeWidth="2.2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <path
                d="M 0 -96 Q 0 -138 0 -180"
                fill="none"
                stroke="#92400E"
                strokeWidth="1"
                opacity="0.5"
              />
            </g>
          ))}

          {/* STAGE 1: INNER 16-PETAL LOTUS (Concentric Base) */}
          {angles16Staggered.map((angle) => (
            <g key={`inner-${angle}`} transform={`rotate(${angle})`}>
              <path
                d="M 0 -56 C -20 -70, -22 -108, 0 -126 C 22 -108, 20 -70, 0 -56 Z"
                fill="url(#lotusInnerGrad)"
                stroke="#78350F"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>
          ))}

          {/* Concentric Decorative Rings */}
          <circle
            cx="0"
            cy="0"
            r="56"
            fill="#FFFDF9"
            stroke="#78350F"
            strokeWidth="2.5"
          />

          <circle
            cx="0"
            cy="0"
            r="48"
            fill="none"
            stroke="#D97706"
            strokeWidth="1.2"
            strokeDasharray="4 3"
            opacity="0.75"
          />

          {/* Center Sacred Bindu */}
          <circle cx="0" cy="0" r="7" fill="#78350F" />
          <circle cx="0" cy="0" r="2.5" fill="#FFFDF9" />
        </g>
      </svg>
    </div>
  );
};
