import React, { useState, useRef, useEffect } from 'react';

interface MobileControlsProps {
  onInput: (key: string, pressed: boolean) => void;
}

const MobileControls: React.FC<MobileControlsProps> = ({ onInput }) => {
  // Joystick State
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const activeKeys = useRef<Set<string>>(new Set());

  // Helper to trigger input changes only when state changes
  const updateKey = (key: string, pressed: boolean) => {
    if (pressed) {
      if (!activeKeys.current.has(key)) {
        activeKeys.current.add(key);
        onInput(key, true);
      }
    } else {
      if (activeKeys.current.has(key)) {
        activeKeys.current.delete(key);
        onInput(key, false);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!joystickRef.current) return;
    
    const touch = e.touches[0];
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate delta
    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    
    // Clamp magnitude (Square clamp for Gothic feel?) No, keep circle for feel but square visual.
    const maxDist = 40;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > maxDist) {
      const ratio = maxDist / dist;
      dx *= ratio;
      dy *= ratio;
    }
    
    setJoystickPos({ x: dx, y: dy });
    
    // Deadzone processing
    const threshold = 15;
    updateKey('ArrowRight', dx > threshold);
    updateKey('ArrowLeft', dx < -threshold);
    updateKey('ArrowUp', dy < -threshold * 1.5);
    updateKey('ArrowDown', dy > threshold);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setJoystickPos({ x: 0, y: 0 });
    updateKey('ArrowRight', false);
    updateKey('ArrowLeft', false);
    updateKey('ArrowUp', false);
    updateKey('ArrowDown', false);
  };

  const handleBtn = (key: string, pressed: boolean) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onInput(key, pressed);
  };

  // Reusable Gothic Button Component
  const GothicButton = ({ 
    symbol, 
    onStart, 
    onEnd, 
    className 
  }: { symbol: string, onStart: any, onEnd: any, className?: string }) => (
    <div 
      className={`absolute w-14 h-14 bg-stone-900 border-2 border-stone-600 active:border-red-800 active:bg-stone-800 transition-all flex items-center justify-center shadow-lg ${className}`}
      onTouchStart={onStart}
      onTouchEnd={onEnd}
      onMouseDown={onStart}
      onMouseUp={onEnd}
      onMouseLeave={onEnd}
    >
      <div className="text-2xl text-stone-300 font-serif font-bold pointer-events-none select-none drop-shadow-md">
        {symbol}
      </div>
      {/* Corner accents */}
      <div className="absolute top-0 left-0 text-[0.6rem] leading-none text-stone-700">╔</div>
      <div className="absolute top-0 right-0 text-[0.6rem] leading-none text-stone-700">╗</div>
      <div className="absolute bottom-0 left-0 text-[0.6rem] leading-none text-stone-700">╚</div>
      <div className="absolute bottom-0 right-0 text-[0.6rem] leading-none text-stone-700">╝</div>
    </div>
  );

  return (
    <div className="fixed bottom-6 left-0 right-0 h-48 px-6 flex justify-between items-end select-none pointer-events-none z-50 md:hidden">
      
      {/* Gothic Joystick */}
      <div 
        ref={joystickRef}
        className="w-32 h-32 border-2 border-stone-700 bg-stone-950/80 pointer-events-auto relative flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] rotate-45 mb-4 ml-2"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Stick */}
        <div 
          className="w-10 h-10 border border-stone-400 bg-stone-800 absolute transition-transform duration-75 flex items-center justify-center"
          style={{ transform: `translate(${joystickPos.x}px, ${joystickPos.y}px) rotate(-45deg)` }}
        >
          <div className="w-6 h-6 border border-stone-600 bg-stone-900"></div>
        </div>
        
        {/* Decor */}
        <div className="absolute inset-0 pointer-events-none border border-stone-800 m-1"></div>
      </div>

      {/* Action Buttons (Human Cross) */}
      <div className="pointer-events-auto relative w-44 h-44 mb-2">
        
        {/* Head (*) - Jump */}
        <GothicButton 
          symbol="*" 
          className="top-0 left-1/2 -translate-x-1/2"
          onStart={handleBtn('ArrowUp', true)}
          onEnd={handleBtn('ArrowUp', false)}
        />

        {/* Left Arm (-) - Action 1 */}
        <GothicButton 
          symbol="-" 
          className="top-1/2 left-0 -translate-y-1/2"
          onStart={handleBtn('z', true)}
          onEnd={handleBtn('z', false)}
        />

        {/* Right Arm (+) - Action 2 */}
        <GothicButton 
          symbol="+" 
          className="top-1/2 right-0 -translate-y-1/2"
          onStart={handleBtn('x', true)}
          onEnd={handleBtn('x', false)}
        />

        {/* Legs (/) - Down */}
        <GothicButton 
          symbol="/" 
          className="bottom-0 left-1/2 -translate-x-1/2"
          onStart={handleBtn('ArrowDown', true)}
          onEnd={handleBtn('ArrowDown', false)}
        />

        {/* Center Connection Lines */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 pointer-events-none opacity-20 flex items-center justify-center">
            <div className="w-[1px] h-full bg-stone-500 absolute"></div>
            <div className="h-[1px] w-full bg-stone-500 absolute"></div>
        </div>
      </div>
    </div>
  );
};

export default MobileControls;