import React from 'react';

export function LotusIcon({ className = "w-6 h-6", color = "currentColor" }) {
  return (
    <svg 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      aria-hidden="true"
    >
      {/* Lotus central petal */}
      <path 
        d="M32 8C32 8 26 22 26 34C26 41 29 46 32 46C35 46 38 41 38 34C38 22 32 8 32 8Z" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Left inner petal */}
      <path 
        d="M26 22C26 22 17 28 17 38C17 44 22 47 27 47C28.5 47 30 46 31 45" 
        stroke={color} 
        strokeWidth="1.8" 
        strokeLinecap="round" 
      />
      {/* Right inner petal */}
      <path 
        d="M38 22C38 22 47 28 47 38C47 44 42 47 37 47C35.5 47 34 46 33 45" 
        stroke={color} 
        strokeWidth="1.8" 
        strokeLinecap="round" 
      />
      {/* Left outer petal */}
      <path 
        d="M17 32C17 32 8 37 8 45C8 50 14 53 22 51C25 50 28 48 30 46" 
        stroke={color} 
        strokeWidth="1.6" 
        strokeLinecap="round" 
      />
      {/* Right outer petal */}
      <path 
        d="M47 32C47 32 56 37 56 45C56 50 50 53 42 51C39 50 36 48 34 46" 
        stroke={color} 
        strokeWidth="1.6" 
        strokeLinecap="round" 
      />
      {/* Lotus base pedestal */}
      <path 
        d="M22 54C26 56 38 56 42 54" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      {/* Lotus jewel seed */}
      <circle cx="32" cy="38" r="2" fill={color} />
    </svg>
  );
}

export function GoldDivider({ className = "my-6", label = "" }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <span className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent via-brand-gold-400/60 to-brand-gold-400"></span>
      <div className="flex items-center gap-1.5 text-brand-gold-400">
        <span className="w-1.5 h-1.5 rotate-45 border border-brand-gold-400"></span>
        <LotusIcon className="w-5 h-5 text-brand-gold-400" />
        <span className="w-1.5 h-1.5 rotate-45 border border-brand-gold-400"></span>
      </div>
      <span className="h-[1px] w-12 sm:w-20 bg-gradient-to-l from-transparent via-brand-gold-400/60 to-brand-gold-400"></span>
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}
