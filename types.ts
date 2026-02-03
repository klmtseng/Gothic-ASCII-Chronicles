export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  LOADING = 'LOADING',
}

export interface Choice {
  label: string; // What the user sees (e.g., "Examine the chest")
  action: string; // The specific intent sent to AI
}

export interface StoryNode {
  description: string; // The narrative text
  asciiArt: string;    // The visual representation of the scene
  choices: Choice[];   // Available actions
  hp: number;          // Player health tracking
  gold: number;        // Player gold tracking
}

export interface LogEntry {
  type: 'player' | 'narrator';
  text: string;
  art?: string;
}
