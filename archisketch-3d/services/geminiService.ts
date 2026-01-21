
import { GoogleGenAI, Type } from "@google/genai";
import { SceneData } from "../types";

/**
 * Utility to retry a function call with exponential backoff.
 * Primarily used to handle transient 503 (overloaded) or 429 (rate limit) errors.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const status = err.status || (err.message?.match(/\b(503|429)\b/) ? parseInt(err.message.match(/\b(503|429)\b/)[0]) : null);
      const isRetryable = status === 503 || status === 429 ||
        err.message?.toLowerCase().includes("overloaded") ||
        err.message?.toLowerCase().includes("unavailable");

      if (isRetryable && i < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s... with jitter
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.warn(`Gemini API busy (attempt ${i + 1}). Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/**
 * Transforms a base64 encoded layout image into structured 3D scene data.
 */
export const transformLayoutTo3D = async (imageB64: string, mimeType: string): Promise<SceneData> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          inlineData: {
            data: imageB64,
            mimeType: mimeType,
          },
        },
        {
          text: "Analyze the provided floor plan and return a 3D scene representation in the specified JSON format."
        }
      ],
      config: {
        systemInstruction: `You are an expert architectural visualizer. 
Task: Convert the provided 2D floor plan, sketch, or layout into a structured 3D scene representation.
Instructions:
1. Identify all primary walls, windows, and doors.
2. Use a normalized coordinate system (0 to 10) for spatial placement.
3. Identify major furniture pieces.
4. Determine appropriate floor and wall colors.
5. Return strictly valid JSON matching the provided schema.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            walls: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  start: {
                    type: Type.OBJECT,
                    properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } }
                  },
                  end: {
                    type: Type.OBJECT,
                    properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } }
                  },
                  height: { type: Type.NUMBER },
                  thickness: { type: Type.NUMBER },
                  type: { type: Type.STRING, description: "One of: wall, window, door" }
                },
                required: ["id", "start", "end", "height", "thickness", "type"]
              }
            },
            furniture: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, description: "e.g., chair, table, sofa, bed" },
                  position: {
                    type: Type.OBJECT,
                    properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } }
                  },
                  rotation: { type: Type.NUMBER },
                  scale: { type: Type.ARRAY, items: { type: Type.NUMBER } }
                },
                required: ["id", "type", "position", "rotation", "scale"]
              }
            },
            floorColor: { type: Type.STRING },
            wallColor: { type: Type.STRING }
          },
          required: ["walls", "furniture", "floorColor", "wallColor"]
        }
      }
    });

    const output = response.text;
    if (!output) throw new Error("The AI model returned an empty response.");
    return JSON.parse(output.trim()) as SceneData;
  });
};

/**
 * Edits a layout image based on a user text prompt using the Nano Banana image model.
 */
export const editLayoutImage = async (imageB64: string, mimeType: string, prompt: string): Promise<string> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [
          { inlineData: { data: imageB64, mimeType: mimeType } },
          { text: prompt },
        ],
      },
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image was generated by the model.");
  });
};
