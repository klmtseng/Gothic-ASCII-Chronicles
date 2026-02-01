import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, LevelData, PlayerState, EntityType } from './types';
import { DEFAULT_LEVEL, GRAVITY, MOVE_SPEED, JUMP_FORCE, FRICTION, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, MAX_SPEED, ASCII_TITLE } from './constants';
import AsciiDisplay from './components/AsciiDisplay';
import MobileControls from './components/MobileControls';
import { generateLevel } from './services/geminiService';

const App: React.FC = () => {
  // Game State
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [levelData, setLevelData] = useState<LevelData>(DEFAULT_LEVEL);
  const [userInputTheme, setUserInputTheme] = useState("");
  const [isMobile, setIsMobile] = useState(true);
  
  // Mutable Player Ref for high-frequency physics
  const playerRef = useRef<PlayerState>({
    pos: { x: 2, y: 2 },
    velocity: { x: 0, y: 0 },
    isGrounded: false,
    health: 3,
    score: 0,
    facingRight: true,
  });

  const [renderTrigger, setRenderTrigger] = useState(0); 
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Device Detection
  useEffect(() => {
    const checkDevice = () => {
      // Check for touch capability and screen width
      // Standard heuristic: If it has coarse pointer (touch) OR is small screen (< 1024px)
      const hasTouch = window.matchMedia("(pointer: coarse)").matches || 'ontouchstart' in window;
      const isSmallScreen = window.innerWidth < 1024;
      
      // Default to mobile if either condition is met
      setIsMobile(hasTouch || isSmallScreen);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Initialize Level
  const initLevel = useCallback((data: LevelData) => {
    let startX = 2;
    let startY = 2;
    
    for(let y=0; y<data.map.length; y++) {
      for(let x=0; x<data.map[y].length; x++) {
        if(data.map[y][x] === EntityType.PLAYER) {
          startX = x;
          startY = y;
          const newRow = data.map[y].substring(0, x) + ' ' + data.map[y].substring(x + 1);
          data.map[y] = newRow;
        }
      }
    }

    setLevelData(data);
    playerRef.current = {
      pos: { x: startX, y: startY },
      velocity: { x: 0, y: 0 },
      isGrounded: false,
      health: 3,
      score: 0,
      facingRight: true,
    };
    setRenderTrigger(prev => prev + 1);
  }, []);

  // Handle Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleVirtualInput = useCallback((key: string, pressed: boolean) => {
    keysPressed.current[key] = pressed;
  }, []);

  // Check Collision
  const checkCollision = (x: number, y: number, map: string[]): EntityType => {
    const checkY = Math.round(y);
    const checkX = Math.round(x);

    if (checkY < 0 || checkY >= map.length || checkX < 0 || checkX >= map[0].length) {
      return EntityType.WALL;
    }
    
    return map[checkY][checkX] as EntityType;
  };

  const collectItem = (x: number, y: number) => {
     const checkY = Math.round(y);
     const checkX = Math.round(x);
     
     if (checkY >= 0 && checkY < levelData.map.length && checkX >= 0 && checkX < levelData.map[0].length) {
        const char = levelData.map[checkY][checkX];
        if (char === EntityType.COIN) {
            // Remove coin from map
            const newMap = [...levelData.map];
            newMap[checkY] = newMap[checkY].substring(0, checkX) + ' ' + newMap[checkY].substring(checkX + 1);
            setLevelData(prev => ({...prev, map: newMap}));
            playerRef.current.score += 100;
        }
        if (char === EntityType.EXIT) {
           setGameState(GameState.VICTORY);
        }
     }
  };

  // Game Loop
  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    
    // FPS Throttling
    const FPS = 30;
    const FRAME_INTERVAL = 1000 / FPS;

    const loop = (time: number) => {
      const elapsed = time - lastTime;

      // Only update if enough time has passed (Limit to 30 FPS)
      if (elapsed > FRAME_INTERVAL) {
          lastTime = time - (elapsed % FRAME_INTERVAL);

          const player = playerRef.current;
          const map = levelData.map;

          // 1. Horizontal Movement
          if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) {
            player.velocity.x += MOVE_SPEED;
            player.facingRight = true;
          } else if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) {
            player.velocity.x -= MOVE_SPEED;
            player.facingRight = false;
          } else {
            player.velocity.x *= FRICTION;
          }

          player.velocity.x = Math.max(Math.min(player.velocity.x, MAX_SPEED), -MAX_SPEED);

          const nextX = player.pos.x + player.velocity.x;
          const collisionX = checkCollision(nextX, player.pos.y, map);
          
          if (collisionX === EntityType.WALL) {
            player.velocity.x = 0;
          } else {
            player.pos.x = nextX;
          }

          // 2. Vertical Movement & Gravity
          player.velocity.y += GRAVITY; // Gravity per frame (fixed time step)
          
          if ((keysPressed.current['ArrowUp'] || keysPressed.current['w'] || keysPressed.current[' ']) && player.isGrounded) {
            player.velocity.y = JUMP_FORCE;
            player.isGrounded = false;
          }

          const nextY = player.pos.y + player.velocity.y;
          const collisionY = checkCollision(player.pos.x, nextY, map);

          if (collisionY === EntityType.WALL) {
            if (player.velocity.y > 0) player.isGrounded = true;
            player.velocity.y = 0;
            player.pos.y = Math.round(player.pos.y);
          } else {
            player.isGrounded = false;
            player.pos.y = nextY;
          }

          // 3. Interactions
          const entityAtPos = checkCollision(player.pos.x, player.pos.y, map);
          if (entityAtPos === EntityType.SPIKE || entityAtPos === EntityType.ENEMY) {
            player.health -= 1;
            player.velocity.y = JUMP_FORCE;
            player.velocity.x = player.velocity.x > 0 ? -1 : 1;
            
            if (player.health <= 0) {
              setGameState(GameState.GAME_OVER);
            }
          } else {
            collectItem(player.pos.x, player.pos.y);
          }
          
          if (player.pos.y > map.length + 2) {
              player.health = 0;
              setGameState(GameState.GAME_OVER);
          }

          setRenderTrigger(t => t + 1);
      }
      
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, levelData]);

  // Calculate Camera
  const getCameraPos = () => {
    let camX = playerRef.current.pos.x - VIEWPORT_WIDTH / 2;
    let camY = playerRef.current.pos.y - VIEWPORT_HEIGHT / 2;
    camX = Math.max(0, Math.min(camX, levelData.map[0].length - VIEWPORT_WIDTH));
    camY = Math.max(0, Math.min(camY, levelData.map.length - VIEWPORT_HEIGHT));
    return { x: camX, y: camY };
  };

  const handleGenerate = async () => {
    setGameState(GameState.GENERATING);
    const theme = userInputTheme || "Haunted Castle";
    const newData = await generateLevel(theme);
    initLevel(newData);
    setGameState(GameState.PLAYING);
  };

  const handleStartDefault = () => {
    initLevel(DEFAULT_LEVEL);
    setGameState(GameState.PLAYING);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative font-mono text-stone-300 overflow-hidden select-none bg-stone-950">
      
      {/* Background decoration */}
      <div className="absolute inset-0 bg-stone-950 -z-10"></div>

      {/* Header */}
      <h1 className={`text-3xl md:text-5xl mb-6 font-bold text-center text-stone-400 whitespace-pre hidden md:block leading-none tracking-widest drop-shadow-md transition-all ${!isMobile && gameState === GameState.PLAYING ? 'scale-75 opacity-50 absolute top-4' : ''}`}>
        {ASCII_TITLE}
      </h1>

      {gameState === GameState.MENU && (
        <div className="border-4 border-double border-stone-600 bg-stone-900/90 p-8 max-w-lg w-full shadow-2xl z-10 relative">
          <p className="text-xl mb-6 text-center text-stone-300 gothic-text">
            The dungeon awaits, traveler.
          </p>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={handleStartDefault}
              className="bg-stone-800 hover:bg-red-900 text-stone-200 py-3 px-6 border-2 border-stone-500 font-bold uppercase tracking-widest transition-all gothic-text shadow-lg"
            >
              Enter the Abyss
            </button>
            
            <div className="flex items-center gap-2 my-2">
               <div className="h-px bg-stone-700 flex-1"></div>
               <span className="text-stone-600 text-xs">OR</span>
               <div className="h-px bg-stone-700 flex-1"></div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm text-stone-500 gothic-text">INCANTATION (Theme):</label>
              <input 
                type="text" 
                placeholder="e.g., Crypt, Inferno, Void"
                value={userInputTheme}
                onChange={(e) => setUserInputTheme(e.target.value)}
                className="bg-stone-950 border border-stone-700 text-stone-300 p-2 focus:outline-none focus:border-red-800 placeholder-stone-700 font-mono"
              />
              <button 
                onClick={handleGenerate}
                className="bg-stone-800 hover:bg-blue-900 text-stone-300 py-3 px-6 border-2 border-stone-500 font-bold uppercase tracking-widest transition-all gothic-text shadow-lg"
              >
                Conjure Realm
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState === GameState.GENERATING && (
        <div className="text-2xl animate-pulse text-red-800 z-10 gothic-text text-center">
          WEAVING SHADOWS...<br/>
          <span className="text-stone-600 text-base font-mono">Constructing geometry...</span>
        </div>
      )}

      {gameState === GameState.PLAYING && (
        <>
          <div className={`flex flex-col items-center z-10 w-full transition-all duration-500 ${isMobile ? 'max-w-4xl pb-40 md:pb-0' : 'h-screen justify-center'}`}>
             
             {/* HUD - Conditional Positioning for Desktop */}
             <div className={`w-full flex justify-between px-4 bg-stone-900/50 py-2 border-y border-stone-700 ${isMobile ? 'mb-4' : 'absolute top-0 left-0 z-20 w-full'}`}>
                <span className="text-xl text-red-700 font-bold">LIFE: {'†'.repeat(playerRef.current.health)}</span>
                <span className="text-xl text-amber-600 font-bold">GOLD: {playerRef.current.score}</span>
             </div>
             
             <AsciiDisplay 
               map={levelData.map} 
               playerState={playerRef.current} 
               cameraPos={getCameraPos()} 
             />
             
             <div className={`mt-6 text-stone-400 text-center bg-stone-900 p-4 border border-stone-800 max-w-2xl hidden md:block shadow-inner ${!isMobile ? 'absolute bottom-8' : ''}`}>
               <span className="text-stone-600 font-bold block mb-1 text-xs tracking-widest uppercase">Chronicle</span> 
               <span className="italic">"{levelData.story}"</span>
             </div>
          </div>
          
          {isMobile && <MobileControls onInput={handleVirtualInput} />}
        </>
      )}

      {(gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center">
          <h2 className={`text-6xl mb-6 font-bold gothic-text ${gameState === GameState.VICTORY ? 'text-amber-500' : 'text-red-900'}`}>
            {gameState === GameState.VICTORY ? 'VANQUISHED' : 'SLAIN'}
          </h2>
          <p className="text-2xl mb-8 text-stone-400 gothic-text">Legacy: {playerRef.current.score} Gold</p>
          <button 
             onClick={() => setGameState(GameState.MENU)}
             className="bg-stone-800 hover:bg-stone-700 text-white py-3 px-8 border-2 border-stone-500 text-xl font-bold gothic-text tracking-widest"
          >
            RESURRECT
          </button>
        </div>
      )}

    </div>
  );
};

export default App;