export enum GamePhase {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  DEAD = 'DEAD',
  ESCAPED = 'ESCAPED',
}

export type MessageType = 'info' | 'warning' | 'horror' | 'pickup' | 'story';

export interface GameMessage {
  text: string;
  type: MessageType;
  timestamp: number;
  duration: number;
}

export interface GameCallbacks {
  onHealthChange: (hp: number) => void;
  onMessage: (text: string, type: MessageType, duration?: number) => void;
  onItemPickup: (itemName: string) => void;
  onDeath: () => void;
  onEscape: () => void;
  onInteractableChange: (prompt: string | null) => void;
}

export interface WallSegment {
  x1: number; z1: number;
  x2: number; z2: number;
  height?: number;
  isDoor?: boolean;
  doorId?: string;
  requiredKey?: string;
}

export interface ItemDef {
  id: string;
  type: 'key' | 'health' | 'note';
  x: number; z: number; y: number;
  name: string;
  description: string;
  value?: number;
  keyId?: string;
}

export interface LightDef {
  x: number; y: number; z: number;
  color: number;
  intensity: number;
  distance: number;
  flicker: boolean;
}

export interface HorrorTrigger {
  id: string;
  x: number; z: number;
  radius: number;
  type: 'message' | 'sound' | 'damage' | 'visual';
  oneShot: boolean;
  message?: string;
  damage?: number;
  soundType?: 'whisper' | 'scream' | 'growl' | 'drone';
  delay?: number;
}

export interface FloorArea {
  x: number; z: number;
  w: number; d: number;
  ceilingY: number;
}

export interface LevelData {
  walls: WallSegment[];
  floors: FloorArea[];
  items: ItemDef[];
  lights: LightDef[];
  triggers: HorrorTrigger[];
  spawnX: number;
  spawnZ: number;
  spawnAngle: number;
}
