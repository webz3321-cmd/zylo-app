import React from 'react';

export function ZyloLogo({ className = "h-12 text-black" }: { className?: string }) {
  return (
    <div className={`flex items-center select-none ${className}`}>
      <svg viewBox="0 0 280 84" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-auto">
        {/* ZYLO main text */}
        <text
          x="140"
          y="54"
          fill="currentColor"
          fontSize="56"
          fontWeight="900"
          fontFamily="'Space Grotesk', 'Inter', system-ui, -apple-system, sans-serif"
          letterSpacing="0.04em"
          fontStyle="italic"
          textAnchor="middle"
          className="select-none"
        >
          ZYLO
        </text>
        {/* Elevate Every Day subtitle */}
        <text
          x="140"
          y="76"
          fill="currentColor"
          fontSize="11.5"
          fontWeight="600"
          fontFamily="'Inter', system-ui, -apple-system, sans-serif"
          letterSpacing="0.18em"
          textAnchor="middle"
          className="select-none text-neutral-800"
        >
          Elevate Every Day.
        </text>
      </svg>
    </div>
  );
}
