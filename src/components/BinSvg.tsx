import React from 'react';
import type { LedStatus, LidStatus } from '../types/bin';

interface BinSvgProps {
  fillLevel: number;
  ledStatus: LedStatus;
  lidStatus: LidStatus;
  className?: string;
}

export const BinSvg: React.FC<BinSvgProps> = ({
  fillLevel,
  ledStatus,
  lidStatus,
  className = 'w-44 h-56',
}) => {
  // Clamp fill level between 0 and 100
  const clampedFill = Math.max(0, Math.min(100, fillLevel));

  // Geometry dimensions
  const binTopY = 55;
  const binBottomY = 175;
  const totalHeight = binBottomY - binTopY; // 120px
  const fillHeight = (clampedFill / 100) * totalHeight;
  const fillTopY = binBottomY - fillHeight;

  // Gradients and glow configs based on LED status
  const theme = {
    green: {
      gradientStart: '#10b981',
      gradientEnd: '#047857',
      glow: 'rgba(16, 185, 129, 0.4)',
      accentBorder: '#34d399',
      bgInner: '#064e3b',
    },
    yellow: {
      gradientStart: '#fbbf24',
      gradientEnd: '#d97706',
      glow: 'rgba(245, 158, 11, 0.4)',
      accentBorder: '#fde047',
      bgInner: '#78350f',
    },
    red: {
      gradientStart: '#f87171',
      gradientEnd: '#dc2626',
      glow: 'rgba(239, 68, 68, 0.5)',
      accentBorder: '#fca5a5',
      bgInner: '#7f1d1d',
    },
  }[ledStatus];

  const uniqueId = `bin-${ledStatus}-${Math.round(fillLevel * 10)}`;

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 160 200"
        className="w-full h-full drop-shadow-lg transition-all duration-500 overflow-visible"
      >
        <defs>
          {/* Linear gradient for waste fill */}
          <linearGradient id={`wasteGrad-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={theme.gradientStart} />
            <stop offset="100%" stopColor={theme.gradientEnd} />
          </linearGradient>

          {/* Clip path for the interior bin body */}
          <clipPath id={`binClip-${uniqueId}`}>
            <path d="M 32 55 L 42 175 C 43 182, 117 182, 118 175 L 128 55 Z" />
          </clipPath>

          {/* Subtle glow filter */}
          <filter id={`glow-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={theme.glow} />
          </filter>
        </defs>

        {/* Outer Shadow Base */}
        <ellipse cx="80" cy="188" rx="46" ry="6" fill="#090d16" opacity="0.6" />

        {/* Bin Interior Background (Empty State Chamber) */}
        <path
          d="M 32 55 L 42 175 C 43 182, 117 182, 118 175 L 128 55 Z"
          fill="#1e293b"
          stroke="#334155"
          strokeWidth="2"
        />

        {/* Waste Level Fill (Clipped to Canister Interior) */}
        <g clipPath={`url(#binClip-${uniqueId})`}>
          {clampedFill > 0 && (
            <>
              {/* Liquid fill block */}
              <rect
                x="20"
                y={fillTopY}
                width="120"
                height={fillHeight + 10}
                fill={`url(#wasteGrad-${uniqueId})`}
                className="transition-all duration-700 ease-out"
              />

              {/* Surface highlight wave / line */}
              <line
                x1="25"
                y1={fillTopY}
                x2="135"
                y2={fillTopY}
                stroke={theme.accentBorder}
                strokeWidth="3"
                opacity="0.8"
                className="transition-all duration-700 ease-out"
              />
            </>
          )}

          {/* Measurement Grid ticks inside bin */}
          <line x1="38" y1="91" x2="48" y2="91" stroke="#64748b" strokeWidth="1.5" opacity="0.4" />
          <line x1="112" y1="91" x2="122" y2="91" stroke="#64748b" strokeWidth="1.5" opacity="0.4" />
          <line x1="41" y1="131" x2="50" y2="131" stroke="#64748b" strokeWidth="1.5" opacity="0.4" />
          <line x1="110" y1="131" x2="119" y2="131" stroke="#64748b" strokeWidth="1.5" opacity="0.4" />
        </g>

        {/* Bin Outer Translucent Border & Rim */}
        <path
          d="M 32 55 L 42 175 C 43 182, 117 182, 118 175 L 128 55 Z"
          fill="none"
          stroke={theme.accentBorder}
          strokeWidth="2.5"
          filter={`url(#glow-${uniqueId})`}
          className="transition-all duration-500"
        />

        {/* Front Canister Rim Rim Band */}
        <rect
          x="28"
          y="50"
          width="104"
          height="7"
          rx="3"
          fill="#334155"
          stroke="#475569"
          strokeWidth="1.5"
        />

        {/* Bottom Reinforcement Ridge */}
        <path
          d="M 40 162 L 120 162"
          stroke="#475569"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Center Percentage Display within Bin SVG */}
        <g transform="translate(80, 118)">
          <rect
            x="-32"
            y="-17"
            width="64"
            height="30"
            rx="15"
            fill="#090d16"
            fillOpacity="0.85"
            stroke={theme.accentBorder}
            strokeWidth="1.5"
          />
          <text
            x="0"
            y="5"
            textAnchor="middle"
            fill="#f8fafc"
            fontSize="18"
            fontWeight="bold"
            fontFamily="Inter, Prompt, sans-serif"
          >
            {clampedFill}%
          </text>
        </g>

        {/* Dynamic Lid */}
        {lidStatus === 'open' ? (
          // Lid Tilted Up (Open state)
          <g
            transform="rotate(-38 28 50)"
            className="transition-transform duration-500 ease-out origin-[28px_50px]"
          >
            {/* Lid Dome */}
            <path
              d="M 24 49 C 24 38, 136 38, 136 49 Z"
              fill="#475569"
              stroke="#64748b"
              strokeWidth="2"
            />
            {/* Lid Handle */}
            <path
              d="M 68 38 C 68 30, 92 30, 92 38"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </g>
        ) : (
          // Lid Closed Flush
          <g className="transition-transform duration-500 ease-out">
            {/* Lid Dome */}
            <path
              d="M 26 49 C 26 38, 134 38, 134 49 Z"
              fill="#334155"
              stroke="#64748b"
              strokeWidth="2"
            />
            {/* Lid Handle */}
            <path
              d="M 70 38 C 70 30, 90 30, 90 38"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Small Sensor Lens / ESP32 Module on Top Lid */}
        <circle cx="80" cy={lidStatus === 'open' ? '30' : '43'} r="2.5" fill={theme.gradientStart} />
      </svg>
    </div>
  );
};
