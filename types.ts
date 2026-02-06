export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  LOADING = 'LOADING',
}

export type Language = 'en' | 'zh';

export interface Choice {
  label: string; // What the user sees (e.g., "Examine the chest")
  action: string; // The specific intent sent to AI
}

export interface StoryNode {
  description: string; // The narrative text
  imageBase64: string | null; // Base64 encoded image string (PNG)
  choices: Choice[];   // Available actions
  hp: number;          // Player health tracking
  gold: number;        // Player gold tracking
}

export interface LogEntry {
  type: 'player' | 'narrator';
  text: string;
  image?: string; // Optional image for narrator logs
}