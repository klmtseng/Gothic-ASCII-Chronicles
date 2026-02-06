import { StoryNode, Language } from "./types";

// Visual constraints
export const MAX_ART_WIDTH = 50;
export const MAX_ART_HEIGHT = 15;

export const INITIAL_STORY: Record<Language, StoryNode> = {
  en: {
    description: "You stand before the iron gates of the Black Citadel. The rain tastes of ash. A gargoyle perched above watches you with hollow eyes. The gates are slightly ajar, revealing a darkness thicker than night.",
    imageBase64: null,
    choices: [
      { label: "Enter the Citadel", action: "Push open the gates and enter confidently" },
      { label: "Search surroundings", action: "Look around the entrance for hidden items" },
      { label: "Yell a challenge", action: "Scream at the castle to draw out enemies" }
    ],
    hp: 100,
    gold: 0
  },
  zh: {
    description: "你站在黑色城堡的鐵柵門前。雨水帶著灰燼的味道。一隻棲息在上方的石像鬼用空洞的眼神注視著你。大門微微敞開，透出比黑夜更濃稠的黑暗。",
    imageBase64: null,
    choices: [
      { label: "進入城堡", action: "推開大門，自信地走進去" },
      { label: "搜索周圍", action: "在入口附近尋找隱藏的物品" },
      { label: "大聲挑釁", action: "對著城堡咆哮，引誘敵人出來" }
    ],
    hp: 100,
    gold: 0
  }
};

export const ASCII_TITLE = `
   GOTHIC CHRONICLES
     - VISUAL RPG -
`;

export const TRANSLATIONS = {
  en: {
    title: "Gothic Chronicles",
    subtitle: "The Black Woodcut Tales",
    desc: "Where ink meets blood, and every shadow tells a story.",
    startBtn: "Open the Book",
    health: "Health",
    gold: "Gold",
    commands: "Commands",
    noActions: "No actions available...",
    typing: "...The narrator contemplates...",
    void: "VOID",
    etching: "ETCHING...",
    systemReady: "System: Ready",
    systemRecording: "System: Recording History...",
    gameOver: "DECEASED",
    restart: "Return to Void",
    died: "You Died",
    langSwitch: "切換中文"
  },
  zh: {
    title: "哥德編年史",
    subtitle: "黑色版畫物語",
    desc: "墨水與鮮血交織之處，陰影訴說著故事。",
    startBtn: "翻開篇章",
    health: "生命",
    gold: "黃金",
    commands: "指令",
    noActions: "無行動可用...",
    typing: "（敘事者正在構思...）",
    void: "虛無",
    etching: "刻印中...",
    systemReady: "系統：就緒",
    systemRecording: "系統：記錄歷史中...",
    gameOver: "已死亡",
    restart: "回歸虛空",
    died: "你死了",
    langSwitch: "Switch to English"
  }
};