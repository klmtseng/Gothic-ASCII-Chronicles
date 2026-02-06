import React from 'react';
import { Choice } from '../types';

interface MobileControlsProps {
  choices: Choice[];
  onChoose: (action: string) => void;
  disabled: boolean;
  labels: {
    commands: string;
    noActions: string;
  };
}

const MobileControls: React.FC<MobileControlsProps> = ({ choices, onChoose, disabled, labels }) => {
  return (
    <div className="bg-stone-900 p-3 border-t border-stone-800 h-auto shrink-0">
      <div className="text-[10px] text-stone-500 mb-2 uppercase tracking-widest text-center border-b border-stone-800 pb-1">{labels.commands}</div>
      <div className="grid grid-cols-1 gap-2">
        {choices.map((choice, idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => onChoose(choice.action)}
            className={`
                text-left px-3 py-2 border border-stone-700 bg-black text-stone-300
                font-mono text-xs md:text-sm hover:bg-stone-800 hover:text-white hover:border-stone-500
                transition-all disabled:opacity-30 disabled:cursor-not-allowed
                flex items-center group
            `}
          >
            <span className="w-4 text-stone-600 group-hover:text-red-500 transition-colors mr-2">
              {idx + 1}.
            </span>
            {choice.label}
          </button>
        ))}
        {choices.length === 0 && (
           <div className="text-stone-700 text-xs text-center py-2 italic">{labels.noActions}</div>
        )}
      </div>
    </div>
  );
};

export default MobileControls;