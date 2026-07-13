import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODELO = "gemini-2.5-flash";

export async function perguntarGemini(
  prompt: string,
  instrucaoSistema?: string
): Promise<string> {
  const resposta = await ai.models.generateContent({
    model: MODELO,
    contents: prompt,
    config: instrucaoSistema ? { systemInstruction: instrucaoSistema } : undefined,
  });
  return resposta.text ?? "";
}

export async function perguntarGeminiJSON<T>(
  prompt: string,
  instrucaoSistema: string,
  schema: object
): Promise<T> {
  const resposta = await ai.models.generateContent({
    model: MODELO,
    contents: prompt,
    config: {
      systemInstruction: instrucaoSistema,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });
  return JSON.parse(resposta.text ?? "{}") as T;
}
