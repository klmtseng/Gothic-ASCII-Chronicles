export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  GENERATING = 'GENERATING',
}

export enum EntityType {
  EMPTY = ' ',
  WALL = '#',
  SPIKE = '^',
  COIN = '$',
  EXIT = 'X',
  PLAYER = '@',
  ENEMY = 'E',
}

export interface Position {
  x: number;
  y: number;
}

export interface LevelData {
  map: string[]; // Array of strings representing rows
  story: string;
  name: string;
}

export interface PlayerState {
  pos: Position;
  velocity: Position;
  isGrounded: boolean;
  health: number;
  score: number;
  facingRight: boolean;
}