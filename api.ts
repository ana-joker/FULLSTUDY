import { GoogleGenAI, GenerateContentResponse, Chat, Part, Content } from "@google/genai";
import { appSettings } from "./settings";
import { showError } from "./ui";
import { currentStrings } from "./i18n";

let ai: GoogleGenAI | null = null;

export function initializeAi(apiKey: string | null): GoogleGenAI | null {
    if (apiKey) {
        try {
            const newAiInstance = new GoogleGenAI({ apiKey });
            ai = newAiInstance;
            return ai;
        } catch (error) {
            console.error("Failed to initialize AI:", error);
            ai = null;
            return null;
        }
    }
    ai = null;
    return null;
}

export function getAiInstance(): GoogleGenAI | null {
    return ai;
}

export function setAiInstance(instance: GoogleGenAI | null) {
    ai = instance;
}

export async function generateQuizContent(promptParts: Part[], schema: any): Promise<any> {
    if (!ai) {
        showError(currentStrings.apiKeyMissing);
        throw new Error(currentStrings.apiKeyMissing);
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: promptParts },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        },
    });

    return JSON.parse(response.text);
}

export async function startChatSession(history?: Content[], systemInstruction?: string, config?: any): Promise<Chat | null> {
    if (!ai) {
        showError(currentStrings.apiKeyMissing);
        return null;
    }
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
            ...config,
        },
        history: history || [],
    });
}

export async function generateTitle(text: string): Promise<string> {
    if (!ai) return text.substring(0, 30); // Fallback
    try {
        const prompt = `Based on the following user query, create a short, descriptive title (max 5 words) for this conversation. The user's query is: "${text}". Respond with only the title, nothing else.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text.trim().replace(/"/g, ''); // Clean up response
    } catch (error) {
        console.error("Title generation failed:", error);
        return text.substring(0, 30); // Fallback on error
    }
}

export async function fetchMoreResources(question: string, schema: any) {
     if (!ai) {
        showError(currentStrings.apiKeyMissing);
        throw new Error(currentStrings.apiKeyMissing);
    }
    const prompt = `
        You are a helpful research assistant. The user wants to learn more about a specific topic from a quiz question they encountered.
        Topic: "${question}"
        Your task is to find beginner-friendly resources to help them understand this topic better.
        Provide the following in a JSON format:
        1.  A very simple, easy-to-understand summary of the core concept.
        2.  2-3 links to helpful YouTube videos that explain the concept visually. Provide the video title and the full URL.
        3.  1-2 links to a relevant article (like Wikipedia or a well-known educational site) for further reading. Provide the article title and the full URL.
        The output must be a single JSON object. Do not include any text outside the JSON.
    `;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [{ text: prompt }] },
        config: { responseMimeType: "application/json", responseSchema: schema },
    });
    
    return JSON.parse(response.text);
}