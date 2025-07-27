
import { Part } from "@google/genai";

/**
 * Shuffles an array in place.
 * @param array The array to shuffle.
 * @returns The shuffled array.
 */
export function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Reads a File object and converts it to a Data URL (Base64 string).
 * @param file The file to read.
 * @returns A promise that resolves with the data URL.
 */
export function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

/**
 * Converts a File object into a GenerativePart suitable for the Gemini API.
 * @param file The file to convert.
 * @returns A promise that resolves with a `Part` object.
 */
export async function fileToGenerativePart(file: File): Promise<Part> {
    const base64Data = await readFileAsDataURL(file);
    return {
        inlineData: {
            mimeType: file.type,
            data: base64Data.split(',')[1],
        },
    };
}
