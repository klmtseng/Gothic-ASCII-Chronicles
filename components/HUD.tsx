import React from 'react';
import { GameMessage } from '../types';

interface HUDProps {
  health: number;
  messages: GameMessage[];
  interactPrompt: string | null;
  damageAlpha: number;
  horrorDistort: number;
  showPointerPrompt: boolean;
}

const HUD: React.FC<HUDProps> = ({ health, messages, interactPrompt, damageAlpha, horrorDistort, showPointerPrompt }) => {
  const now = Date.now();
  const visibleMessages = messages.filter(m => now - m.timestamp < m.duration);

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-1 h-1 bg-white/40 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 border border-white/20 rounded-full" />
      </div>

      {/* Health bar */}
      <div className="absolute bottom-6 left-6 w-48">
        <div className="text-[10px] text-stone-500 uppercase tracking-widest mb-1 gothic-text">Health</div>
        <div className="h-2 bg-stone-900 border border-stone-700">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${health}%`,
              backgroundColor: health > 60 ? '#666' : health > 30 ? '#a85' : '#c22',
            }}
          />
        </div>
        <div className={`text-xs mt-1 font-mono ${health <= 30 ? 'text-red-500 animate-pulse' : 'text-stone-500'}`}>
          {health} / 100
        </div>
      </div>

      {/* Messages */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[90%] max-w-xl flex flex-col items-center gap-2">
        {visibleMessages.slice(-3).map((msg, i) => {
          const age = now - msg.timestamp;
          const fadeOut = Math.max(0, 1 - age / msg.duration);
          const typeStyles: Record<string, string> = {
            info: 'text-stone-400 border-stone-600',
            warning: 'text-red-400 border-red-900',
            horror: 'text-purple-300 border-purple-900 italic',
            pickup: 'text-amber-400 border-amber-900',
            story: 'text-stone-300 border-stone-500',
          };
          return (
            <div
              key={msg.timestamp + i}
              className={`px-4 py-2 bg-black/80 border text-sm text-center font-serif ${typeStyles[msg.type] || typeStyles.info}`}
              style={{ opacity: fadeOut }}
            >
              {msg.text}
            </div>
          );
        })}
      </div>

      {/* Interaction prompt */}
      {interactPrompt && (
        <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 border border-stone-600 text-stone-300 text-sm font-mono">
          {interactPrompt}
        </div>
      )}

      {/* Click to play prompt */}
      {showPointerPrompt && (
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/80 border border-stone-500 text-stone-400 text-sm font-mono animate-pulse">
          Click to look around
        </div>
      )}

      {/* Damage overlay */}
      {damageAlpha > 0 && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: `rgba(180, 0, 0, ${damageAlpha * 0.4})`,
            boxShadow: `inset 0 0 100px rgba(180, 0, 0, ${damageAlpha * 0.6})`,
          }}
        />
      )}

      {/* Horror distortion overlay */}
      {horrorDistort > 0 && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: `rgba(60, 0, 80, ${horrorDistort * 0.15})`,
            boxShadow: `inset 0 0 150px rgba(60, 0, 80, ${horrorDistort * 0.3})`,
          }}
        />
      )}

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* Controls hint */}
      <div className="absolute bottom-6 right-6 text-[10px] text-stone-700 font-mono text-right leading-relaxed">
        WASD - Move<br />
        MOUSE - Look<br />
        SHIFT - Sprint<br />
        E - Interact<br />
        ESC - Release cursor
      </div>
    </div>
  );
};

export default HUD;
