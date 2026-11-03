import React from 'react';
import { Zap, Volume2, Radio } from 'lucide-react';

interface SwiftFloatingDockProps {
  onClick: () => void;
  isOpen: boolean;
}

export const SwiftFloatingDock: React.FC<SwiftFloatingDockProps> = ({
  onClick,
  isOpen,
}) => {
  if (isOpen) return null;

  return (
    <div className="fixed right-5 bottom-6 z-40 group">
      <button
        onClick={onClick}
        className="relative flex items-center gap-3 p-2.5 pr-4 rounded-2xl bg-[#090E1B] border-2 border-cyan-400/60 text-white shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] hover:border-cyan-300 transition-all duration-300 active:scale-95 group"
        aria-label="Open Swift AI Assistant Cockpit"
      >
        {/* Glowing holographic pulse ring */}
        <span className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 opacity-40 blur-xs group-hover:opacity-75 transition-opacity" />

        {/* Hologram Car Icon Container */}
        <div className="relative w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400/80 flex items-center justify-center text-cyan-300 shadow-[inset_0_0_10px_rgba(6,182,212,0.5)]">
          {/* Stylized sports car SVG glyph */}
          <svg
            className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.1 2 11.6 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <circle cx="17" cy="17" r="2" />
            <path d="M5 17h2m6 0h2" />
          </svg>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
        </div>

        {/* Label & Details */}
        <div className="relative text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black tracking-wider text-white font-display uppercase">
              SWIFT AI
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40">
              HUD
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-300/80 block">
            Voice AI · Hindi / English
          </span>
        </div>
      </button>
    </div>
  );
};
