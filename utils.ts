
import { Part } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';

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


/**
 * Extracts text content from various file types (PDF, DOCX, TXT, MD).
 * @param file The file to process.
 * @returns A promise that resolves with the extracted text.
 */
export async function getDocumentText(file: File): Promise<string> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();

    if (extension === 'pdf') {
        try {
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let text = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                text += content.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
            }
            return text;
        } catch (error) {
            console.error("Error parsing PDF:", error);
            throw new Error("Failed to parse PDF. It may be corrupted or encrypted.");
        }
    } else if (extension === 'docx') {
        try {
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        } catch (error) {
            console.error("Error parsing DOCX:", error);
            throw new Error("Failed to parse DOCX file. It might be corrupted.");
        }
    } else { // Handles .txt, .md, and other text-based files
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }
}

/**
 * Estimates the number of tokens in a set of Gemini API parts.
 * A very rough estimation, assuming ~4 characters per token for text.
 * Images are given a fixed high cost.
 * @param parts An array of `Part` objects.
 * @returns An estimated token count.
 */
export function estimateTokens(parts: Part[]): number {
    let tokenCount = 0;
    const CHARS_PER_TOKEN = 4;
    const TOKENS_PER_IMAGE = 258; // A fixed estimate for image tokens

    for (const part of parts) {
        if ('text' in part && typeof part.text === 'string') {
            tokenCount += Math.ceil(part.text.length / CHARS_PER_TOKEN);
        } else if ('inlineData' in part) {
            // This is an image or other data
            tokenCount += TOKENS_PER_IMAGE;
        }
    }
    return tokenCount;
}