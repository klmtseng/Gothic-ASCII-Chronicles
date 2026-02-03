import { GoogleGenAI, Type } from "@google/genai";
import { StoryNode } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We keep a history buffer to maintain context
let conversationHistory: string[] = [];

export const resetGame = () => {
  conversationHistory = [];
};

export const generateNextTurn = async (previousNode: StoryNode, userAction: string): Promise<StoryNode> => {
  const modelId = "gemini-3-flash-preview";
  
  // Construct context
  const context = `
    Current HP: ${previousNode.hp}
    Current Gold: ${previousNode.gold}
    Previous Scene: ${previousNode.description}
    Player Action: ${userAction}
  `;

  const prompt = `
    You are a Dungeon Master for a dark fantasy Gothic text adventure.
    Based on the Context below, generate the next scene.
    
    Context:
    ${context}

    Requirements:
    1. 'description': Write a short, atmospheric paragraph (max 3 sentences) describing the result of the action and the new room/situation. Tone: Dark, gritty, Lovecraftian.
    2. 'asciiArt': Generate a purely visual ASCII art block (max 50 chars wide, 15 lines high) representing the CURRENT scene (e.g., a monster, a chest, a hallway, a ruin). Do NOT use text inside the art. Use characters like #, /, \\, ., @, etc.
    3. 'choices': Provide 3 distinct options for the player.
    4. 'hp': Update player HP (subtract if they took damage, add if healed). Min 0.
    5. 'gold': Update player Gold (add if they found loot).
    
    If HP reaches 0, the description should describe a gruesome death, and choices should be empty.
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
            description: { type: Type.STRING },
            asciiArt: { type: Type.STRING },
            hp: { type: Type.INTEGER },
            gold: { type: Type.INTEGER },
            choices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  action: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const data = JSON.parse(text) as StoryNode;
    
    // Update history for next turn
    conversationHistory.push(`Action: ${userAction}`);
    conversationHistory.push(`Result: ${data.description}`);

    return data;

  } catch (error) {
    console.error("AI Generation failed:", error);
    return {
      description: "The mists of time swirl confusingly... (AI Connection Failed). You stand still.",
      asciiArt: previousNode.asciiArt,
      choices: [{ label: "Try again", action: userAction }],
      hp: previousNode.hp,
      gold: previousNode.gold
    };
  }
};
