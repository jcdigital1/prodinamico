import React from 'react';

export const BrandLogo3D: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ size = 'md' }) => {
  const dims = {
    sm: { container: 'w-10 h-10', icon: 'w-6 h-6', title: 'text-lg', subtitle: 'text-[9px]' },
    md: { container: 'w-13 h-13', icon: 'w-8 h-8', title: 'text-2xl', subtitle: 'text-xs' },
    lg: { container: 'w-20 h-20', icon: 'w-12 h-12', title: 'text-3xl', subtitle: 'text-sm' },
    xl: { container: 'w-24 h-24', icon: 'w-14 h-14', title: 'text-4xl', subtitle: 'text-base' },
  }[size];

  return (
    <div className="flex items-center gap-3.5 select-none">
      {/* 3D Metallic Royal Blue Chip Badge with Glow */}
      <div
        className={`${dims.container} relative flex items-center justify-center rounded-2xl flex-shrink-0`}
        style={{
          background: 'linear-gradient(135deg, #0d1e3d 0%, #081329 45%, #030712 100%)',
          border: '1.5px solid rgba(56, 189, 248, 0.55)',
          boxShadow:
            '0 10px 24px -4px rgba(14, 165, 233, 0.45), inset 0 2px 3px rgba(186, 230, 253, 0.35), inset 0 -2px 4px rgba(0, 0, 0, 0.9)',
        }}
      >
        {/* Ambient Electric Blue Glow */}
        <div className="absolute inset-0 rounded-2xl bg-cyan-500/20 blur-md -z-10" />

        {/* 3D NFC Microchip & QR Code Emblem */}
        <svg
          className={`${dims.icon} text-sky-400 drop-shadow-[0_2px_10px_rgba(56,189,248,0.85)]`}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Microchip body */}
          <rect
            x="7"
            y="7"
            width="34"
            height="34"
            rx="8"
            fill="url(#blueMetal)"
            stroke="url(#blueRim)"
            strokeWidth="2"
          />

          {/* Microchip contact pins (top, bottom, left, right) */}
          <line x1="14" y1="4" x2="14" y2="7" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="24" y1="4" x2="24" y2="7" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="34" y1="4" x2="34" y2="7" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="14" y1="41" x2="14" y2="44" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="24" y1="41" x2="24" y2="44" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="34" y1="41" x2="34" y2="44" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />

          {/* Precision QR Matrix elements in crisp white & electric blue */}
          <rect x="13" y="13" width="7" height="7" rx="1.5" fill="#FFFFFF" />
          <rect x="15" y="15" width="3" height="3" fill="#0284C7" />

          <rect x="28" y="13" width="7" height="7" rx="1.5" fill="#FFFFFF" />
          <rect x="30" y="15" width="3" height="3" fill="#0284C7" />

          <rect x="13" y="28" width="7" height="7" rx="1.5" fill="#FFFFFF" />
          <rect x="15" y="30" width="3" height="3" fill="#0284C7" />

          {/* Concentric NFC wave lines radiating from core */}
          <path
            d="M26 26C27.8 27.5 29 29.5 29 32"
            stroke="#BAE6FD"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M30 24C32.5 26.2 34 29 34 33"
            stroke="#38BDF8"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M34 22C37.2 25 39 28.5 39 34"
            stroke="#0284C7"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          <defs>
            <linearGradient id="blueMetal" x1="7" y1="7" x2="41" y2="41" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1e293b" />
              <stop offset="0.5" stopColor="#0f172a" />
              <stop offset="1" stopColor="#020617" />
            </linearGradient>
            <linearGradient id="blueRim" x1="7" y1="7" x2="41" y2="41" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7dd3fc" />
              <stop offset="0.5" stopColor="#0284c7" />
              <stop offset="1" stopColor="#0369a1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div>
        <div className={`font-black tracking-wider uppercase flex items-center gap-1.5 ${dims.title}`}>
          <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">DINÂMICO</span>
          <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(56,189,248,0.65)]">
            PRO
          </span>
        </div>
        <p className={`text-slate-400 font-semibold tracking-widest uppercase ${dims.subtitle}`}>
          Plaquinhas NFC & QR Dinâmicos
        </p>
      </div>
    </div>
  );
};

/**
 * 3D Icon representing stacked NFC plates with QR codes
 */
export const BatchPlates3DIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => {
  return (
    <div
      className="relative flex items-center justify-center p-2 rounded-xl flex-shrink-0"
      style={{
        background: 'linear-gradient(135deg, #0e1e3b 0%, #081226 50%, #030713 100%)',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        boxShadow: '0 6px 14px rgba(14, 165, 233, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
      }}
    >
      <svg
        className={`${className} text-sky-400 drop-shadow-[0_2px_6px_rgba(56,189,248,0.7)]`}
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
          fill="#0F172A"
          stroke="#1E3A5F"
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
          fill="#0A1124"
          stroke="#0284C7"
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
          fill="#040714"
          stroke="#38BDF8"
          strokeWidth="1.8"
        />
        {/* QR Code elements on front plate */}
        <rect x="9" y="15" width="4" height="4" fill="#38BDF8" rx="1" />
        <rect x="21" y="15" width="4" height="4" fill="#38BDF8" rx="1" />
        <rect x="9" y="27" width="4" height="4" fill="#38BDF8" rx="1" />
        <circle cx="23" cy="29" r="2.5" fill="#FFFFFF" />
        {/* NFC wave line */}
        <path
          d="M15 22C17 21 19 21 21 22"
          stroke="#38BDF8"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
