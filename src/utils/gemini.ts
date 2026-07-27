import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

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

export async function analyzeImage(base64Image: string, prompt: string) {
  try {
    const result = await genAI
      .getGenerativeModel({ model: "gemini-2.5-flash" })
      .generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: "image/jpeg",
          },
        },
        prompt,
      ]);
    const text = await result.response.text();
    return text;
  } catch (error) {
    console.error("Gemini Image Analysis error:", error);
    return null;
  }
}
