# Gothic ASCII Chronicles: Text Adventure

![Genre](https://img.shields.io/badge/Genre-Text%20Adventure-red.svg)
![AI](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2.svg)

**Gothic ASCII Chronicles** is an interactive fiction game where the world is generated in real-time by Artificial Intelligence. 

Instead of jumping on platforms, you choose your path through a dark, procedurally generated narrative. The AI acts as your "Dungeon Master," describing the scene, tracking your health and gold, and illustrating the world with ASCII art on the fly.

## 📖 Features

*   **AI Dungeon Master**: Powered by **Google Gemini 3 Flash**, generating descriptive Gothic horror text and consistent storytelling.
*   **Procedural ASCII Art**: Every scene includes a unique AI-generated ASCII illustration representing monsters, loot, or landscapes.
*   **Role-Playing Elements**: Tracks **HP** and **Gold**. Combat results and looting are calculated by the AI based on your choices.
*   **Responsive UI**: A chat-like terminal interface that works perfectly on Desktop and Mobile.

## 🕹️ How to Play

1.  Read the scene description and look at the ASCII art.
2.  Choose one of the 3 actions provided at the bottom of the screen.
3.  Watch the consequences unfold in the log.
4.  Survive as long as possible and amass gold.

## 🛠️ Technical Overview

*   **Engine**: React 19 + TypeScript.
*   **State Management**: Tracks a linear history of `StoryNodes` (description + art + state).
*   **AI Integration**: Sends the previous turn's context to Gemini to ensure continuity in the narrative.

## 🚀 Development Setup

1.  **Clone & Install**:
    ```bash
    git clone ...
    npm install
    ```

2.  **API Key**:
    Create `.env` with `API_KEY=your_gemini_key`.

3.  **Run**:
    ```bash
    npm start
    ```

## 📜 License

MIT License.
