import React from 'react';
import { Choice } from '../types';

interface MobileControlsProps {
  choices: Choice[];
  onChoose: (action: string) => void;
  disabled: boolean;
}

const MobileControls: React.FC<MobileControlsProps> = ({ choices, onChoose, disabled }) => {
  if (choices.length === 0) return null;

  return (
    <div className="w-full max-w-3xl bg-stone-900 border-t-2 border-stone-700 p-4 z-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {choices.map((choice, idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => onChoose(choice.action)}
            className={`
                relative py-3 px-2 border border-stone-600 bg-stone-950 text-stone-300
                font-mono text-sm uppercase tracking-wider
                hover:bg-red-900/30 hover:border-red-500 transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                group
            `}
          >
            {/* Hover Indicator */}
            <span className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-500">†</span>
            <span className="z-10 relative">{choice.label}</span>
          </button>
        ))}
      </div>
      
      {/* Custom input line for future expansion or "feel" */}
      <div className="mt-2 text-center">
        <span className="text-[10px] text-stone-600 font-mono">CHOOSE THY FATE</span>
      </div>
    </div>
  );
};

export default MobileControls;