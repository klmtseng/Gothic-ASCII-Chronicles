import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GamePhase, GameMessage, MessageType } from './types';
import { LEVEL } from './constants';
import { GameEngine } from './engine/GameEngine';
import HUD from './components/HUD';
import MenuScreen from './components/MenuScreen';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [phase, setPhase] = useState<GamePhase>(GamePhase.MENU);
  const [health, setHealth] = useState(100);
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [damageAlpha, setDamageAlpha] = useState(0);
  const [horrorDistort, setHorrorDistort] = useState(0);
  const [pointerLocked, setPointerLocked] = useState(false);

  const addMessage = useCallback((text: string, type: MessageType, duration = 4000) => {
    setMessages(prev => [...prev.slice(-10), { text, type, timestamp: Date.now(), duration }]);
  }, []);

  const handleStart = useCallback(() => {
    setPhase(GamePhase.PLAYING);
    setHealth(100);
    setMessages([]);
    setInteractPrompt(null);
    setDamageAlpha(0);
    setHorrorDistort(0);

    // Destroy previous engine
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }

    const canvas = canvasRef.current!;
    const engine = new GameEngine(canvas, {
      onHealthChange: (hp) => setHealth(hp),
      onMessage: (text, type, duration) => addMessage(text, type, duration),
      onItemPickup: () => {},
      onDeath: () => setPhase(GamePhase.DEAD),
      onEscape: () => setPhase(GamePhase.ESCAPED),
      onInteractableChange: (prompt) => setInteractPrompt(prompt),
    });

    engine.init(LEVEL);
    engine.start();
    engineRef.current = engine;
  }, [addMessage]);

  // HUD animation loop for reading engine visual state
  useEffect(() => {
    if (phase !== GamePhase.PLAYING) return;

    let raf: number;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const engine = engineRef.current;
      if (!engine) return;
      setDamageAlpha(engine.getDamageOverlayAlpha());
      setHorrorDistort(engine.getHorrorDistort());
      setPointerLocked(engine.isPointerLocked());
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Stop engine when leaving PLAYING phase
  useEffect(() => {
    if (phase !== GamePhase.PLAYING && engineRef.current) {
      engineRef.current.stop();
    }
  }, [phase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: phase === GamePhase.PLAYING && !pointerLocked ? 'pointer' : 'none' }}
      />

      {phase === GamePhase.PLAYING && (
        <HUD
          health={health}
          messages={messages}
          interactPrompt={interactPrompt}
          damageAlpha={damageAlpha}
          horrorDistort={horrorDistort}
          showPointerPrompt={!pointerLocked}
        />
      )}

      <MenuScreen phase={phase} onStart={handleStart} />
    </div>
  );
};

export default App;
