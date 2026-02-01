import React, { useMemo } from 'react';
import { EntityType, Position, PlayerState } from '../types';
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, PLAYER_SPRITE, VISUAL_ASSETS } from '../constants';

interface AsciiDisplayProps {
  map: string[];
  playerState: PlayerState;
  cameraPos: Position;
}

const AsciiDisplay: React.FC<AsciiDisplayProps> = ({ map, playerState, cameraPos }) => {
  
  // Determine player character based on state
  const playerChar = useMemo(() => {
    if (playerState.health <= 0) return PLAYER_SPRITE.DEAD;
    if (!playerState.isGrounded) return PLAYER_SPRITE.JUMP;
    
    // Simple animation toggle based on x position for running
    if (Math.abs(playerState.velocity.x) > 0.1) {
      // Toggle between two run frames
      return Math.floor(Date.now() / 150) % 2 === 0 ? PLAYER_SPRITE.RUN_1 : PLAYER_SPRITE.RUN_2;
    }
    return PLAYER_SPRITE.IDLE;
  }, [playerState.health, playerState.isGrounded, playerState.velocity.x]);

  const renderGrid = () => {
    const grid: React.ReactElement[] = [];
    
    const startX = Math.floor(cameraPos.x);
    const startY = Math.floor(cameraPos.y);

    for (let y = 0; y < VIEWPORT_HEIGHT; y++) {
      const rowY = startY + y;
      let rowString = "";
      let rowChars: { char: string, type: string }[] = [];
      
      for (let x = 0; x < VIEWPORT_WIDTH; x++) {
        const colX = startX + x;
        
        let charToRender = VISUAL_ASSETS.EMPTY;
        let typeToRender = 'EMPTY';

        // Bounds check
        if (rowY < 0 || rowY >= map.length || colX < 0 || colX >= (map[0]?.length || 0)) {
           charToRender = VISUAL_ASSETS.WALL;
           typeToRender = EntityType.WALL;
        } else {
            // Check if this is player position (visual)
            const isPlayerHere = Math.round(playerState.pos.x) === colX && Math.round(playerState.pos.y) === rowY;

            if (isPlayerHere) {
              charToRender = playerChar;
              typeToRender = EntityType.PLAYER;
            } else {
              // Map mapping
              const rawChar = map[rowY][colX];
              switch (rawChar) {
                case EntityType.WALL: charToRender = VISUAL_ASSETS.WALL; typeToRender = EntityType.WALL; break;
                case EntityType.SPIKE: charToRender = VISUAL_ASSETS.SPIKE; typeToRender = EntityType.SPIKE; break;
                case EntityType.COIN: charToRender = VISUAL_ASSETS.COIN; typeToRender = EntityType.COIN; break;
                case EntityType.EXIT: charToRender = VISUAL_ASSETS.EXIT; typeToRender = EntityType.EXIT; break;
                case EntityType.ENEMY: charToRender = VISUAL_ASSETS.ENEMY; typeToRender = EntityType.ENEMY; break;
                default: charToRender = VISUAL_ASSETS.EMPTY;
              }
            }
        }
        rowChars.push({ char: charToRender, type: typeToRender });
      }
      
      // Colorize the row characters
      const renderedChars = rowChars.map((item, idx) => {
        let colorClass = ""; 
        
        switch (item.type) {
            case EntityType.PLAYER:
                colorClass = item.char === PLAYER_SPRITE.DEAD 
                    ? "text-red-600 font-bold" 
                    : "text-stone-100 font-bold drop-shadow-[0_0_5px_rgba(255,255,255,0.6)]";
                break;
            case EntityType.SPIKE:
                colorClass = "text-stone-600"; // Metallic spike look
                break;
            case EntityType.COIN:
                colorClass = "text-amber-500 animate-pulse drop-shadow-md"; 
                break;
            case EntityType.EXIT:
                colorClass = "text-purple-400 animate-pulse drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]";
                break;
            case EntityType.ENEMY:
                colorClass = "text-red-700 font-bold drop-shadow-sm";
                break;
            case EntityType.WALL:
                colorClass = "text-stone-700 opacity-80"; // Dim walls to let foreground pop
                break;
            default:
                colorClass = "text-stone-500";
        }

        return (
          <span key={`${y}-${idx}`} className={colorClass}>
            {item.char}
          </span>
        );
      });

      grid.push(
        <div key={y} className="whitespace-pre leading-none h-[1.2rem] flex">
          {renderedChars}
        </div>
      );
    }
    return grid;
  };

  return (
    <div className="relative">
        {/* Ornate Top Border */}
        <div className="text-stone-600 font-mono text-center leading-none text-xl md:text-2xl lg:text-3xl opacity-50">
           ╔══════════════════════════════════════╗
        </div>

        <div className="bg-stone-950 border-l-2 border-r-2 border-stone-600 px-2 py-1 shadow-[inset_0_0_30px_rgba(0,0,0,1)] font-mono text-xl md:text-2xl lg:text-3xl select-none w-fit mx-auto relative transition-all duration-300">
            {/* Render Grid */}
            <div className="relative z-10">
              {renderGrid()}
            </div>
            
            {/* Vignette Overlay for the screen itself */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_50%,rgba(0,0,0,0.6)_100%)]"></div>

            {/* Debug Overlay styled as runes */}
            <div className="absolute top-2 right-4 text-stone-800 text-xs font-serif opacity-30 z-20 pointer-events-none">
                POS: {Math.round(playerState.pos.x)},{Math.round(playerState.pos.y)}
            </div>
        </div>

        {/* Ornate Bottom Border */}
        <div className="text-stone-600 font-mono text-center leading-none text-xl md:text-2xl lg:text-3xl opacity-50">
           ╚══════════════════════════════════════╝
        </div>
    </div>
  );
};

export default AsciiDisplay;