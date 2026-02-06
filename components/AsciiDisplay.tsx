import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface AsciiDisplayProps {
  logs: LogEntry[];
  isTyping: boolean;
  typingLabel: string;
}

const AsciiDisplay: React.FC<AsciiDisplayProps> = ({ logs, isTyping, typingLabel }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black font-mono text-sm leading-relaxed scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-stone-900 border-b-2 border-stone-800">
        {/* Render History */}
        {logs.map((log, index) => (
            <div key={index} className={`animate-fade-in ${log.type === 'player' ? 'text-right' : 'text-left'}`}>
                {log.type === 'player' ? (
                    <div className="inline-block bg-stone-900/50 px-2 py-1 border-b border-stone-700 text-amber-600 font-bold mb-2">
                        {"> "}{log.text}
                    </div>
                ) : (
                    <div className="text-stone-400 font-serif tracking-wide border-l-2 border-stone-800 pl-3">
                        {log.text}
                    </div>
                )}
            </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
             <div className="text-stone-600 text-xs animate-pulse italic">
                {typingLabel}
             </div>
        )}

        <div ref={bottomRef} />
    </div>
  );
};

export default AsciiDisplay;