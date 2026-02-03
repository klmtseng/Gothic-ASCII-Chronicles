import { StoryNode } from "./types";

// Visual constraints
export const MAX_ART_WIDTH = 50;
export const MAX_ART_HEIGHT = 15;

export const INITIAL_STORY: StoryNode = {
  description: "You stand before the iron gates of the Black Citadel. The rain tastes of ash. A gargoyle perched above watches you with hollow eyes. The gates are slightly ajar, revealing a darkness thicker than night.",
  asciiArt: `
      /\\
     /  \\   |    |    |
    /    \\  |    |    |
   /      \\ |____|____|
  /   /\\   \\    ||
 /   /  \\   \\   ||
/___/____\\___\\  ||
    |  |        ||    ^
   _|__|__      ||   / \\
  | ____  |     ||  /___\\
  ||    | |     ||   | |
  ||    | |     ||   | |
  ||____|_|     ||   |_|
  |_______|    _||_
  `,
  choices: [
    { label: "Enter the Citadel", action: "Push open the gates and enter confidently" },
    { label: "Search surroundings", action: "Look around the entrance for hidden items" },
    { label: "Yell a challenge", action: "Scream at the castle to draw out enemies" }
  ],
  hp: 100,
  gold: 0
};

export const ASCII_TITLE = `
   GOTHIC CHRONICLES
     - TEXT RPG -
`;
