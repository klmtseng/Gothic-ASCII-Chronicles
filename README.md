# Gothic ASCII Chronicles

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-v19-61DAFB.svg)
![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2.svg)

**Gothic ASCII Chronicles** is a browser-based action platformer that blends retro text-based aesthetics with modern web technologies. Players guide a lone wanderer through procedurally generated dungeons, rendered entirely using standard ASCII and Unicode characters.

## 🎮 Features

*   **Distinct Visual Style**: High-fidelity text rendering using Gothic unicode symbols (`▓`, `Å`, `Ψ`, `†`) styled with TailwindCSS for lighting and atmosphere.
*   **Infinite Replayability**: Integrated with **Google Gemini API** to generate unique level layouts and story snippets based on user-defined themes (e.g., "Ice Cavern", "Volcano").
*   **Adaptive Control Engine**:
    *   **Desktop**: Full-screen immersion with Keyboard controls (`WASD` / `Arrows`).
    *   **Mobile**: Touch-optimized interface with a custom-rendered virtual analog stick and action buttons.
*   **Physics System**: Custom AABB collision detection, velocity-based movement, and momentum physics running on a 30 FPS fixed timestep.

## 🕹️ Controls

| Action | Desktop (Keyboard) | Mobile (Touch) |
| :--- | :--- | :--- |
| **Move** | `Arrow Keys` or `WASD` | Virtual Joystick |
| **Jump** | `Space`, `W`, or `Up` | **( * )** Button |
| **Crouch** | `S` or `Down` | **( / )** Button |
| **Interact** | `E` | **( + )** Button |

## 🛠️ Technical Overview

### Rendering
The game does not use Canvas API for rendering entities. Instead, it uses a reactive grid of `<span>` elements. This allows for easy styling via CSS classes (color, text-shadow, animations) directly on individual "pixels" (characters).

### Device Detection
The app utilizes a custom `useEffect` hook to detect input capabilities (`pointer: coarse`) and screen width.
*   **Desktop Mode**: Hides on-screen controls, scales text larger for monitors.
*   **Mobile Mode**: Enables touch listeners and renders the floating UI.

### AI Generation
Level data is fetched from Google Gemini using a strict JSON schema to ensure playable geometry (walls, enemies, coins, and spawn points) is generated consistently.

## 🚀 Development Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/gothic-ascii-chronicles.git
    cd gothic-ascii-chronicles
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure API Key**
    Create a `.env` file in the root directory:
    ```env
    API_KEY=your_google_gemini_api_key
    ```

4.  **Start the server**
    ```bash
    npm start
    ```

## 📜 License

MIT License. See [LICENSE](LICENSE) for details.
