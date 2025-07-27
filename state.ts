import { Part } from "@google/genai";

// --- QUIZ STATE ---
export type UserAnswer = { 
    questionIndex: number; 
    userAnswer: any; 
    isCorrect: boolean; 
};

export type QuizState = {
    quizData: any[];
    userAnswers: UserAnswer[];
    quizTitle: string;
    currentPageId: string;
    selectedImageFile?: string;
    currentQuestionIndex: number;
    startTime?: number;
    summary: string | null;
};

export type QuizContext = {
    prompt: string;
    file: File | null;
    image: File | null;
    subject: string;
};

export type QuizHistoryEntry = {
    title: string;
    score: number;
    total: number;
    percentage: string;
    date: string;
    mode: 'Learning';
    quizData: any[];
    timeTaken: string;
};

// --- SPACED REPETITION STATE ---
export type RecallItem = {
    id: number;
    questionData: any;
    nextReviewDate: number;
    interval: number; // in days
    easeFactor: number;
};

// --- CHAT STATE ---
export interface ChatMessage {
    id: number; // Unique ID for the message
    role: 'user' | 'model';
    parts: Part[];
    text: string;
    timestamp?: string;
    files?: { name: string, type: string, url: string }[];
}

export interface ChatSession {
    id: string; // Unique ID for the session
    title: string;
    history: ChatMessage[];
    systemInstruction?: string;
    lastUpdated: number;
    isPinned: boolean;
}