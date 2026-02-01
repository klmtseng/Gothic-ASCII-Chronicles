import { LevelData } from "./types";

export const GRAVITY = 0.04;      // Reduced from 0.05
export const JUMP_FORCE = -0.7;   // Reduced from -0.9
export const MOVE_SPEED = 0.2;    // Reduced significantly from 0.4
export const MAX_SPEED = 0.5;     // Reduced from 0.8
export const FRICTION = 0.85;     // Increased friction slightly for tighter control

// Visual viewport size (in characters)
export const VIEWPORT_WIDTH = 40;
export const VIEWPORT_HEIGHT = 20;

export const DEFAULT_LEVEL: LevelData = {
  name: "The Crypt of Echoes",
  story: "You awaken in a cold, stone dungeon. The walls whisper of escape.",
  map: [
    "############################################################",
    "#                                                          #",
    "#                                                          #",
    "#      $                                                   #",
    "#     ###            $        E                            #",
    "#                   ###      ###           X               #",
    "#  @       ^   $                      ##########           #",
    "################        ###                                #",
    "#                                ^  ^                      #",
    "#            ####    E          ######                     #",
    "#                   ###                                    #",
    "#     $                                                    #",
    "#    ###                                        $          #",
    "#           ^   ^   ^                      ##########      #",
    "############################################################",
    "############################################################",
    "############################################################",
    "############################################################",
    "############################################################",
    "############################################################"
  ]
};

// ASCII Art Assets
export const ASCII_TITLE = `
  ▄████  ▒█████  ▄▄▄█████▓ 
 ██▒ ▀█▒▒██▒  ██▒▓  ██▒ ▓▒ 
▒██░▄▄▄░▒██░  ██▒▒ ▓██░ ▒░ 
░▓█  ██▓▒██   ██░░ ▓██▓ ░  
░▒▓███▀▒░ ████▓▒░  ▒██▒    
 ░▒   ▒ ░ ▒░▒░▒░   ▒ ░░    
  ░   ░   ░ ▒ ▒░     ░     
░ ░   ░ ░ ░ ░ ▒    ░       
      ░     ░ ░            
   GOTHIC CHRONICLES
`;

// More "Human-like" stickman sprites using standard/extended ASCII
export const PLAYER_SPRITE = {
  IDLE: 'Å',  // Looks like a person standing (Head + Body + Legs)
  RUN_1: 'λ', // Looks like legs walking
  RUN_2: 'k', // Looks like running with arm swinging
  JUMP: 'Y',  // Looks like arms raised high
  DEAD: '☠',  // Skull
};

export const VISUAL_ASSETS = {
  WALL: '▓',    // Solid block texture
  SPIKE: '▲',   // Upward spike
  COIN: '♦',    // Gem/Diamond
  EXIT: 'Ω',    // Omega gate
  ENEMY: 'Ψ',   // Trident/Devil
  EMPTY: ' '
};