import { LevelData } from './types';

export const PLAYER_HEIGHT = 1.6;
export const PLAYER_RADIUS = 0.3;
export const PLAYER_SPEED = 3.5;
export const PLAYER_SPRINT_SPEED = 6.0;
export const MOUSE_SENSITIVITY = 0.002;
export const INTERACT_DISTANCE = 3.0;
export const WALL_THICKNESS = 0.3;
export const CEILING_HEIGHT = 3.5;

// Helper to define a rectangular room's walls with optional doorways
function room(
  cx: number, cz: number, w: number, d: number,
  doorways?: { wall: 'N' | 'S' | 'E' | 'W'; offset?: number; width?: number; isDoor?: boolean; doorId?: string; requiredKey?: string }[]
): { walls: LevelData['walls']; floor: LevelData['floors'][0] } {
  const hw = w / 2, hd = d / 2;
  const dw = 1.2; // default doorway half-width
  const walls: LevelData['walls'] = [];
  const doorMap: Record<string, any[]> = { N: [], S: [], E: [], W: [] };

  if (doorways) {
    for (const dwy of doorways) {
      doorMap[dwy.wall].push(dwy);
    }
  }

  // North wall (z = cz - hd)
  const nz = cz - hd;
  if (doorMap.N.length === 0) {
    walls.push({ x1: cx - hw, z1: nz, x2: cx + hw, z2: nz });
  } else {
    for (const d of doorMap.N) {
      const dhw = (d.width || dw * 2) / 2;
      const off = d.offset || 0;
      walls.push({ x1: cx - hw, z1: nz, x2: cx + off - dhw, z2: nz });
      walls.push({ x1: cx + off + dhw, z1: nz, x2: cx + hw, z2: nz });
      if (d.isDoor) {
        walls.push({ x1: cx + off - dhw, z1: nz, x2: cx + off + dhw, z2: nz, isDoor: true, doorId: d.doorId, requiredKey: d.requiredKey });
      }
    }
  }

  // South wall (z = cz + hd)
  const sz = cz + hd;
  if (doorMap.S.length === 0) {
    walls.push({ x1: cx - hw, z1: sz, x2: cx + hw, z2: sz });
  } else {
    for (const d of doorMap.S) {
      const dhw = (d.width || dw * 2) / 2;
      const off = d.offset || 0;
      walls.push({ x1: cx - hw, z1: sz, x2: cx + off - dhw, z2: sz });
      walls.push({ x1: cx + off + dhw, z1: sz, x2: cx + hw, z2: sz });
      if (d.isDoor) {
        walls.push({ x1: cx + off - dhw, z1: sz, x2: cx + off + dhw, z2: sz, isDoor: true, doorId: d.doorId, requiredKey: d.requiredKey });
      }
    }
  }

  // West wall (x = cx - hw)
  const wx = cx - hw;
  if (doorMap.W.length === 0) {
    walls.push({ x1: wx, z1: cz - hd, x2: wx, z2: cz + hd });
  } else {
    for (const d of doorMap.W) {
      const dhw = (d.width || dw * 2) / 2;
      const off = d.offset || 0;
      walls.push({ x1: wx, z1: cz - hd, x2: wx, z2: cz + off - dhw });
      walls.push({ x1: wx, z1: cz + off + dhw, x2: wx, z2: cz + hd });
      if (d.isDoor) {
        walls.push({ x1: wx, z1: cz + off - dhw, x2: wx, z2: cz + off + dhw, isDoor: true, doorId: d.doorId, requiredKey: d.requiredKey });
      }
    }
  }

  // East wall (x = cx + hw)
  const ex = cx + hw;
  if (doorMap.E.length === 0) {
    walls.push({ x1: ex, z1: cz - hd, x2: ex, z2: cz + hd });
  } else {
    for (const d of doorMap.E) {
      const dhw = (d.width || dw * 2) / 2;
      const off = d.offset || 0;
      walls.push({ x1: ex, z1: cz - hd, x2: ex, z2: cz + off - dhw });
      walls.push({ x1: ex, z1: cz + off + dhw, x2: ex, z2: cz + hd });
      if (d.isDoor) {
        walls.push({ x1: ex, z1: cz + off - dhw, x2: ex, z2: cz + off + dhw, isDoor: true, doorId: d.doorId, requiredKey: d.requiredKey });
      }
    }
  }

  return {
    walls,
    floor: { x: cx, z: cz, w, d, ceilingY: CEILING_HEIGHT },
  };
}

// Corridor helper: connects two points with a walled passage
function corridor(
  x1: number, z1: number, x2: number, z2: number, width: number
): { walls: LevelData['walls']; floor: LevelData['floors'][0] } {
  const hw = width / 2;
  const walls: LevelData['walls'] = [];

  if (x1 === x2) {
    // Vertical corridor (along z)
    const minZ = Math.min(z1, z2);
    const maxZ = Math.max(z1, z2);
    walls.push({ x1: x1 - hw, z1: minZ, x2: x1 - hw, z2: maxZ });
    walls.push({ x1: x1 + hw, z1: minZ, x2: x1 + hw, z2: maxZ });
    return {
      walls,
      floor: { x: x1, z: (minZ + maxZ) / 2, w: width, d: maxZ - minZ, ceilingY: CEILING_HEIGHT },
    };
  } else {
    // Horizontal corridor (along x)
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    walls.push({ x1: minX, z1: z1 - hw, x2: maxX, z2: z1 - hw });
    walls.push({ x1: minX, z1: z1 + hw, x2: maxX, z2: z1 + hw });
    return {
      walls,
      floor: { x: (minX + maxX) / 2, z: z1, w: maxX - minX, d: width, ceilingY: CEILING_HEIGHT },
    };
  }
}

// ============================================================
// LEVEL DEFINITION
// ============================================================
// Layout (top-down, z goes negative = "north"):
//
//              [Library]
//                  |
//  [Entry] -- [Hub] -- [Chapel]
//                  |
//              [Crypt] (locked)
//                  |
//              [Exit]
//

const entryRoom = room(0, 0, 10, 8, [
  { wall: 'N', offset: 0 },
]);

const corridorEntryHub = corridor(0, -4, 0, -6, 2.4);

const hubRoom = room(0, -12, 14, 10, [
  { wall: 'S', offset: 0 },
  { wall: 'W', offset: 0 },
  { wall: 'E', offset: 0 },
  { wall: 'N', offset: 0, isDoor: true, doorId: 'crypt_door', requiredKey: 'crypt_key' },
]);

const corridorHubLibrary = corridor(-7, -12, -10, -12, 2.4);

const libraryRoom = room(-16, -12, 10, 10, [
  { wall: 'E', offset: 0 },
]);

const corridorHubChapel = corridor(7, -12, 10, -12, 2.4);

const chapelRoom = room(16, -12, 10, 10, [
  { wall: 'W', offset: 0 },
]);

const corridorHubCrypt = corridor(0, -17, 0, -20, 2.4);

const cryptRoom = room(0, -26, 12, 10, [
  { wall: 'S', offset: 0 },
  { wall: 'N', offset: 0 },
]);

const corridorCryptExit = corridor(0, -31, 0, -34, 2.4);

const exitRoom = room(0, -39, 8, 8, [
  { wall: 'S', offset: 0 },
]);

// Merge all
const allRoomData = [
  entryRoom, corridorEntryHub,
  hubRoom, corridorHubLibrary, libraryRoom,
  corridorHubChapel, chapelRoom,
  corridorHubCrypt, cryptRoom,
  corridorCryptExit, exitRoom,
];

export const LEVEL: LevelData = {
  walls: allRoomData.flatMap(r => r.walls),
  floors: allRoomData.map(r => r.floor),

  items: [
    {
      id: 'crypt_key',
      type: 'key',
      x: -16, z: -12, y: 0.8,
      name: 'Crypt Key',
      description: 'A rusted iron key. It feels ice-cold.',
      keyId: 'crypt_key',
    },
    {
      id: 'health_potion',
      type: 'health',
      x: 16, z: -12, y: 0.8,
      name: 'Blood Vial',
      description: 'A glass vial filled with dark crimson liquid.',
      value: 40,
    },
    {
      id: 'chapel_note',
      type: 'note',
      x: 18, z: -14, y: 1.0,
      name: 'Torn Page',
      description: '"They sealed the crypt for a reason. The dead do not rest here. They wait."',
    },
    {
      id: 'crypt_note',
      type: 'note',
      x: -2, z: -26, y: 1.0,
      name: 'Final Letter',
      description: '"If you are reading this, run. Do not look behind you. The exit is north. GO."',
    },
  ],

  lights: [
    // Entry
    { x: 0, y: 2.8, z: 0, color: 0xff6622, intensity: 1.5, distance: 12, flicker: true },
    // Hub
    { x: -4, y: 2.8, z: -12, color: 0xff5511, intensity: 1.0, distance: 10, flicker: true },
    { x: 4, y: 2.8, z: -12, color: 0xff5511, intensity: 1.0, distance: 10, flicker: true },
    // Library
    { x: -16, y: 2.8, z: -10, color: 0x6644ff, intensity: 0.8, distance: 10, flicker: true },
    // Chapel
    { x: 16, y: 2.8, z: -12, color: 0xff2200, intensity: 1.2, distance: 12, flicker: true },
    { x: 14, y: 2.8, z: -14, color: 0xff2200, intensity: 0.6, distance: 8, flicker: true },
    // Crypt
    { x: 0, y: 2.8, z: -26, color: 0x22ff44, intensity: 0.4, distance: 14, flicker: true },
    // Exit
    { x: 0, y: 2.8, z: -39, color: 0xffffff, intensity: 2.0, distance: 15, flicker: false },
  ],

  triggers: [
    {
      id: 'entry_slam',
      x: 0, z: 1,
      radius: 3,
      type: 'message',
      oneShot: true,
      message: 'The heavy door slams shut behind you. There is no going back.',
    },
    {
      id: 'hub_whisper',
      x: 0, z: -12,
      radius: 4,
      type: 'sound',
      oneShot: true,
      soundType: 'whisper',
      message: 'You hear a faint whisper... "Turn back..."',
    },
    {
      id: 'library_creak',
      x: -14, z: -10,
      radius: 3,
      type: 'sound',
      oneShot: true,
      soundType: 'growl',
      message: 'Something shifts in the shadows between the shelves.',
    },
    {
      id: 'chapel_organ',
      x: 16, z: -9,
      radius: 4,
      type: 'sound',
      oneShot: true,
      soundType: 'drone',
      message: 'A deep, resonant chord fills the chapel. The candles flicker violently.',
    },
    {
      id: 'chapel_damage',
      x: 18, z: -15,
      radius: 2,
      type: 'damage',
      oneShot: true,
      damage: 15,
      message: 'Something slashes at you from the darkness!',
    },
    {
      id: 'crypt_scream',
      x: 0, z: -24,
      radius: 5,
      type: 'sound',
      oneShot: true,
      soundType: 'scream',
      message: 'A blood-curdling scream echoes through the crypt!',
      delay: 2000,
    },
    {
      id: 'crypt_damage',
      x: 2, z: -28,
      radius: 2.5,
      type: 'damage',
      oneShot: true,
      damage: 25,
      message: 'Cold hands grip your throat from behind!',
    },
    {
      id: 'crypt_visual',
      x: 0, z: -26,
      radius: 6,
      type: 'visual',
      oneShot: true,
      message: 'The walls seem to breathe. Reality warps around you.',
    },
    {
      id: 'exit_near',
      x: 0, z: -37,
      radius: 3,
      type: 'message',
      oneShot: true,
      message: 'You see light ahead. Freedom is close. RUN.',
    },
  ],

  spawnX: 0,
  spawnZ: 2,
  spawnAngle: Math.PI, // facing north (negative Z)
};
