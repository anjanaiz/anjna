import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function translateToEnglish(text: string): Promise<string> {
  if (!text.trim()) return "";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following maintenance report description from Sinhala to English. 
      If the text is already in English, return it exactly as it is without any changes.
      Do not include any other text, just the translation or the original if it's already English.
      
      Description: ${text}`,
    });
    
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Fallback to original text if translation fails
  }
}
