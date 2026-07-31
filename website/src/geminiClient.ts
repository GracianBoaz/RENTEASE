import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY ?? "";

const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export async function askGemini(prompt: string): Promise<string | null> {
  try {
    const result = await geminiModel.generateContent(prompt);
    const text = await result.response.text();
    return text;
  } catch (error) {
    console.error("Gemini API error:", error);
    return null;
  }
}
