

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, Part } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';

// --- INTERNATIONALIZATION (i18n) STRINGS ---
const uiStrings = {
    generateQuiz: "Generate Quiz",
    generateDifferentQuiz: "Generate Different Quiz",
    startQuiz: "Start Quiz",
    submitAnswer: "Submit Answer",
    nextQuestion: "Next Question",
    finishQuiz: "Finish Quiz",
    reviewAnswers: "Review Answers",
    retakeQuiz: "Retake Quiz",
    createNewQuiz: "Create New Quiz",
    backToResults: "Back to Results",
    backToCreator: "Create a New Quiz",
    landingMessage: "Welcome! Test your knowledge. Click the button below to start.",
    resultsHeader: "Quiz Results",
    resultsScoreLabel: "Your Score:",
    resultsPercentageLabel: "Percentage:",
    reviewHeader: "Review Your Answers",
    resumeHeader: "Resume Quiz?",
    resumeText: "We found a quiz in progress. Would you like to resume where you left off?",
    resumeYes: "Yes, Resume",
    resumeNo: "No, Start New",
    passMessage: "Congratulations! You passed the quiz and demonstrated a great understanding of the material.",
    failMessage: "Don't worry, practice makes perfect. Review the explanations and try again to solidify your understanding.",
    quizHistory: "Quiz History",
    historyHeader: "Your Quiz History",
    noHistory: "You haven't completed any quizzes yet. Generate a new one to get started!",
    showExplanation: "Show Explanation",
    hideExplanation: "Hide Explanation",
    correct: "Correct!",
    incorrect: "Incorrect",
    settings: "Settings",
    fontSize: "Font Size",
    small: "Small",
    medium: "Medium",
    large: "Large",
    close: "Close",
    numQuestions: "Number of Questions",
    difficulty: "Difficulty",
    easy: "Easy",
    mediumDifficulty: "Medium",
    hard: "Hard",
    mixed: "Mixed",
    knowledgeLevel: "Your Knowledge Level",
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    learningGoal: "Your Learning Goal",
    understandConcepts: "Understand Concepts",
    applyInfo: "Apply Information",
    learning: "Learning",
    questionTypes: "Question Types",
    qMcq: "Multiple Choice",
    qTf: "True/False",
    qSa: "Short Answer",
    qOrd: "Ordering",
    qMatch: "Matching",
    quizLanguage: "Quiz Language",
    summaryHeader: "Summary to Get You Started",
    addToRecall: "🧠 Add to Smart Recall",
    addedToRecall: "✅ Added",
    recallHeader: "Smart Recall",
    showAnswer: "Show Answer",
    recallForgot: "Forgot",
    recallGood: "Good",
    recallEasy: "Easy",
    recallCompleteHeader: "All done for now!",
    recallCompleteText: "You've reviewed all your due cards. Come back later to keep your memory sharp.",
    learnMore: "افهم ده أكتر", // "Understand this more"
    learnMoreHeader: "Learn More",
    resourceSummary: "Summary",
    resourceVideos: "Helpful Videos",
    resourceArticles: "Further Reading",
    cancel: "Cancel",
    exportForAnki: "Export for Anki",
};


// --- DOM ELEMENT SELECTORS ---
const mainContainer = document.querySelector('.main-container') as HTMLDivElement;
const promptInput = document.getElementById('prompt-input') as HTMLTextAreaElement;
const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
const loaderContainer = document.getElementById('loader-container') as HTMLDivElement;
const loader = document.getElementById('loader') as HTMLDivElement;
const cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement;
const errorMessage = document.getElementById('error-message') as HTMLParagraphElement;
const promptContainer = document.querySelector('.prompt-container') as HTMLDivElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const fileNameDisplay = document.getElementById('file-name-display') as HTMLDivElement;
const fileNameSpan = document.getElementById('file-name') as HTMLSpanElement;
const removeFileBtn = document.getElementById('remove-file-btn') as HTMLButtonElement;
const imageInput = document.getElementById('image-input') as HTMLInputElement;
const imageNameDisplay = document.getElementById('image-name-display') as HTMLDivElement;
const imageNameSpan = document.getElementById('image-name') as HTMLSpanElement;
const removeImageBtn = document.getElementById('remove-image-btn') as HTMLButtonElement;
const appContainer = document.getElementById('app-container') as HTMLDivElement;
const landingPage = document.getElementById('landing-page') as HTMLDivElement;
const quizPage = document.getElementById('quiz-page') as HTMLDivElement;
const resultsPage = document.getElementById('results-page') as HTMLDivElement;
const reviewPage = document.getElementById('review-page') as HTMLDivElement;
const historyPage = document.getElementById('history-page') as HTMLDivElement;
const quizTitle = document.getElementById('quiz-title') as HTMLHeadingElement;
const landingMessage = document.getElementById('landing-message') as HTMLParagraphElement;
const startQuizBtn = document.getElementById('start-quiz-btn') as HTMLButtonElement;
const reviewAnswersBtn = document.getElementById('review-answers-btn') as HTMLButtonElement;
const retakeQuizBtn = document.getElementById('retake-quiz-btn') as HTMLButtonElement;
const generateDifferentQuizBtn = document.getElementById('generate-different-quiz-btn') as HTMLButtonElement;
const newQuizBtn = document.getElementById('new-quiz-btn') as HTMLButtonElement;
const generateDifferentQuizBtnFromReview = document.getElementById('generate-different-quiz-btn-from-review') as HTMLButtonElement;
const newQuizBtnFromReview = document.getElementById('new-quiz-btn-from-review') as HTMLButtonElement;
const backToResultsBtn = document.getElementById('back-to-results-btn') as HTMLButtonElement;
const backToCreatorBtn = document.getElementById('back-to-creator-btn') as HTMLButtonElement;
const quizHistoryBtn = document.getElementById('quiz-history-btn') as HTMLButtonElement;
const questionsContainer = document.getElementById('questions-container') as HTMLDivElement;
const quizNavContainer = document.getElementById('quiz-nav-container') as HTMLDivElement;
const scoreSpan = document.getElementById('score') as HTMLSpanElement;
const totalQuestionsSpan = document.getElementById('total-questions') as HTMLSpanElement;
const percentageSpan = document.getElementById('percentage') as HTMLSpanElement;
const studyAdvice = document.getElementById('study-advice') as HTMLParagraphElement;
const reviewContainer = document.getElementById('review-container') as HTMLDivElement;
const progressBar = document.getElementById('progress-bar') as HTMLDivElement;
const historyContainer = document.getElementById('history-container') as HTMLDivElement;
const historyHeader = document.getElementById('history-header') as HTMLHeadingElement;
const resultsHeader = document.getElementById('results-header') as HTMLHeadingElement;
const resultsScoreLabel = document.getElementById('results-score-label') as HTMLSpanElement;
const resultsPercentageLabel = document.getElementById('results-percentage-label') as HTMLSpanElement;
const reviewHeader = document.getElementById('review-header') as HTMLHeadingElement;
const resumePromptContainer = document.getElementById('resume-prompt-container') as HTMLDivElement;
const resumeHeaderEl = document.getElementById('resume-header') as HTMLHeadingElement;
const resumeText = document.getElementById('resume-text') as HTMLParagraphElement;
const resumeYesBtn = document.getElementById('resume-yes-btn') as HTMLButtonElement;
const resumeNoBtn = document.getElementById('resume-no-btn') as HTMLButtonElement;
const numQuestionsInput = document.getElementById('num-questions-input') as HTMLInputElement;
const numQuestionsLabel = document.getElementById('num-questions-label') as HTMLLabelElement;
const difficultyLabel = document.getElementById('difficulty-label') as HTMLLabelElement;
const difficultySelector = document.querySelector('.difficulty-selector') as HTMLDivElement;
const knowledgeLevelLabel = document.getElementById('knowledge-level-label') as HTMLLabelElement;
const learningGoalLabel = document.getElementById('learning-goal-label') as HTMLLabelElement;
const settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement;
const settingsModal = document.getElementById('settings-modal') as HTMLDivElement;
const settingsCloseBtn = document.getElementById('settings-close-btn') as HTMLButtonElement;
const fontSizeSelector = document.getElementById('font-size-selector') as HTMLDivElement;
const settingsHeader = document.getElementById('settings-header') as HTMLHeadingElement;
const fontSizeLabel = document.getElementById('font-size-label') as HTMLLabelElement;
const questionTypesLabel = document.getElementById('question-types-label') as HTMLLabelElement;
const subjectInput = document.getElementById('subject-input') as HTMLInputElement;
const explanationLangSelector = document.getElementById('explanation-lang-selector') as HTMLDivElement;
const timerEl = document.getElementById('timer') as HTMLSpanElement;
const timeTakenEl = document.getElementById('time-taken') as HTMLSpanElement;
const preQuizSummaryContainer = document.getElementById('pre-quiz-summary-container') as HTMLDivElement;
const summaryContent = document.getElementById('summary-content') as HTMLDivElement;
const quizLangSelector = document.getElementById('quiz-lang-selector') as HTMLDivElement;
const quizLangLabel = document.getElementById('quiz-lang-label') as HTMLLabelElement;
const exportAnkiBtn = document.getElementById('export-anki-btn') as HTMLButtonElement;

// Spaced Repetition Selectors
const recallHubBtn = document.getElementById('recall-hub-btn') as HTMLButtonElement;
const recallCountBadge = document.getElementById('recall-count-badge') as HTMLSpanElement;
const spacedRepetitionPage = document.getElementById('spaced-repetition-page') as HTMLDivElement;
const recallSessionContainer = document.getElementById('recall-session-container') as HTMLDivElement;
const recallProgressEl = document.getElementById('recall-progress') as HTMLDivElement;
const recallQuestion = document.getElementById('recall-question') as HTMLDivElement;
const recallAnswer = document.getElementById('recall-answer') as HTMLDivElement;
const recallNavContainer = document.getElementById('recall-nav-container') as HTMLDivElement;
const recallShowAnswerBtn = document.getElementById('recall-show-answer-btn') as HTMLButtonElement;
const recallFeedbackBtns = document.getElementById('recall-feedback-btns') as HTMLDivElement;
const recallForgotBtn = document.getElementById('recall-forgot-btn') as HTMLButtonElement;
const recallGoodBtn = document.getElementById('recall-good-btn') as HTMLButtonElement;
const recallEasyBtn = document.getElementById('recall-easy-btn') as HTMLButtonElement;
const recallCompleteMessage = document.getElementById('recall-complete-message') as HTMLDivElement;
const recallBackToCreatorBtn = document.getElementById('recall-back-to-creator-btn') as HTMLButtonElement;

// Learn More Selectors
const learnMoreModal = document.getElementById('learn-more-modal') as HTMLDivElement;
const learnMoreHeader = document.getElementById('learn-more-header') as HTMLHeadingElement;
const learnMoreLoader = document.getElementById('learn-more-loader') as HTMLDivElement;
const learnMoreError = document.getElementById('learn-more-error') as HTMLParagraphElement;
const learnMoreContent = document.getElementById('learn-more-content') as HTMLDivElement;
const learnMoreCloseBtn = document.getElementById('learn-more-close-btn') as HTMLButtonElement;


// --- STATE MANAGEMENT ---
type UserAnswer = { questionIndex: number; userAnswer: any; isCorrect: boolean; };
type QuizState = {
    quizData: any[];
    userAnswers: UserAnswer[];
    quizTitle: string;
    currentPageId: string;
    selectedImageFile?: string;
    currentQuestionIndex: number;
    startTime?: number;
    summary: string | null;
};
type QuizContext = {
    prompt: string;
    file: File | null;
    image: File | null;
    subject: string;
};
type QuizHistoryEntry = {
    title: string;
    score: number;
    total: number;
    percentage: string;
    date: string;
    mode: 'Learning';
    quizData: any[];
    timeTaken: string;
};
type RecallItem = {
    id: number;
    questionData: any;
    nextReviewDate: number;
    interval: number; // in days
    easeFactor: number;
};


let quizData: any[] = [];
let userAnswers: UserAnswer[] = [];
let quizSummary: string | null = null;
let currentQuestionIndex = 0;
let currentCaseDescription: string | null = null;
let selectedFile: File | null = null;
let selectedImageFile: File | null = null;
let initialContext: QuizContext | null = null;
let selectedDifficulty = 'Mixed';
let selectedExplanationLang = 'Arabic';
let selectedQuizLang = 'English';
let timerInterval: number | null = null;
let startTime: number | null = null;
let dueRecallItems: RecallItem[] = [];
let currentRecallIndex = 0;
let isGenerationCancelled = false;
const passPercentageThreshold = 60;
const LOCAL_STORAGE_KEY = 'interactiveQuizState';
const HISTORY_STORAGE_KEY = 'interactiveQuizHistory';
const FONT_SIZE_KEY = 'interactiveQuizFontSize';
const RECALL_STORAGE_KEY = 'interactiveQuizRecallDeck';

// --- API & LIBRARY INITIALIZATION ---
let ai: GoogleGenAI;
try {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
} catch (error) {
    console.error(error);
    showError("Failed to initialize AI. Please ensure the API key is set correctly.");
}

declare global { interface Window { pdfjsWorker: string; } }
pdfjsLib.GlobalWorkerOptions.workerSrc = window.pdfjsWorker;

// --- STATE PERSISTENCE ---

/**
 * Saves the current quiz state to localStorage.
 */
async function saveState() {
    if (!quizData || quizData.length === 0) return;

    const activePage = document.querySelector('.page.active');
    const state: QuizState = {
        quizData: quizData,
        userAnswers: userAnswers,
        quizTitle: quizTitle.textContent || '',
        currentPageId: activePage ? activePage.id : 'landing-page',
        currentQuestionIndex: currentQuestionIndex,
        startTime: startTime || undefined,
        summary: quizSummary,
    };

    if (selectedImageFile) {
        state.selectedImageFile = await readFileAsDataURL(selectedImageFile);
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
}

function loadState(): QuizState | null {
    const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    return savedState ? JSON.parse(savedState) : null;
}

function clearState() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    startTime = null;
    quizSummary = null;
}

async function resumeQuiz(state: QuizState) {
    quizData = state.quizData;
    userAnswers = state.userAnswers;
    currentQuestionIndex = state.currentQuestionIndex || 0;
    startTime = state.startTime || null;
    quizSummary = state.summary || null;

    if (quizSummary) {
        summaryContent.innerHTML = quizSummary.replace(/\n/g, '<br>');
        preQuizSummaryContainer.style.display = 'block';
    }

    if (state.selectedImageFile) {
        const response = await fetch(state.selectedImageFile);
        const blob = await response.blob();
        selectedImageFile = new File([blob], "resumed-image", { type: blob.type });
    } else {
        selectedImageFile = null;
    }

    setupQuiz(state.quizTitle);

    if (state.currentPageId === 'quiz-page') {
        if(startTime && !timerInterval) {
            timerInterval = window.setInterval(updateTimerDisplay, 1000);
        }
        displayCurrentQuestion();
        showPage(quizPage);
    } else if (state.currentPageId === 'results-page') {
        const score = userAnswers.filter(a => a.isCorrect).length;
        displayResults(score);
    } else if (state.currentPageId === 'review-page') {
        displayReview();
    } else {
        showPage(landingPage);
    }
}

function saveQuizResultToHistory(score: number) {
    const total = quizData.length;
    if (total === 0) return;

    const percentage = ((score / total) * 100).toFixed(1);
    const history: QuizHistoryEntry[] = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
    const newEntry: QuizHistoryEntry = {
        title: quizTitle.textContent || 'Untitled Quiz',
        score: score,
        total: total,
        percentage: percentage,
        date: new Date().toLocaleString(),
        mode: 'Learning',
        quizData: quizData,
        timeTaken: timeTakenEl.textContent || 'N/A',
    };
    history.unshift(newEntry);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}


// --- CORE FUNCTIONS ---
function showError(message: string) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    loaderContainer.style.display = 'none';
    generateBtn.style.display = 'block';
    generateBtn.disabled = false;
    generateDifferentQuizBtn.disabled = false;
    generateDifferentQuizBtnFromReview.disabled = false;
}

function hideError() {
    errorMessage.style.display = 'none';
}

async function getDocumentText(file: File): Promise<string> {
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
    } else {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }
}

function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

async function fileToGenerativePart(file: File): Promise<Part> {
    const dataUrl = await readFileAsDataURL(file);
    const base64Data = dataUrl.split(',')[1];
    return {
        inlineData: { mimeType: file.type, data: base64Data },
    };
}

async function generateQuiz(isVariation = false) {
    let currentPrompt: string;
    let currentFile: File | null;
    let currentImage: File | null;
    let currentSubject: string;

    isGenerationCancelled = false;

    if (isVariation) {
        if (!initialContext) {
            showError("No initial context found to generate a variation. Please create a new quiz first.");
            return;
        }
        currentPrompt = initialContext.prompt;
        currentFile = initialContext.file;
        currentImage = initialContext.image;
        currentSubject = initialContext.subject;
    } else {
        currentPrompt = promptInput.value.trim();
        currentFile = selectedFile;
        currentImage = selectedImageFile;
        currentSubject = subjectInput.value.trim();
        initialContext = { prompt: currentPrompt, file: currentFile, image: currentImage, subject: currentSubject };
    }

    if (!currentPrompt && !currentFile && !currentImage) {
        showError("Please enter a description, upload a document, or upload an image.");
        return;
    }
    if (!ai) {
        showError("AI client is not available.");
        return;
    }

    hideError();
    clearState();
    loaderContainer.style.display = 'flex';
    generateBtn.style.display = 'none';
    generateBtn.disabled = true;
    generateDifferentQuizBtn.disabled = true;
    generateDifferentQuizBtnFromReview.disabled = true;
    appContainer.style.display = 'none';
    promptContainer.style.display = 'flex';

    const numQuestions = numQuestionsInput.value || '5';
    const difficulty = selectedDifficulty;
    const knowledgeLevel = (document.querySelector('input[name="knowledge-level"]:checked') as HTMLInputElement)?.value || 'Beginner';
    const learningGoal = (document.querySelector('input[name="learning-goal"]:checked') as HTMLInputElement)?.value || 'Understand Concepts';
    const selectedTypesCheckboxes = document.querySelectorAll('#question-types-selector input[type="checkbox"]:checked');
    let selectedQuestionTypes = Array.from(selectedTypesCheckboxes).map(cb => (cb as HTMLInputElement).value);

    const allQuestionTypes = ['MCQ', 'TrueFalse', 'ShortAnswer', 'Ordering', 'Matching'];
    if (selectedQuestionTypes.length === 0) {
        selectedQuestionTypes = allQuestionTypes;
    }

    const baseSchemaProperties = {
        quizTitle: { type: Type.STRING, description: `A creative and relevant title for the quiz in ${selectedQuizLang}.` },
        quizData: {
            type: Type.ARRAY,
            description: `An array of ${numQuestions} quiz question objects, with a mix of types.`,
            items: {
                type: Type.OBJECT,
                properties: {
                    questionType: { type: Type.STRING, description: "Type of question. Must be one of the selected types.", enum: selectedQuestionTypes },
                    question: { type: Type.STRING, description: `The question text, in ${selectedQuizLang}.` },
                    options: {
                        type: Type.ARRAY,
                        description: `Array of items in ${selectedQuizLang}. For 'MCQ' (3-5 options), 'TrueFalse' (must be ['True', 'False']), 'Ordering' (items to be ordered), 'Matching' (prompts to be matched). Empty for 'ShortAnswer'.`,
                        items: { type: Type.STRING }
                    },
                    matchOptions: {
                        type: Type.ARRAY,
                        description: `Required only for 'Matching' questionType. An array of the corresponding items in ${selectedQuizLang} to be matched against the 'options' array.`,
                        items: { type: Type.STRING }
                    },
                    correctAnswer: {
                        description: `The correct answer. For 'MCQ'/'TrueFalse'/'ShortAnswer', this is a STRING. For 'Ordering', this is an ARRAY of strings in the correct order. For 'Matching', this is an ARRAY of objects, where each object is a {prompt, answer} pair. All text must be in ${selectedQuizLang}.`,
                        oneOf: [ { type: Type.STRING }, { type: Type.ARRAY, items: { type: Type.STRING } }, { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, answer: { type: Type.STRING } }, required: ["prompt", "answer"] } } ]
                    },
                    explanation: { type: Type.STRING, description: `Detailed, multi-part explanation IN ${selectedExplanationLang} following the protocol (simple why, practical example, key takeaway).` },
                    caseDescription: { type: Type.STRING, description: `Optional: A case study, scenario, or context for the question, in ${selectedQuizLang}.` },
                    refersToUploadedImage: { type: Type.BOOLEAN, description: "Optional: Set true if the question is about the uploaded image." }
                },
                required: ["questionType", "question", "options", "correctAnswer", "explanation"]
            }
        }
    };

    let schema: any = { type: Type.OBJECT, properties: baseSchemaProperties, required: ["quizTitle", "quizData"] };
    let summaryInstruction = '';

    if (learningGoal === 'Learning') {
        schema = {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING, description: "A simple, clear summary of the content for a 14-year-old, including a real-life example, written in simple Arabic." },
                ...baseSchemaProperties
            },
            required: ["summary", "quizTitle", "quizData"]
        };
        summaryInstruction = `
# LEARNING MODE PROTOCOL (Conditional)
Since the user's Learning Goal is 'Learning', you MUST FIRST generate a 'summary' of the content.
- **Audience:** Write this summary as if you are explaining it to a curious 14-year-old.
- **Language:** The summary must be in simple, clear Arabic.
- **Core Idea:** Focus on the main concept or purpose of the document.
- **Example:** You MUST include a simple, practical, real-life example to make the concept tangible.
- **Placement:** The summary should be placed in the 'summary' field of the final JSON object.
AFTER generating the summary, proceed to generate the quiz as described below. Questions for 'Learning' mode should be direct and clear to reinforce the summary.`;
    }

    try {
        const fileContent = currentFile ? await getDocumentText(currentFile) : null;
        const generationPrompt = `
# Persona & Mission
You are "The Explainer and Tester Maestro," a world-class personal tutor. Your mission is to transform testing into an immersive, unforgettable learning journey for your user, who has a strong photographic memory. Every interaction must aim to build deep, interconnected knowledge and lasting understanding. Every mistake is a golden opportunity for learning.

${summaryInstruction}

# Quiz Generation Instructions
Based on the user's request and any provided document/image, create a compelling and educational quiz.
- **User's State:** Knowledge Level: '${knowledgeLevel}', Learning Goal: '${learningGoal}'.
- **Quiz Structure:** Generate exactly ${numQuestions} questions with a difficulty level of '${difficulty}'.
- **Quiz Language (Questions & Options):** ${selectedQuizLang}. The quiz title, questions, options, and correct answers MUST be in this language.
- **Subject:** The quiz should be about '${currentSubject || 'the provided content'}'.
- **Question Variety:** IMPORTANT: You MUST ONLY generate questions from the following types: [${selectedQuestionTypes.join(', ')}]. For scenario-based or application questions, use the 'caseDescription' field to provide a rich context before the question. For MCQs, design distractors that are plausible but subtly incorrect, targeting common misconceptions.

# THE GOLDEN RULE: Explanation Protocol (Language: ${selectedExplanationLang})
This is the most critical part of your task. For EVERY question, the 'explanation' field MUST be in **${selectedExplanationLang}**. The explanation must be extremely simple, as if for a complete beginner, and must include a practical, real-life example. Follow these steps:
1.  **Explain the "Why" (in ${selectedExplanationLang}):**
    -   In simple ${selectedExplanationLang}, clearly explain *why* the correct answer is right.
    -   In simple ${selectedExplanationLang}, also explain *why* the other options are wrong. This is very important for learning.
2.  **Practical, Real-Life Example (in ${selectedExplanationLang}):**
    -   Provide a very simple, practical example from everyday life that makes the idea easy to understand. Start it with "**مثال عملي:**" if the language is Arabic, or "**Practical Example:**" if English.
3.  **The "Key Takeaway" (in ${selectedExplanationLang}):**
    -   Conclude the explanation with a single, memorable sentence that summarizes the main point. Start it with "**الخلاصة:**" if the language is Arabic, or "**Key Takeaway:**" if English.

# User's Input
${isVariation ? `\n\nIMPORTANT: This is a request for a new, different quiz based on the same source material. DO NOT repeat questions from the previous quiz. Focus on different aspects of the content, vary the question types, or adjust the difficulty.` : ''}
${currentPrompt ? `\n\nUser's specific instructions: "${currentPrompt}"` : ''}
${fileContent ? `\n\nGenerate the quiz questions and answers strictly based on the content of the following document:\n---BEGIN DOCUMENT---\n${fileContent}\n---END DOCUMENT---` : ''}
${currentImage ? `\n\nOne or more questions should be based on the provided image. For those questions, ensure the 'refersToUploadedImage' property is set to true.` : ''}

# Output Format
The output MUST be a JSON object that strictly adheres to the provided schema. Do not output any text outside of the JSON object.`;
        
        const promptParts: Part[] = [{ text: generationPrompt }];
        if (currentImage) {
            promptParts.push(await fileToGenerativePart(currentImage));
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: promptParts },
            config: { responseMimeType: "application/json", responseSchema: schema },
        });

        if (isGenerationCancelled) {
            return; 
        }
        
        selectedImageFile = currentImage;

        const quizContent = JSON.parse(response.text);

        if (quizContent.summary) {
            quizSummary = quizContent.summary;
            summaryContent.innerHTML = quizSummary.replace(/\n/g, '<br>');
            preQuizSummaryContainer.style.display = 'block';
        } else {
            quizSummary = null;
        }

        quizData = quizContent.quizData;
        userAnswers = Array(quizData.length).fill(null).map((_, i) => ({ questionIndex: i, userAnswer: null, isCorrect: false }));
        currentQuestionIndex = 0;
        setupQuiz(quizContent.quizTitle);
    } catch (error) {
        if (isGenerationCancelled) {
            console.log("Quiz generation cancelled by user.");
            return;
        }
        console.error("Quiz Generation failed:", error);
        if (error instanceof Error) {
            showError(error.message);
        } else {
            showError("An unknown error occurred while generating the quiz.");
        }
    } finally {
        isGenerationCancelled = false;
        loaderContainer.style.display = 'none';
        generateBtn.style.display = 'block';
        generateBtn.disabled = false;
        generateDifferentQuizBtn.disabled = false;
        generateDifferentQuizBtnFromReview.disabled = false;
        promptContainer.style.display = 'flex';
    }
}


async function fetchMoreResources(question: string) {
    if (!ai) {
        showError("AI client is not available.");
        return;
    }
    learnMoreContent.innerHTML = '';
    learnMoreError.style.display = 'none';
    learnMoreLoader.style.display = 'block';
    learnMoreModal.style.display = 'flex';

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
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING, description: "A simple, easy-to-understand summary of the topic." },
            youtubeLinks: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        url: { type: Type.STRING }
                    },
                    required: ["title", "url"]
                }
            },
            articleLinks: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        url: { type: Type.STRING }
                    },
                    required: ["title", "url"]
                }
            }
        },
        required: ["summary", "youtubeLinks", "articleLinks"]
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: "application/json", responseSchema: schema },
        });

        const resources = JSON.parse(response.text);

        let contentHtml = '';
        if (resources.summary) {
            contentHtml += `<h3>${uiStrings.resourceSummary}</h3><p>${resources.summary.replace(/\n/g, '<br>')}</p>`;
        }
        if (resources.youtubeLinks && resources.youtubeLinks.length > 0) {
            contentHtml += `<h3>${uiStrings.resourceVideos}</h3><ul>`;
            resources.youtubeLinks.forEach((link: {title: string, url: string}) => {
                contentHtml += `<li><a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.title}</a></li>`;
            });
            contentHtml += `</ul>`;
        }
        if (resources.articleLinks && resources.articleLinks.length > 0) {
            contentHtml += `<h3>${uiStrings.resourceArticles}</h3><ul>`;
            resources.articleLinks.forEach((link: {title: string, url: string}) => {
                contentHtml += `<li><a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.title}</a></li>`;
            });
            contentHtml += `</ul>`;
        }
        learnMoreContent.innerHTML = contentHtml;

    } catch (error) {
        console.error("Failed to fetch resources:", error);
        learnMoreError.textContent = "Sorry, I couldn't find resources for that topic right now. Please try again later.";
        learnMoreError.style.display = 'block';
    } finally {
        learnMoreLoader.style.display = 'none';
    }
}

// --- QUIZ UI AND LOGIC ---
function showPage(pageToShow: HTMLElement) {
    document.querySelectorAll('.page').forEach(page => (page as HTMLElement).classList.remove('active'));
    pageToShow.classList.add('active');
    saveState();
}

function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function appendQuestionImage(q: any, container: HTMLElement) {
    if (q.refersToUploadedImage && selectedImageFile) {
        const imageElement = document.createElement('img');
        imageElement.src = URL.createObjectURL(selectedImageFile);
        imageElement.alt = "Context image for the question";
        imageElement.classList.add('question-image');
        container.appendChild(imageElement);
        imageElement.onload = () => URL.revokeObjectURL(imageElement.src);
    }
}

function displayCurrentQuestion() {
    questionsContainer.innerHTML = '';
    quizNavContainer.innerHTML = '';
    updateProgressBar();
    if (currentQuestionIndex >= quizData.length) {
        displayResults(calculateScore());
        return;
    }
    const q = quizData[currentQuestionIndex];
    const questionBlock = document.createElement('div');
    questionBlock.classList.add('question-block');
    questionBlock.id = `question-block-${currentQuestionIndex}`;
    appendQuestionImage(q, questionBlock);
    if (q.caseDescription && q.caseDescription !== currentCaseDescription) {
        const caseDescElement = document.createElement('div');
        caseDescElement.classList.add('case-description');
        caseDescElement.innerHTML = `<strong>Context:</strong> ${q.caseDescription}`;
        questionBlock.appendChild(caseDescElement);
        currentCaseDescription = q.caseDescription;
    }
    const questionText = document.createElement('div');
    questionText.classList.add('question-text');
    questionText.textContent = `${currentQuestionIndex + 1}. ${q.question}`;
    questionBlock.appendChild(questionText);
    const optionsContainer = document.createElement('div');
    optionsContainer.classList.add('options-container');
    
    // Render based on question type
    switch (q.questionType) {
        case 'MCQ':
        case 'TrueFalse':
            renderMcqOptions(q, optionsContainer);
            break;
        case 'ShortAnswer':
            renderShortAnswer(q, optionsContainer);
            break;
        case 'Ordering':
            renderOrdering(q, optionsContainer);
            break;
        case 'Matching':
            renderMatching(q, optionsContainer);
            break;
    }

    questionBlock.appendChild(optionsContainer);
    questionsContainer.appendChild(questionBlock);
    const submitAnswerBtn = document.createElement('button');
    submitAnswerBtn.id = 'submit-answer-btn';
    submitAnswerBtn.textContent = uiStrings.submitAnswer;
    submitAnswerBtn.addEventListener('click', submitAnswer);
    quizNavContainer.appendChild(submitAnswerBtn);
    totalQuestionsSpan.textContent = quizData.length.toString();
}

function renderMcqOptions(q: any, container: HTMLElement) {
    const optionsList = document.createElement('ul');
    optionsList.classList.add('options-list');
    q.options.forEach((optionText: string) => {
        const optionItem = document.createElement('li');
        optionItem.classList.add('option-item');
        const radioInput = document.createElement('input');
        radioInput.type = 'radio';
        radioInput.name = `question-${currentQuestionIndex}`;
        radioInput.value = optionText;
        const label = document.createElement('label');
        label.textContent = optionText;
        label.prepend(radioInput);
        optionItem.appendChild(label);
        optionsList.appendChild(optionItem);
        optionItem.addEventListener('click', () => {
            if (optionItem.classList.contains('disabled')) return;
            optionsList.querySelectorAll('.option-item').forEach(item => item.classList.remove('user-selected'));
            optionItem.classList.add('user-selected');
            radioInput.checked = true;
        });
    });
    container.appendChild(optionsList);
}

function renderShortAnswer(q: any, container: HTMLElement) {
    const shortAnswerInput = document.createElement('input');
    shortAnswerInput.type = 'text';
    shortAnswerInput.name = `question-${currentQuestionIndex}`;
    shortAnswerInput.placeholder = 'Type your answer here...';
    shortAnswerInput.classList.add('short-answer-input');
    container.appendChild(shortAnswerInput);
}

function renderOrdering(q: any, container: HTMLElement) {
    container.innerHTML = `
        <div class="ordering-container">
            <h4>Click the items in the correct order:</h4>
            <div id="ordering-source" class="ordering-list"></div>
            <h4>Your order:</h4>
            <div id="ordering-user" class="ordering-list"></div>
        </div>`;
    
    const sourceContainer = container.querySelector('#ordering-source')!;
    const userContainer = container.querySelector('#ordering-user')!;
    const shuffledOptions = shuffleArray([...q.options]);

    shuffledOptions.forEach((option: string) => {
        const item = document.createElement('button');
        item.textContent = option;
        item.classList.add('ordering-item');
        item.addEventListener('click', () => {
            userContainer.appendChild(item);
            item.disabled = true;
        });
        sourceContainer.appendChild(item);
    });
}

function renderMatching(q: any, container: HTMLElement) {
    container.innerHTML = `
        <div class="matching-container">
            <div class="matching-column" id="matching-prompts"><h4>Prompts</h4></div>
            <div class="matching-column" id="matching-answers"><h4>Answers</h4></div>
            <div class="matches-made-list"></div>
        </div>`;

    const promptsCol = container.querySelector('#matching-prompts')!;
    const answersCol = container.querySelector('#matching-answers')!;
    const shuffledAnswers = shuffleArray([...q.matchOptions]);

    q.options.forEach((prompt: string) => {
        const item = document.createElement('div');
        item.textContent = prompt;
        item.classList.add('matching-item', 'prompt');
        item.dataset.value = prompt;
        promptsCol.appendChild(item);
    });

    shuffledAnswers.forEach((answer: string) => {
        const item = document.createElement('div');
        item.textContent = answer;
        item.classList.add('matching-item', 'answer');
        item.dataset.value = answer;
        answersCol.appendChild(item);
    });

    let selectedPrompt: HTMLElement | null = null;

    container.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (!target.matches('.matching-item') || target.classList.contains('disabled')) return;
        
        if (target.classList.contains('prompt')) {
            container.querySelectorAll('.prompt.selected').forEach(el => el.classList.remove('selected'));
            target.classList.add('selected');
            selectedPrompt = target;
        } else if (target.classList.contains('answer') && selectedPrompt) {
            const promptEl = selectedPrompt;
            const answerEl = target;

            promptEl.classList.add('disabled');
            answerEl.classList.add('disabled');
            selectedPrompt = null;
            promptEl.classList.remove('selected');
            
            const pairContainer = container.querySelector('.matches-made-list')!;
            const pairEl = document.createElement('div');
            pairEl.classList.add('match-pair');
            pairEl.dataset.prompt = promptEl.dataset.value;
            pairEl.dataset.answer = answerEl.dataset.value;
            pairEl.innerHTML = `<span>${promptEl.textContent}</span> <span>↔️</span> <span>${answerEl.textContent}</span>`;
            pairContainer.appendChild(pairEl);
        }
    });
}

function submitAnswer() {
    const q = quizData[currentQuestionIndex];
    let userAnswer: any = null;
    let isCorrect = false;

    switch (q.questionType) {
        case 'MCQ':
        case 'TrueFalse':
            const selectedOption = questionsContainer.querySelector(`input[name="question-${currentQuestionIndex}"]:checked`) as HTMLInputElement;
            if (selectedOption) userAnswer = selectedOption.value;
            break;
        case 'ShortAnswer':
            const input = questionsContainer.querySelector(`input[name="question-${currentQuestionIndex}"]`) as HTMLInputElement;
            if (input && input.value.trim() !== '') userAnswer = input.value.trim();
            break;
        case 'Ordering':
            const orderedItems = questionsContainer.querySelectorAll('#ordering-user .ordering-item');
            userAnswer = Array.from(orderedItems).map(item => item.textContent);
            break;
        case 'Matching':
            const matchedPairs = questionsContainer.querySelectorAll('.match-pair');
            userAnswer = Array.from(matchedPairs).map(pair => ({
                prompt: (pair as HTMLElement).dataset.prompt,
                answer: (pair as HTMLElement).dataset.answer
            }));
            break;
    }
    
    if (userAnswer) {
        // Simple deep equals for array of primitives or array of objects
        const deepEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);
        // For matching, sort both arrays to handle different pairing order
        const sortedDeepEqual = (a: any, b: any) => {
            const sortFn = (x: any, y: any) => x.prompt.localeCompare(y.prompt);
            return JSON.stringify([...a].sort(sortFn)) === JSON.stringify([...b].sort(sortFn));
        };
        
        if(q.questionType === 'Ordering') {
            isCorrect = deepEqual(userAnswer, q.correctAnswer);
        } else if (q.questionType === 'Matching') {
            isCorrect = userAnswer.length === q.correctAnswer.length && sortedDeepEqual(userAnswer, q.correctAnswer);
        }
        else {
             isCorrect = userAnswer.toLowerCase() === q.correctAnswer.toLowerCase();
        }
    }
    
    userAnswers[currentQuestionIndex] = { questionIndex: currentQuestionIndex, userAnswer, isCorrect };
    
    showAnswerFeedback();
    updateProgressBar();
    saveState();
}


function showAnswerFeedback() {
    const q = quizData[currentQuestionIndex];
    const answerData = userAnswers[currentQuestionIndex];

    const allOptions = questionsContainer.querySelectorAll('.option-item, .ordering-item, .matching-item');
    allOptions.forEach(opt => opt.classList.add('disabled'));
    const allInputs = questionsContainer.querySelectorAll('input');
    allInputs.forEach(input => input.disabled = true);
    
    if (q.questionType === 'MCQ' || q.questionType === 'TrueFalse') {
        questionsContainer.querySelectorAll('.option-item').forEach(opt => {
            const radio = opt.querySelector('input') as HTMLInputElement;
            if (radio.value === q.correctAnswer) {
                opt.classList.add('correct');
            }
            if (radio.checked && !answerData.isCorrect) {
                opt.classList.add('incorrect');
            }
        });
    }

    const feedbackContainer = document.createElement('div');
    feedbackContainer.classList.add('question-feedback', answerData.isCorrect ? 'correct' : 'incorrect');
    const feedbackHeader = document.createElement('h3');
    feedbackHeader.textContent = answerData.isCorrect ? uiStrings.correct : uiStrings.incorrect;
    feedbackHeader.classList.add(answerData.isCorrect ? 'correct' : 'incorrect');
    const feedbackExplanation = document.createElement('p');
    feedbackExplanation.innerHTML = `<strong>Explanation:</strong> ${q.explanation.replace(/\n/g, '<br>')}`;
    
    feedbackContainer.appendChild(feedbackHeader);
    if (!answerData.isCorrect && (q.questionType === 'ShortAnswer' || q.questionType === 'Ordering' || q.questionType === 'Matching')) {
        const correctAnswerEl = document.createElement('div');
        let correctAnswerHtml = '<strong>Correct Answer:</strong> ';
        if (q.questionType === 'Ordering') {
            correctAnswerHtml += q.correctAnswer.join(' → ');
        } else if (q.questionType === 'Matching') {
            correctAnswerHtml += q.correctAnswer.map((p: any) => `${p.prompt} → ${p.answer}`).join(', ');
        } else {
            correctAnswerHtml += q.correctAnswer;
        }
        correctAnswerEl.innerHTML = correctAnswerHtml;
        feedbackContainer.appendChild(correctAnswerEl);
    }
    feedbackContainer.appendChild(feedbackExplanation);
    
    const learnMoreBtn = document.createElement('button');
    learnMoreBtn.textContent = uiStrings.learnMore;
    learnMoreBtn.classList.add('learn-more-btn');
    learnMoreBtn.dataset.question = q.question; 
    
    const actionsContainer = document.createElement('div');
    actionsContainer.classList.add('review-actions');
    actionsContainer.appendChild(learnMoreBtn);
    feedbackContainer.appendChild(actionsContainer);

    questionsContainer.querySelector(`#question-block-${currentQuestionIndex}`)?.appendChild(feedbackContainer);
    
    quizNavContainer.innerHTML = '';
    const nextBtn = document.createElement('button');
    const isLastQuestion = currentQuestionIndex >= quizData.length - 1;
    nextBtn.textContent = isLastQuestion ? uiStrings.finishQuiz : uiStrings.nextQuestion;
    nextBtn.addEventListener('click', () => {
        if (isLastQuestion) {
            displayResults(calculateScore());
        } else {
            currentQuestionIndex++;
            displayCurrentQuestion();
        }
    });
    quizNavContainer.appendChild(nextBtn);
}


function updateProgressBar() {
    const answeredCount = userAnswers.filter(a => a.userAnswer !== null).length;
    const progress = (answeredCount / quizData.length) * 100;
    progressBar.style.width = `${progress}%`;
}

function calculateScore() {
    return userAnswers.filter(a => a.isCorrect).length;
}

function displayResults(score: number) {
    if(timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    timeTakenEl.textContent = `${Math.floor(timeTaken / 60).toString().padStart(2, '0')}:${(timeTaken % 60).toString().padStart(2, '0')}`;

    const percentage = quizData.length > 0 ? (score / quizData.length) * 100 : 0;
    scoreSpan.textContent = score.toString();
    percentageSpan.textContent = percentage.toFixed(1);
    studyAdvice.classList.remove('passed-message', 'failed-message');
    if (percentage >= passPercentageThreshold) {
        studyAdvice.textContent = uiStrings.passMessage;
        studyAdvice.classList.add('passed-message');
    } else {
        studyAdvice.textContent = uiStrings.failMessage;
        studyAdvice.classList.add('failed-message');
    }
    saveQuizResultToHistory(score);
    showPage(resultsPage);
}

function displayReview() {
    reviewContainer.innerHTML = '';
    currentCaseDescription = null;
    const recallDeck = loadRecallDeck();
    
    quizData.forEach((q, index) => {
        const reviewBlock = document.createElement('div');
        reviewBlock.classList.add('review-question-block');
        reviewBlock.dataset.questionIndex = index.toString();
        
        appendQuestionImage(q, reviewBlock);
        if (q.caseDescription && q.caseDescription !== currentCaseDescription) {
            const caseDescElement = document.createElement('div');
            caseDescElement.classList.add('case-description');
            caseDescElement.innerHTML = `<strong>Context:</strong> ${q.caseDescription}`;
            reviewBlock.appendChild(caseDescElement);
            currentCaseDescription = q.caseDescription;
        }
        const reviewQuestionText = document.createElement('div');
        reviewQuestionText.classList.add('review-question-text');
        reviewQuestionText.textContent = `${index + 1}. ${q.question}`;
        reviewBlock.appendChild(reviewQuestionText);
        const userAnswerData = userAnswers.find(ans => ans.questionIndex === index);
        
        const answerContainer = document.createElement('div');
        reviewBlock.appendChild(answerContainer);

        switch(q.questionType) {
            case 'MCQ':
            case 'TrueFalse':
                const reviewOptionsList = document.createElement('ul');
                reviewOptionsList.classList.add('review-options-list');
                q.options.forEach((optionText: string) => {
                    const reviewOptionItem = document.createElement('li');
                    reviewOptionItem.classList.add('review-option-item');
                    reviewOptionItem.textContent = optionText;
                    if (optionText === q.correctAnswer) reviewOptionItem.classList.add('correct-answer');
                    if (userAnswerData && userAnswerData.userAnswer === optionText) {
                        reviewOptionItem.classList.add('user-selected');
                        if (!userAnswerData.isCorrect) reviewOptionItem.classList.add('incorrect-answer');
                    }
                    reviewOptionsList.appendChild(reviewOptionItem);
                });
                answerContainer.appendChild(reviewOptionsList);
                break;

            case 'ShortAnswer':
                const shortAnswerReview = document.createElement('div');
                shortAnswerReview.classList.add('short-answer-review');
                const userAnswerText = userAnswerData?.userAnswer ? `<strong>Your Answer:</strong> ${userAnswerData.userAnswer}` : '<strong>Your Answer:</strong> <i>Not answered</i>';
                const correctAnswerText = `<strong>Correct Answer:</strong> ${q.correctAnswer}`;
                shortAnswerReview.innerHTML = `<p class="${userAnswerData?.isCorrect ? 'correct' : 'incorrect'}">${userAnswerText}</p>${!userAnswerData?.isCorrect ? `<p class="correct">${correctAnswerText}</p>` : ''}`;
                answerContainer.appendChild(shortAnswerReview);
                break;
            
            case 'Ordering':
                const orderingReview = document.createElement('div');
                orderingReview.innerHTML = `
                    <p><strong>Your Order:</strong> ${userAnswerData?.userAnswer ? (userAnswerData.userAnswer as string[]).join(' → ') : '<i>Not answered</i>'}</p>
                    <p><strong>Correct Order:</strong> ${(q.correctAnswer as string[]).join(' → ')}</p>
                `;
                answerContainer.appendChild(orderingReview);
                break;
            
            case 'Matching':
                 const matchingReview = document.createElement('div');
                 const correctMatches = (q.correctAnswer as {prompt: string, answer: string}[]).map(p => `<li>${p.prompt} → ${p.answer}</li>`).join('');
                 matchingReview.innerHTML = `<p><strong>Correct Matches:</strong><ul class="review-matching-list">${correctMatches}</ul></p>`;
                 answerContainer.appendChild(matchingReview);
                 break;
        }

        const explanationElement = document.createElement('div');
        explanationElement.classList.add('review-explanation');
        explanationElement.innerHTML = `<strong>Explanation:</strong> ${q.explanation.replace(/\n/g, '<br>')}`;
        reviewBlock.appendChild(explanationElement);
        
        const reviewActions = document.createElement('div');
        reviewActions.classList.add('review-actions');
        
        const addToRecallBtn = document.createElement('button');
        addToRecallBtn.classList.add('add-to-recall-btn');
        const isAlreadyInDeck = recallDeck.some(item => JSON.stringify(item.questionData) === JSON.stringify(q));
        if (isAlreadyInDeck) {
            addToRecallBtn.textContent = uiStrings.addedToRecall;
            addToRecallBtn.disabled = true;
        } else {
            addToRecallBtn.textContent = uiStrings.addToRecall;
        }
        reviewActions.appendChild(addToRecallBtn);
        
        const learnMoreBtn = document.createElement('button');
        learnMoreBtn.textContent = uiStrings.learnMore;
        learnMoreBtn.classList.add('learn-more-btn');
        learnMoreBtn.dataset.question = q.question;
        reviewActions.appendChild(learnMoreBtn);
        
        reviewBlock.appendChild(reviewActions);
        
        reviewContainer.appendChild(reviewBlock);
    });
    showPage(reviewPage);
}


function displayHistory() {
    const history: QuizHistoryEntry[] = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
    historyContainer.innerHTML = '';

    if (history.length === 0) {
        historyContainer.innerHTML = `<p class="no-history-message">${uiStrings.noHistory}</p>`;
        return;
    }

    history.forEach((entry, index) => {
        const entryEl = document.createElement('div');
        entryEl.classList.add('history-entry');
        entryEl.innerHTML = `
            <h3>${entry.title}</h3>
            <p><strong>Date:</strong> ${entry.date}</p>
            <p><strong>Mode:</strong> Learning Path</p>
            <p><strong>Score:</strong> ${entry.score}/${entry.total} (${entry.percentage}%)</p>
            <p><strong>Time:</strong> ${entry.timeTaken}</p>
            <div class="button-group">
                <button class="retake-history-btn" data-history-index="${index}">Retake Quiz</button>
            </div>
        `;
        historyContainer.appendChild(entryEl);
    });
    promptContainer.style.display = 'none';
    appContainer.style.display = 'block';
    showPage(historyPage);
}

function startQuizFromData(data: any[], title: string) {
    quizData = data;
    userAnswers = Array(quizData.length).fill(null).map((_, i) => ({ questionIndex: i, userAnswer: null, isCorrect: false }));
    currentQuestionIndex = 0;
    setupQuiz(title);
    startQuizBtn.click();
}

function setupQuiz(title: string) {
    promptContainer.style.display = 'none';
    appContainer.style.display = 'block';
    quizTitle.textContent = title;
    if (!quizSummary) {
        preQuizSummaryContainer.style.display = 'none';
        summaryContent.innerHTML = '';
    }
    showPage(landingPage);
}

function clearFileInput() {
    selectedFile = null;
    fileInput.value = '';
    fileNameDisplay.style.display = 'none';
    fileNameSpan.textContent = '';
}

function clearImageInput() {
    selectedImageFile = null;
    imageInput.value = '';
    imageNameDisplay.style.display = 'none';
    imageNameSpan.textContent = '';
}

function handleNewQuiz() {
    clearState();
    initialContext = null;
    appContainer.style.display = 'none';
    promptContainer.style.display = 'flex';
    promptInput.value = '';
    subjectInput.value = '';
    clearFileInput();
    clearImageInput();
    promptInput.focus();
}

function handleAnkiExport() {
    if (!quizData || quizData.length === 0) {
        alert("No quiz data available to export."); 
        return;
    }

    const ankiCards = quizData.map(q => {
        const front = q.question.replace(/\n/g, "<br>");
        
        let answerText = '';
        switch(q.questionType) {
            case 'MCQ':
            case 'TrueFalse':
            case 'ShortAnswer':
                answerText = `<strong>Correct Answer:</strong> ${q.correctAnswer}`;
                break;
            case 'Ordering':
                answerText = `<strong>Correct Order:</strong> ${(q.correctAnswer as string[]).join(' → ')}`;
                break;
            case 'Matching':
                const correctMatches = (q.correctAnswer as {prompt: string, answer: string}[])
                    .map(p => `<li>${p.prompt} → ${p.answer}</li>`).join('');
                answerText = `<strong>Correct Matches:</strong><ul>${correctMatches}</ul>`;
                break;
        }

        const back = `${answerText}<hr>${q.explanation}`.replace(/\n/g, "<br>");

        const sanitizedFront = front.replace(/\t/g, " ");
        const sanitizedBack = back.replace(/\t/g, " ");

        return `${sanitizedFront}\t${sanitizedBack}`;
    }).join('\n');

    const blob = new Blob([ankiCards], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeQuizTitle = quizTitle.textContent?.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
    a.download = `${safeQuizTitle || 'quiz'}_anki_export.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function initializeUiText() {
    generateBtn.textContent = uiStrings.generateQuiz;
    startQuizBtn.textContent = uiStrings.startQuiz;
    reviewAnswersBtn.textContent = uiStrings.reviewAnswers;
    retakeQuizBtn.textContent = uiStrings.retakeQuiz;
    generateDifferentQuizBtn.textContent = uiStrings.generateDifferentQuiz;
    newQuizBtn.textContent = uiStrings.createNewQuiz;
    backToResultsBtn.textContent = uiStrings.backToResults;
    generateDifferentQuizBtnFromReview.textContent = uiStrings.generateDifferentQuiz;
    newQuizBtnFromReview.textContent = uiStrings.createNewQuiz;
    landingMessage.textContent = uiStrings.landingMessage;
    resultsHeader.textContent = uiStrings.resultsHeader;
    resultsScoreLabel.textContent = uiStrings.resultsScoreLabel;
    resultsPercentageLabel.textContent = uiStrings.resultsPercentageLabel;
    reviewHeader.textContent = uiStrings.reviewHeader;
    resumeHeaderEl.textContent = uiStrings.resumeHeader;
    resumeText.textContent = uiStrings.resumeText;
    resumeYesBtn.textContent = uiStrings.resumeYes;
    resumeNoBtn.textContent = uiStrings.resumeNo;
    quizHistoryBtn.textContent = uiStrings.quizHistory;
    historyHeader.textContent = uiStrings.historyHeader;
    backToCreatorBtn.textContent = uiStrings.backToCreator;
    settingsHeader.textContent = uiStrings.settings;
    fontSizeLabel.textContent = uiStrings.fontSize;
    (fontSizeSelector.querySelector('[data-size="small"]') as HTMLButtonElement).textContent = uiStrings.small;
    (fontSizeSelector.querySelector('[data-size="medium"]') as HTMLButtonElement).textContent = uiStrings.medium;
    (fontSizeSelector.querySelector('[data-size="large"]') as HTMLButtonElement).textContent = uiStrings.large;
    settingsCloseBtn.textContent = uiStrings.close;
    numQuestionsLabel.textContent = uiStrings.numQuestions;
    difficultyLabel.textContent = uiStrings.difficulty;
    (difficultySelector.querySelector('[data-difficulty="Easy"]') as HTMLButtonElement).textContent = uiStrings.easy;
    (difficultySelector.querySelector('[data-difficulty="Medium"]') as HTMLButtonElement).textContent = uiStrings.mediumDifficulty;
    (difficultySelector.querySelector('[data-difficulty="Hard"]') as HTMLButtonElement).textContent = uiStrings.hard;
    (difficultySelector.querySelector('[data-difficulty="Mixed"]') as HTMLButtonElement).textContent = uiStrings.mixed;
    knowledgeLevelLabel.textContent = uiStrings.knowledgeLevel;
    document.querySelector('[data-i18n="beginner"]')!.textContent = uiStrings.beginner;
    document.querySelector('[data-i18n="intermediate"]')!.textContent = uiStrings.intermediate;
    document.querySelector('[data-i18n="advanced"]')!.textContent = uiStrings.advanced;
    learningGoalLabel.textContent = uiStrings.learningGoal;
    document.querySelector('[data-i18n="understandConcepts"]')!.textContent = uiStrings.understandConcepts;
    document.querySelector('[data-i18n="applyInfo"]')!.textContent = uiStrings.applyInfo;
    document.querySelector('[data-i18n="learning"]')!.textContent = uiStrings.learning;
    questionTypesLabel.textContent = uiStrings.questionTypes;
    document.querySelector('[data-i18n="q-mcq"]')!.textContent = uiStrings.qMcq;
    document.querySelector('[data-i18n="q-tf"]')!.textContent = uiStrings.qTf;
    document.querySelector('[data-i18n="q-sa"]')!.textContent = uiStrings.qSa;
    document.querySelector('[data-i18n="q-ord"]')!.textContent = uiStrings.qOrd;
    document.querySelector('[data-i18n="q-match"]')!.textContent = uiStrings.qMatch;
    quizLangLabel.textContent = uiStrings.quizLanguage;
    (document.querySelector('[data-i18n="summary-header"]') as HTMLElement).textContent = uiStrings.summaryHeader;
    // Spaced Repetition UI Text
    (document.querySelector('[data-i18n="recall-header"]') as HTMLElement).textContent = uiStrings.recallHeader;
    recallShowAnswerBtn.textContent = uiStrings.showAnswer;
    recallForgotBtn.textContent = uiStrings.recallForgot;
    recallGoodBtn.textContent = uiStrings.recallGood;
    recallEasyBtn.textContent = uiStrings.recallEasy;
    (document.querySelector('[data-i18n="recall-complete-header"]') as HTMLElement).textContent = uiStrings.recallCompleteHeader;
    (document.querySelector('[data-i18n="recall-complete-text"]') as HTMLElement).textContent = uiStrings.recallCompleteText;
    recallBackToCreatorBtn.textContent = uiStrings.createNewQuiz;
    // Learn More UI Text
    learnMoreHeader.textContent = uiStrings.learnMoreHeader;
    learnMoreCloseBtn.textContent = uiStrings.close;
    cancelBtn.textContent = uiStrings.cancel;
    exportAnkiBtn.textContent = uiStrings.exportForAnki;
}

function loadAndApplyFontSize() {
    const savedSize = localStorage.getItem(FONT_SIZE_KEY) || 'medium';
    applyFontSize(savedSize);
}

function applyFontSize(size: string) {
    mainContainer.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    mainContainer.classList.add(`font-size-${size}`);
    fontSizeSelector.querySelectorAll('.font-size-btn').forEach(btn => {
        btn.classList.remove('active');
        if ((btn as HTMLButtonElement).dataset.size === size) {
            btn.classList.add('active');
        }
    });
    localStorage.setItem(FONT_SIZE_KEY, size);
}

function updateTimerDisplay() {
    if (!startTime) return;
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
    const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
    timerEl.textContent = `${minutes}:${seconds}`;
}


// --- SPACED REPETITION (SMART RECALL) ---
function loadRecallDeck(): RecallItem[] {
    return JSON.parse(localStorage.getItem(RECALL_STORAGE_KEY) || '[]');
}

function saveRecallDeck(deck: RecallItem[]) {
    localStorage.setItem(RECALL_STORAGE_KEY, JSON.stringify(deck));
    updateRecallUI();
}

function getDueRecallItems(): RecallItem[] {
    const deck = loadRecallDeck();
    const now = Date.now();
    return deck.filter(item => item.nextReviewDate <= now);
}

function updateRecallUI() {
    const dueItems = getDueRecallItems();
    if (dueItems.length > 0) {
        recallHubBtn.style.display = 'flex';
        recallCountBadge.textContent = dueItems.length.toString();
    } else {
        recallHubBtn.style.display = 'none';
    }
}

function addQuestionToRecall(questionIndex: number) {
    const questionData = quizData[questionIndex];
    let deck = loadRecallDeck();

    // Prevent duplicates
    if (deck.some(item => JSON.stringify(item.questionData) === JSON.stringify(questionData))) {
        return;
    }

    const newItem: RecallItem = {
        id: Date.now(),
        questionData: questionData,
        nextReviewDate: Date.now(), // Due immediately
        interval: 1, // Start with 1 day
        easeFactor: 2.5,
    };

    deck.push(newItem);
    saveRecallDeck(deck);
}

function updateRecallItem(itemId: number, performance: 'forgot' | 'good' | 'easy') {
    let deck = loadRecallDeck();
    const itemIndex = deck.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    let item = deck[itemIndex];
    const oneDay = 24 * 60 * 60 * 1000;

    switch (performance) {
        case 'forgot':
            item.interval = 1;
            item.easeFactor = Math.max(1.3, item.easeFactor - 0.2); // Decrease ease, min 1.3
            break;
        case 'good':
            item.interval = Math.ceil(item.interval * item.easeFactor);
            break;
        case 'easy':
            item.interval = Math.ceil(item.interval * item.easeFactor * 1.3);
            item.easeFactor += 0.15; // Increase ease
            break;
    }
    
    item.nextReviewDate = Date.now() + item.interval * oneDay;
    deck[itemIndex] = item;
    saveRecallDeck(deck);
}

function startRecallSession() {
    dueRecallItems = getDueRecallItems();
    if (dueRecallItems.length === 0) return;

    currentRecallIndex = 0;
    promptContainer.style.display = 'none';
    appContainer.style.display = 'block';
    recallCompleteMessage.style.display = 'none';
    recallSessionContainer.style.display = 'block';
    showPage(spacedRepetitionPage);
    displayCurrentRecallItem();
}

function displayCurrentRecallItem() {
    if (currentRecallIndex >= dueRecallItems.length) {
        endRecallSession();
        return;
    }

    const item = dueRecallItems[currentRecallIndex];
    const q = item.questionData;
    
    // Update progress bar
    const progressPercent = (currentRecallIndex / dueRecallItems.length) * 100;
    recallProgressEl.innerHTML = `<div class="progress-bar-inner" style="width: ${progressPercent}%"></div>`;
    
    // Display question
    recallQuestion.innerHTML = '';
    appendQuestionImage(q, recallQuestion);
    const questionText = document.createElement('div');
    questionText.textContent = q.question;
    recallQuestion.appendChild(questionText);

    // Display answer
    recallAnswer.innerHTML = `<strong>Answer:</strong> ${q.explanation.replace(/\n/g, '<br>')}`;
    recallAnswer.style.display = 'none';
    
    // Set up nav buttons
    recallShowAnswerBtn.style.display = 'block';
    recallFeedbackBtns.style.display = 'none';
}

function endRecallSession() {
    recallSessionContainer.style.display = 'none';
    recallCompleteMessage.style.display = 'block';
    updateRecallUI(); // Refresh the badge count
}


// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    initializeUiText();
    loadAndApplyFontSize();
    updateRecallUI();
    const savedState = loadState();
    if (savedState) {
        resumePromptContainer.style.display = 'flex';
    }
});

resumeYesBtn.addEventListener('click', () => {
    const savedState = loadState();
    if (savedState) {
        resumeQuiz(savedState);
    }
    resumePromptContainer.style.display = 'none';
});

resumeNoBtn.addEventListener('click', () => {
    clearState();
    resumePromptContainer.style.display = 'none';
});

generateBtn.addEventListener('click', () => generateQuiz(false));
promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generateQuiz(false); }
});

cancelBtn.addEventListener('click', () => {
    isGenerationCancelled = true;
    loaderContainer.style.display = 'none';
    generateBtn.style.display = 'block';
    generateBtn.disabled = false;
    generateDifferentQuizBtn.disabled = false;
    generateDifferentQuizBtnFromReview.disabled = false;
});

fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
        selectedFile = fileInput.files[0];
        fileNameSpan.textContent = selectedFile.name;
        fileNameDisplay.style.display = 'flex';
    } else {
        clearFileInput();
    }
});
removeFileBtn.addEventListener('click', clearFileInput);

imageInput.addEventListener('change', () => {
    if (imageInput.files && imageInput.files.length > 0) {
        selectedImageFile = imageInput.files[0];
        imageNameSpan.textContent = selectedImageFile.name;
        imageNameDisplay.style.display = 'flex';
    } else {
        clearImageInput();
    }
});
removeImageBtn.addEventListener('click', clearImageInput);

startQuizBtn.addEventListener('click', () => {
    currentQuestionIndex = 0;
    if (timerInterval) clearInterval(timerInterval);
    startTime = Date.now();
    timerInterval = window.setInterval(updateTimerDisplay, 1000);
    displayCurrentQuestion();
    showPage(quizPage);
});

reviewAnswersBtn.addEventListener('click', () => {
    displayReview();
});

retakeQuizBtn.addEventListener('click', () => {
    userAnswers = Array(quizData.length).fill(null).map((_, i) => ({ questionIndex: i, userAnswer: null, isCorrect: false }));
    startQuizBtn.click();
});

newQuizBtn.addEventListener('click', handleNewQuiz);
newQuizBtnFromReview.addEventListener('click', handleNewQuiz);
backToCreatorBtn.addEventListener('click', handleNewQuiz);
recallBackToCreatorBtn.addEventListener('click', handleNewQuiz);
exportAnkiBtn.addEventListener('click', handleAnkiExport);

generateDifferentQuizBtn.addEventListener('click', () => generateQuiz(true));
generateDifferentQuizBtnFromReview.addEventListener('click', () => generateQuiz(true));

backToResultsBtn.addEventListener('click', () => showPage(resultsPage));
quizHistoryBtn.addEventListener('click', displayHistory);

historyContainer.addEventListener('click', (e) => {
    const target = e.target as HTMLButtonElement;
    if (target.matches('.retake-history-btn')) {
        const index = parseInt(target.dataset.historyIndex || '-1', 10);
        if (index > -1) {
            const history: QuizHistoryEntry[] = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
            const historyEntry = history[index];
            if (historyEntry) {
                startQuizFromData(historyEntry.quizData, historyEntry.title);
            }
        }
    }
});

document.body.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.matches('.add-to-recall-btn')) {
        const questionBlock = target.closest('.review-question-block') as HTMLElement;
        const questionIndex = parseInt(questionBlock.dataset.questionIndex || '-1');
        if (questionIndex > -1) {
            addQuestionToRecall(questionIndex);
            target.textContent = uiStrings.addedToRecall;
            (target as HTMLButtonElement).disabled = true;
        }
    } else if (target.matches('.learn-more-btn')) {
        const question = target.dataset.question;
        if (question) {
            fetchMoreResources(question);
        }
    }
});

settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
});

settingsCloseBtn.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

learnMoreCloseBtn.addEventListener('click', () => {
    learnMoreModal.style.display = 'none';
});

learnMoreModal.addEventListener('click', (e) => {
    if (e.target === learnMoreModal) {
        learnMoreModal.style.display = 'none';
    }
});

fontSizeSelector.addEventListener('click', (e) => {
    const target = e.target as HTMLButtonElement;
    if (target.matches('.font-size-btn')) {
        const size = target.dataset.size;
        if (size) {
            applyFontSize(size);
        }
    }
});

difficultySelector.addEventListener('click', (e) => {
    const target = e.target as HTMLButtonElement;
    if (target.matches('.difficulty-btn')) {
        difficultySelector.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');
        selectedDifficulty = target.dataset.difficulty || 'Mixed';
    }
});

explanationLangSelector.addEventListener('click', (e) => {
    const target = e.target as HTMLButtonElement;
    if (target.matches('.difficulty-btn')) {
        explanationLangSelector.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');
        selectedExplanationLang = target.dataset.lang || 'Arabic';
    }
});

quizLangSelector.addEventListener('click', (e) => {
    const target = e.target as HTMLButtonElement;
    if (target.matches('.difficulty-btn')) {
        quizLangSelector.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');
        selectedQuizLang = target.dataset.lang || 'English';
    }
});

// Spaced Repetition Event Listeners
recallHubBtn.addEventListener('click', startRecallSession);

recallShowAnswerBtn.addEventListener('click', () => {
    recallAnswer.style.display = 'block';
    recallShowAnswerBtn.style.display = 'none';
    recallFeedbackBtns.style.display = 'flex';
});

recallFeedbackBtns.addEventListener('click', (e) => {
    const target = e.target as HTMLButtonElement;
    if (target.matches('.recall-feedback-btn')) {
        const performance = target.id.split('-')[1] as 'forgot' | 'good' | 'easy';
        const currentItemId = dueRecallItems[currentRecallIndex].id;
        updateRecallItem(currentItemId, performance);
        currentRecallIndex++;
        displayCurrentRecallItem();
    }
});
