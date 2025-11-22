import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION, QUIZ_PROMPT_SUFFIX } from "../constants";
import { QuizQuestion } from "../types";

const apiKey = process.env.API_KEY || '';

// Helper to get the client instance
const getClient = () => new GoogleGenAI({ apiKey });

export const generateAnswerStream = async (
  prompt: string,
  subject: string,
  language: string,
  images: string[] = [],
  onChunk: (text: string) => void
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

  const ai = getClient();
  
  // Contextualize the prompt with strict language instruction
  const finalPrompt = `[Subject: ${subject}] [Language: ${language}] ${prompt}`;

  let modelName = 'gemini-2.5-flash';
  let config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
  };
  
  // Use gemini-3-pro-preview for text-only queries to ensure high-quality, deep reasoning.
  if (images.length === 0) {
    modelName = 'gemini-3-pro-preview';
    // Enable thinking for smarter, more reasoned responses (Google's "Good AI")
    config.thinkingConfig = { thinkingBudget: 2048 };
  } else {
    // For images, use gemini-2.5-flash which is excellent for multimodal tasks
    modelName = 'gemini-2.5-flash';
  }

  const parts: any[] = [];

  // Add images if present
  if (images.length > 0) {
    images.forEach(img => {
        const base64Data = img.split(',')[1] || img;
        parts.push({
            inlineData: {
                mimeType: 'image/jpeg', // Assuming JPEG or PNG from canvas/input
                data: base64Data
            }
        });
    });
  }
  
  parts.push({ text: finalPrompt });

  try {
    const responseStream = await ai.models.generateContentStream({
        model: modelName,
        contents: {
            role: 'user',
            parts: parts
        },
        config: config
    });

    let fullText = '';
    for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
            fullText += text;
            onChunk(fullText);
        }
    }
    return fullText;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateQuizFromText = async (content: string): Promise<QuizQuestion[]> => {
    if (!apiKey) throw new Error("API Key is missing");
    
    const ai = getClient();
    const prompt = content + QUIZ_PROMPT_SUFFIX;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = response.text;
        if (!text) return [];
        
        // Parse JSON
        const questions = JSON.parse(text) as QuizQuestion[];
        return questions;
    } catch (e) {
        console.error("Failed to generate quiz", e);
        return [];
    }
}