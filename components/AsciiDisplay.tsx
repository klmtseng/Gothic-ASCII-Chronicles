import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface AsciiDisplayProps {
  logs: LogEntry[];
  isTyping: boolean;
}

const AsciiDisplay: React.FC<AsciiDisplayProps> = ({ logs, isTyping }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto w-full max-w-3xl p-4 space-y-6 scrollbar-hide">
        {/* Render History */}
        {logs.map((log, index) => (
            <div key={index} className={`flex flex-col ${log.type === 'player' ? 'items-end' : 'items-start'}`}>
                
                {/* ASCII Art (Only for narrator) */}
                {log.art && (
                    <div className="mb-2 p-2 bg-stone-900 border border-stone-800 rounded shadow-inner inline-block">
                         <pre className="font-mono text-[10px] md:text-xs leading-none text-stone-400 whitespace-pre">
                            {log.art}
                         </pre>
                    </div>
                )}

                {/* Text Content */}
                <div className={`
                    max-w-[90%] md:max-w-[80%] p-3 border-2 
                    ${log.type === 'player' 
                        ? 'bg-stone-800 border-stone-600 text-stone-300 rounded-tl-lg rounded-bl-lg rounded-br-lg' 
                        : 'bg-stone-950 border-stone-800 text-stone-400 rounded-tr-lg rounded-br-lg rounded-bl-lg font-serif tracking-wide'}
                `}>
                    {log.type === 'player' ? (
                        <span className="font-mono text-sm text-amber-500">> {log.text}</span>
                    ) : (
                        <p className="text-sm md:text-base leading-relaxed gothic-text">
                            {log.text}
                        </p>
                    )}
                </div>
            </div>
        ))}

        {/* Loading Indicator */}
        {isTyping && (
             <div className="flex flex-col items-start animate-pulse">
                <div className="bg-stone-950 border border-stone-800 p-3 rounded-lg">
                    <span className="text-stone-500 font-mono text-xs">The DM is thinking...</span>
                </div>
             </div>
        )}

        <div ref={bottomRef} />
    </div>
  );
};

export default AsciiDisplay;