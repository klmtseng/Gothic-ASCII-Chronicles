import { GoogleGenAI, Type } from "@google/genai";
import { StoryNode, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We keep a history buffer to maintain context
let conversationHistory: string[] = [];

export const resetGame = () => {
  conversationHistory = [];
};

export const generateNextTurn = async (previousNode: StoryNode, userAction: string, language: Language): Promise<StoryNode> => {
  const textModel = "gemini-3-flash-preview";
  const imageModel = "gemini-2.5-flash-image";
  
  // 1. Generate Narrative (Text)
  const context = `
    Current HP: ${previousNode.hp}
    Current Gold: ${previousNode.gold}
    Previous Scene: ${previousNode.description}
    Player Action: ${userAction}
  `;

  const langInstruction = language === 'zh' 
    ? "Output Language: Traditional Chinese (繁體中文). Tone: Gothic novel style, dark fantasy, serious, slightly archaic."
    : "Output Language: English. Tone: Dark, gritty, Lovecraftian.";

  const textPrompt = `
    You are a Dungeon Master for a dark fantasy Gothic adventure.
    Based on the Context below, generate the next scene.
    
    Context:
    ${context}

    Requirements:
    1. 'description': Write a short, atmospheric paragraph (max 3 sentences) describing the result of the action and the new room/situation. ${langInstruction}
    2. 'choices': Provide 3 distinct options for the player in the same language as the description.
    3. 'hp': Update player HP (subtract if they took damage, add if healed). Min 0.
    4. 'gold': Update player Gold (add if they found loot).
    
    If HP reaches 0, the description should describe a gruesome death, and choices should be empty.
  `;

  try {
    const textResponse = await ai.models.generateContent({
      model: textModel,
      contents: textPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
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

    const textData = JSON.parse(textResponse.text!);
    const newNode: StoryNode = {
        ...textData,
        imageBase64: null // Placeholder
    };

    // Update history
    conversationHistory.push(`Action: ${userAction}`);
    conversationHistory.push(`Result: ${newNode.description}`);

    // 2. Generate Illustration (Image) based on the new description
    // We keep the prompt in English for the Image model for better accuracy, even if the story is in Chinese.
    // If description is in Chinese, we might want to translate it for the prompt, but Gemini usually handles it.
    // To be safe, we prepend a style instruction.
    try {
        const imagePrompt = `
            Create a woodcut style illustration for this dark fantasy scene: "${newNode.description}".
            Style details: Black and white linocut, etching style, high contrast, thick distinct lines, gothic horror atmosphere, ink stamp texture.
            No text in the image.
        `;

        const imageResponse = await ai.models.generateContent({
            model: imageModel,
            contents: { parts: [{ text: imagePrompt }] },
        });

        for (const part of imageResponse.candidates![0].content.parts) {
            if (part.inlineData) {
                newNode.imageBase64 = part.inlineData.data;
                break;
            }
        }
    } catch (imgError) {
        console.warn("Image generation failed, proceeding with text only:", imgError);
    }

    return newNode;

  } catch (error) {
    console.error("AI Generation failed:", error);
    return {
      description: language === 'zh' ? "時間的迷霧混亂地旋轉... (AI 連線失敗)。你佇立原地。" : "The mists of time swirl confusingly... (AI Connection Failed). You stand still.",
      imageBase64: null,
      choices: [{ label: language === 'zh' ? "再試一次" : "Try again", action: userAction }],
      hp: previousNode.hp,
      gold: previousNode.gold
    };
  }
};