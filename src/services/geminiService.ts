import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

function getAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Please add it to your environment variables.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export async function translateToEnglish(text: string): Promise<string> {
  if (!text.trim()) return "";
  
  try {
    const ai = getAI();
    const model = ai.getGenerativeModel({
      model: "gemini-3-flash-preview",
    });
    
    const response = await model.generateContent(`Translate the following maintenance report description from Sinhala to English. 
      If the text is already in English, return it exactly as it is without any changes.
      Do not include any other text, just the translation or the original if it's already English.
      
      Description: ${text}`);
    
    const result = await response.response;
    return result.text()?.trim() || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Fallback to original text if translation or logic fails
  }
}
