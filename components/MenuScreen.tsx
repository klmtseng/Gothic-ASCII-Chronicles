import React from 'react';
import { GamePhase } from '../types';

interface MenuScreenProps {
  phase: GamePhase;
  onStart: () => void;
}

const MenuScreen: React.FC<MenuScreenProps> = ({ phase, onStart }) => {
  if (phase === GamePhase.PLAYING) return null;

  const isMenu = phase === GamePhase.MENU;
  const isDead = phase === GamePhase.DEAD;
  const isEscaped = phase === GamePhase.ESCAPED;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
      }} />

      {isMenu && (
        <>
          {/* Title */}
          <div className="relative mb-2">
            <h1 className="text-5xl md:text-7xl gothic-text text-stone-300 tracking-[0.15em] drop-shadow-lg">
              GOTHIC
            </h1>
          </div>
          <h2 className="text-lg md:text-2xl gothic-text text-stone-500 tracking-[0.3em] mb-2">
            CHRONICLES
          </h2>
          <div className="w-32 h-[1px] bg-stone-700 mb-6" />
          <p className="text-stone-600 text-sm font-serif italic mb-8 max-w-md text-center leading-relaxed">
            You awaken in a sealed crypt beneath an ancient cathedral.
            <br />
            Find the key. Open the door. Escape before they find you.
          </p>

          <button
            onClick={onStart}
            className="px-10 py-3 bg-transparent border-2 border-stone-700 text-stone-400 hover:text-red-400 hover:border-red-900 hover:bg-red-950/20 transition-all duration-300 uppercase tracking-[0.3em] font-mono text-sm"
          >
            Enter
          </button>

          <div className="mt-12 text-[10px] text-stone-800 font-mono text-center leading-relaxed">
            WASD to move &middot; Mouse to look &middot; SHIFT to sprint &middot; E to interact
          </div>
        </>
      )}

      {isDead && (
        <>
          <h1 className="text-6xl md:text-8xl gothic-text text-red-800 mb-4 animate-pulse">
            DEAD
          </h1>
          <div className="w-24 h-[1px] bg-red-900 mb-4" />
          <p className="text-stone-600 text-sm font-serif italic mb-8">
            The darkness claims another soul.
          </p>
          <button
            onClick={onStart}
            className="px-8 py-3 border border-stone-700 text-stone-500 hover:text-stone-300 hover:border-stone-500 transition-all uppercase tracking-widest font-mono text-sm"
          >
            Try Again
          </button>
        </>
      )}

      {isEscaped && (
        <>
          <h1 className="text-5xl md:text-7xl gothic-text text-stone-200 mb-4">
            ESCAPED
          </h1>
          <div className="w-24 h-[1px] bg-stone-500 mb-4" />
          <p className="text-stone-400 text-sm font-serif italic mb-4 max-w-md text-center leading-relaxed">
            You stumble into the cold night air. The cathedral looms behind you,
            its spires clawing at the moonless sky. You are free. But the whispers
            still echo in your mind.
          </p>
          <p className="text-stone-600 text-xs font-serif italic mb-8">
            They will never truly stop.
          </p>
          <button
            onClick={onStart}
            className="px-8 py-3 border border-stone-700 text-stone-500 hover:text-stone-300 hover:border-stone-500 transition-all uppercase tracking-widest font-mono text-sm"
          >
            Descend Again
          </button>
        </>
      )}
    </div>
  );
};

export default MenuScreen;
