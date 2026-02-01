import { GoogleGenAI, Type } from "@google/genai";
import { LevelData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLevel = async (theme: string): Promise<LevelData> => {
  const modelId = "gemini-3-flash-preview";
  
  const prompt = `
    Create a 2D ASCII platformer level map.
    Theme: ${theme}.
    
    Constraints:
    - Width: 60 characters.
    - Height: 20 characters.
    - Use '#' for walls/ground.
    - Use ' ' (space) for empty air.
    - Use '^' for spikes (hazard).
    - Use '$' for coins (collectible).
    - Use 'E' for enemies.
    - Use 'X' for the exit/goal.
    - Place '@' for the player start position (must be on top of a wall).
    - Ensure the level is playable and jumpable (gaps not too wide).
    - Provide a short, 1-sentence story introduction.
    - Provide a level name.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            story: { type: Type.STRING },
            map: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["name", "story", "map"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const data = JSON.parse(text) as LevelData;
    
    // Validation cleanup: ensure map rows are uniform length
    const map = data.map.map(row => row.padEnd(60, ' ').substring(0, 60));
    
    return {
      ...data,
      map
    };
  } catch (error) {
    console.error("Level generation failed:", error);
    // Fallback simple level if AI fails
    return {
      name: "Emergency Backup",
      story: "The AI construct failed. You are in the void.",
      map: [
        "############################################################",
        "# @                                                        #",
        "####################################                       #",
        "#                                  #                       #",
        "#        ^     ^     ^             #          X            #",
        "############################################################",
        ...Array(14).fill("#                                                          #")
      ]
    };
  }
};