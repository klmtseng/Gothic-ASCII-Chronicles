import React, { useState, useEffect } from 'react';
import { GameState, StoryNode, LogEntry } from './types';
import { INITIAL_STORY, ASCII_TITLE } from './constants';
import AsciiDisplay from './components/AsciiDisplay';
import MobileControls from './components/MobileControls'; // Now acts as Choice Panel
import { generateNextTurn, resetGame } from './services/geminiService';

const App: React.FC = () => {
  // Game State
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentNode, setCurrentNode] = useState<StoryNode>(INITIAL_STORY);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Start a new game
  const handleStart = () => {
    resetGame();
    setCurrentNode(INITIAL_STORY);
    setLogs([
        { type: 'narrator', text: INITIAL_STORY.description, art: INITIAL_STORY.asciiArt }
    ]);
    setGameState(GameState.PLAYING);
  };

  // Handle Player Choice
  const handleChoice = async (action: string) => {
    if (isLoading) return;
    setIsLoading(true);

    // 1. Add player action to log
    const newLogs: LogEntry[] = [...logs, { type: 'player', text: action }];
    setLogs(newLogs);

    // 2. Call AI
    const nextNode = await generateNextTurn(currentNode, action);

    // 3. Update State
    setCurrentNode(nextNode);
    
    // 4. Add AI response to log
    setLogs(prev => [
        ...prev, 
        { 
            type: 'narrator', 
            text: nextNode.description, 
            art: nextNode.asciiArt 
        }
    ]);

    // Check Death
    if (nextNode.hp <= 0) {
        setGameState(GameState.GAME_OVER);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between relative font-mono text-stone-300 bg-stone-950 overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute inset-0 bg-stone-950 z-0 pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black to-transparent opacity-80"></div>
         <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent opacity-80"></div>
      </div>

      {/* Header HUD */}
      <div className="w-full bg-stone-900 border-b border-stone-800 p-2 z-10 flex justify-between items-center shadow-lg">
          <div className="hidden md:block whitespace-pre text-[8px] leading-3 text-stone-600 opacity-50">
             {ASCII_TITLE}
          </div>
          <div className="flex gap-6 mx-auto md:mx-0 font-bold tracking-widest text-sm md:text-base">
              <span className="text-red-800 drop-shadow">HP: {currentNode.hp}</span>
              <span className="text-amber-600 drop-shadow">GOLD: {currentNode.gold}</span>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col items-center justify-start overflow-hidden z-10 relative">
        
        {gameState === GameState.MENU && (
             <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in">
                <pre className="text-[10px] md:text-sm text-stone-400 mb-8 leading-none font-bold text-shadow">
                    {ASCII_TITLE}
                </pre>
                <p className="max-w-md text-stone-500 mb-8 italic font-serif">
                    "Dare you enter the realm of infinite shadows, where every choice is written in blood?"
                </p>
                <button 
                    onClick={handleStart}
                    className="px-8 py-3 bg-stone-800 border-2 border-stone-600 text-stone-200 hover:bg-red-900 hover:border-red-600 transition-all font-mono uppercase tracking-[0.2em] shadow-lg group"
                >
                    Begin Chronicle
                </button>
             </div>
        )}

        {(gameState === GameState.PLAYING || gameState === GameState.GAME_OVER) && (
            <AsciiDisplay logs={logs} isTyping={isLoading} />
        )}

      </div>

      {/* Footer / Input Area */}
      {gameState === GameState.PLAYING && (
          <MobileControls 
            choices={currentNode.choices} 
            onChoose={handleChoice} 
            disabled={isLoading} 
          />
      )}

      {gameState === GameState.GAME_OVER && (
          <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
              <h1 className="text-5xl text-red-800 font-bold mb-4 gothic-text">YOU DIED</h1>
              <p className="text-stone-500 mb-8">The story ends here.</p>
              <button 
                onClick={() => setGameState(GameState.MENU)}
                className="px-6 py-2 border border-stone-500 text-stone-400 hover:bg-stone-800"
              >
                RETURN TO MENU
              </button>
          </div>
      )}

    </div>
  );
};

export default App;