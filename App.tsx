import React, { useState } from 'react';
import { GameState, StoryNode, LogEntry, Language } from './types';
import { INITIAL_STORY, ASCII_TITLE, TRANSLATIONS } from './constants';
import AsciiDisplay from './components/AsciiDisplay';
import MobileControls from './components/MobileControls';
import Viewport from './components/Viewport';
import { generateNextTurn, resetGame } from './services/geminiService';

const App: React.FC = () => {
  // Game State
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [language, setLanguage] = useState<Language>('en');
  // Initialize with English, but it will be overwritten when starting game if lang changed
  const [currentNode, setCurrentNode] = useState<StoryNode>(INITIAL_STORY['en']);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const t = TRANSLATIONS[language];

  // Start a new game
  const handleStart = () => {
    resetGame();
    const startNode = INITIAL_STORY[language];
    setCurrentNode(startNode);
    setLogs([
        { type: 'narrator', text: startNode.description }
    ]);
    setGameState(GameState.PLAYING);
  };

  // Toggle Language
  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
    // If in menu, update the preview node immediately
    if (gameState === GameState.MENU) {
        setCurrentNode(INITIAL_STORY[newLang]);
    }
  };

  // Handle Player Choice
  const handleChoice = async (action: string) => {
    if (isLoading) return;
    setIsLoading(true);

    // 1. Add player action to log
    setLogs(prev => [...prev, { type: 'player', text: action }]);

    // 2. Call AI
    const nextNode = await generateNextTurn(currentNode, action, language);

    // 3. Update State
    setCurrentNode(nextNode);
    
    // 4. Add AI response to log
    setLogs(prev => [
        ...prev, 
        { 
            type: 'narrator', 
            text: nextNode.description 
        }
    ]);

    // Check Death
    if (nextNode.hp <= 0) {
        setGameState(GameState.GAME_OVER);
    }

    setIsLoading(false);
  };

  return (
    <div className="h-screen w-screen bg-stone-950 flex items-center justify-center p-0 md:p-6 overflow-hidden">
      
      {/* Main Game Container (The SSI "Box") */}
      <div className="w-full h-full max-w-6xl md:h-[85vh] bg-stone-900 border-4 border-double border-stone-600 shadow-2xl flex flex-col md:flex-row relative">
         
         {/* --- LEFT PANEL: VISUALS & STATS --- */}
         <div className="w-full md:w-5/12 h-[45%] md:h-full flex flex-col border-b-4 md:border-b-0 md:border-r-4 border-double border-stone-600 bg-black">
            
            {/* 1. Viewport (The Image) */}
            <Viewport 
                image={currentNode.imageBase64} 
                isLoading={isLoading} 
                labels={{ void: t.void, etching: t.etching }}
            />
            
            {/* 2. Stats Block (SSI Style) */}
            <div className="flex-1 p-4 bg-stone-900 flex flex-col gap-4 font-serif text-stone-400 relative">
               <div className="absolute top-0 left-0 w-full h-1 bg-stone-800 shadow-lg"></div>
               
               {/* Title & Lang Switch */}
               <div className="flex justify-between items-center border-b border-stone-700 pb-2 mb-2">
                  <h2 className="gothic-text text-xl text-stone-300 tracking-[0.2em]">{t.title}</h2>
                  <button 
                    onClick={toggleLanguage}
                    className="text-[10px] border border-stone-600 px-2 py-1 text-stone-500 hover:text-stone-300 hover:border-stone-400 transition-colors"
                  >
                    {language === 'en' ? '中文' : 'ENG'}
                  </button>
               </div>

               <div className="grid grid-cols-2 gap-4 text-sm md:text-base">
                  <div className="border border-stone-700 p-2 bg-black/40">
                     <span className="block text-[10px] text-stone-600 uppercase tracking-wider">{t.health}</span>
                     <span className={`text-xl font-bold ${currentNode.hp < 30 ? 'text-red-600 animate-pulse' : 'text-stone-200'}`}>
                        {currentNode.hp} <span className="text-xs text-stone-600">/ 100</span>
                     </span>
                  </div>
                  <div className="border border-stone-700 p-2 bg-black/40">
                     <span className="block text-[10px] text-stone-600 uppercase tracking-wider">{t.gold}</span>
                     <span className="text-xl font-bold text-amber-600">{currentNode.gold}</span>
                  </div>
               </div>
               
               {/* Flavor text area */}
               <div className="mt-auto text-xs text-stone-600 italic text-center font-mono">
                  {gameState === GameState.MENU ? t.systemReady : t.systemRecording}
               </div>
            </div>
         </div>

         {/* --- RIGHT PANEL: TEXT LOG & INPUT --- */}
         <div className="w-full md:w-7/12 h-[55%] md:h-full flex flex-col bg-stone-900">
            
            {/* Menu Overlay (If Menu) */}
            {gameState === GameState.MENU && (
               <div className="absolute inset-0 z-50 bg-stone-950/90 flex flex-col items-center justify-center p-8 backdrop-blur-sm">
                  <h1 className="text-4xl md:text-6xl gothic-text text-stone-300 mb-6 drop-shadow-lg text-center">
                     {t.title}
                  </h1>
                  <p className="text-stone-500 mb-4 max-w-md text-center font-serif">
                     {t.desc}
                  </p>
                  
                  {/* Big Language Toggle in Menu */}
                  <div className="mb-8 flex gap-4">
                     <button 
                        onClick={() => { setLanguage('en'); setCurrentNode(INITIAL_STORY['en']); }}
                        className={`text-xs uppercase tracking-widest ${language === 'en' ? 'text-red-500 underline' : 'text-stone-600 hover:text-stone-400'}`}
                     >
                        English
                     </button>
                     <span className="text-stone-700">|</span>
                     <button 
                        onClick={() => { setLanguage('zh'); setCurrentNode(INITIAL_STORY['zh']); }}
                        className={`text-xs uppercase tracking-widest ${language === 'zh' ? 'text-red-500 underline' : 'text-stone-600 hover:text-stone-400'}`}
                     >
                        繁體中文
                     </button>
                  </div>

                  <button 
                     onClick={handleStart}
                     className="px-8 py-3 bg-red-900/20 border-2 border-red-900/50 text-red-100 hover:bg-red-900 hover:border-red-500 transition-all uppercase tracking-widest font-mono text-sm"
                  >
                     {t.startBtn}
                  </button>
               </div>
            )}
             
            {/* Death Overlay */}
            {gameState === GameState.GAME_OVER && (
              <div className="absolute inset-0 z-40 bg-black/80 flex flex-col items-center justify-center pointer-events-auto">
                 <h2 className="text-5xl text-red-700 gothic-text mb-4">{t.gameOver}</h2>
                 <button onClick={() => setGameState(GameState.MENU)} className="border border-stone-500 text-stone-400 px-4 py-2 hover:bg-stone-800">
                    {t.restart}
                 </button>
              </div>
            )}

            {/* 3. Text Console */}
            <AsciiDisplay 
                logs={logs} 
                isTyping={isLoading} 
                typingLabel={t.typing}
            />
            
            {/* 4. Controls */}
            <MobileControls 
               choices={currentNode.choices} 
               onChoose={handleChoice} 
               disabled={isLoading || gameState !== GameState.PLAYING} 
               labels={{ commands: t.commands, noActions: t.noActions }}
            />
         </div>

      </div>
    </div>
  );
};

export default App;