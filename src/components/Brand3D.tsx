import React from 'react';

export const BrandLogo3D: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ size = 'md' }) => {
  const dims = {
    sm: { container: 'w-10 h-10', icon: 'w-6 h-6', title: 'text-lg', subtitle: 'text-[9px]' },
    md: { container: 'w-14 h-14', icon: 'w-8 h-8', title: 'text-2xl', subtitle: 'text-xs' },
    lg: { container: 'w-20 h-20', icon: 'w-12 h-12', title: 'text-3xl', subtitle: 'text-sm' },
    xl: { container: 'w-24 h-24', icon: 'w-14 h-14', title: 'text-4xl', subtitle: 'text-base' },
  }[size];

  return (
    <div className="flex items-center gap-3 select-none">
      {/* 3D Metallic Badge with Bevel and Inner Glow */}
      <div
        className={`${dims.container} relative flex items-center justify-center rounded-2xl flex-shrink-0`}
        style={{
          background: 'linear-gradient(135deg, #2b0e14 0%, #150609 45%, #080304 100%)',
          border: '1.5px solid rgba(255, 30, 50, 0.45)',
          boxShadow:
            '0 10px 24px -4px rgba(255, 10, 45, 0.4), inset 0 2px 3px rgba(255, 120, 140, 0.35), inset 0 -2px 4px rgba(0, 0, 0, 0.9)',
        }}
      >
        {/* Ambient Neon Red Glow behind badge */}
        <div className="absolute inset-0 rounded-2xl bg-red-600/20 blur-md -z-10" />

        {/* 3D NFC and QR SVG Symbol */}
        <svg
          className={`${dims.icon} text-red-500 drop-shadow-[0_2px_8px_rgba(255,20,50,0.8)]`}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer plate card 3D shape */}
          <rect
            x="6"
            y="6"
            width="36"
            height="36"
            rx="8"
            fill="url(#metalGrad)"
            stroke="url(#rimGrad)"
            strokeWidth="2"
          />
          {/* Inner 3D QR Matrix & NFC wave */}
          <path
            d="M14 14H20V20H14V14ZM16 16V18H18V16H16Z"
            fill="#FF2A4B"
          />
          <path
            d="M28 14H34V20H28V14ZM30 16V18H32V16H30Z"
            fill="#FF2A4B"
          />
          <path
            d="M14 28H20V34H14V28ZM16 30V32H18V30H16Z"
            fill="#FF2A4B"
          />
          {/* NFC Waves radiating */}
          <path
            d="M25 25C26.8 26.5 28 28.5 28 31"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M29 23C31.5 25.2 33 28 33 32"
            stroke="#FF385C"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M33 21C36.2 24 38 27.5 38 33"
            stroke="#FF2A4B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          <defs>
            <linearGradient id="metalGrad" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1E2028" />
              <stop offset="0.5" stopColor="#121318" />
              <stop offset="1" stopColor="#08090C" />
            </linearGradient>
            <linearGradient id="rimGrad" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF4D6D" />
              <stop offset="0.5" stopColor="#A80720" />
              <stop offset="1" stopColor="#4A000A" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div>
        <div className={`font-black tracking-wider uppercase flex items-center gap-1.5 ${dims.title}`}>
          <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">DINÂMICO</span>
          <span className="bg-gradient-to-r from-red-500 via-rose-500 to-red-600 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(255,20,50,0.6)]">
            PRO
          </span>
        </div>
        <p className={`text-zinc-400 font-semibold tracking-widest uppercase ${dims.subtitle}`}>
          Plaquinhas NFC & QR Dinâmicos
        </p>
      </div>
    </div>
  );
};

/**
 * 3D Icon representing stacked NFC plates with QR codes
 */
export const BatchPlates3DIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => {
  return (
    <div
      className="relative flex items-center justify-center p-2 rounded-xl flex-shrink-0"
      style={{
        background: 'linear-gradient(135deg, #2a0b12 0%, #150508 50%, #0c0305 100%)',
        border: '1px solid rgba(255, 40, 60, 0.4)',
        boxShadow: '0 6px 14px rgba(255, 10, 40, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
      }}
    >
      <svg
        className={`${className} text-red-500 drop-shadow-[0_2px_6px_rgba(255,10,40,0.6)]`}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Back Plate in stack */}
        <rect
          x="10"
          y="6"
          width="24"
          height="24"
          rx="5"
          fill="#1C1F28"
          stroke="#47141C"
          strokeWidth="1.5"
          transform="rotate(6 22 18)"
        />
        {/* Middle Plate in stack */}
        <rect
          x="7"
          y="8"
          width="24"
          height="24"
          rx="5"
          fill="#151720"
          stroke="#7F1D2C"
          strokeWidth="1.5"
          transform="rotate(2 19 20)"
        />
        {/* Foreground Plate */}
        <rect
          x="5"
          y="11"
          width="24"
          height="24"
          rx="5"
          fill="#0D0E14"
          stroke="#FF2A4B"
          strokeWidth="1.8"
        />
        {/* QR Code elements on front plate */}
        <rect x="9" y="15" width="4" height="4" fill="#FF4D6D" rx="1" />
        <rect x="21" y="15" width="4" height="4" fill="#FF4D6D" rx="1" />
        <rect x="9" y="27" width="4" height="4" fill="#FF4D6D" rx="1" />
        <circle cx="23" cy="29" r="2.5" fill="#FFFFFF" />
        {/* NFC wave line */}
        <path
          d="M15 22C17 21 19 21 21 22"
          stroke="#FF2A4B"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
