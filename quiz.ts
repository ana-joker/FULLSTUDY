
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Type, Part } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import { getAiInstance, generateQuizContent, fetchMoreResources } from "./api";
import { currentStrings } from "./i18n";
import { showPage, showError, hideError, showModal } from "./ui";
import { fileToGenerativePart, readFileAsDataURL, shuffleArray } from "./utils";
import { appSettings } from "./settings";
import { QuizState, UserAnswer, QuizContext, QuizHistoryEntry, RecallItem } from './state';

// --- CONSTANTS ---
const LOCAL_STORAGE_KEY = 'interactiveQuizState';
const HISTORY_STORAGE_KEY = 'interactiveQuizHistory';
const RECALL_STORAGE_KEY = 'interactiveQuizRecallDeck';
const passPercentageThreshold = 60;

// --- DOM ELEMENT SELECTORS ---
const promptInput = document.getElementById('prompt-input') as HTMLTextAreaElement | null;
const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement | null;
const loaderContainer = document.getElementById('loader-container') as HTMLDivElement | null;
const cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement | null;
const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
const fileNameDisplay = document.getElementById('file-name-display') as HTMLDivElement | null;
const fileNameSpan = document.getElementById('file-name') as HTMLSpanElement | null;
const removeFileBtn = document.getElementById('remove-file-btn') as HTMLButtonElement | null;
const imageInput = document.getElementById('image-input') as HTMLInputElement | null;
const imageNameDisplay = document.getElementById('image-name-display') as HTMLDivElement | null;
const imageNameSpan = document.getElementById('image-name') as HTMLSpanElement | null;
const removeImageBtn = document.getElementById('remove-image-btn') as HTMLButtonElement | null;
const quizFlowContainer = document.getElementById('quiz-flow-container') as HTMLDivElement | null;
const landingPage = document.getElementById('landing-page') as HTMLDivElement | null;
const quizPage = document.getElementById('quiz-page') as HTMLDivElement | null;
const resultsPage = document.getElementById('results-page') as HTMLDivElement | null;
const reviewPage = document.getElementById('review-page') as HTMLDivElement | null;
const historyPage = document.getElementById('history-page') as HTMLDivElement | null;
const quizTitle = document.getElementById('quiz-title') as HTMLHeadingElement | null;
const startQuizBtn = document.getElementById('start-quiz-btn') as HTMLButtonElement | null;
const reviewAnswersBtn = document.getElementById('review-answers-btn') as HTMLButtonElement | null;
const retakeQuizBtn = document.getElementById('retake-quiz-btn') as HTMLButtonElement | null;
const generateDifferentQuizBtn = document.getElementById('generate-different-quiz-btn') as HTMLButtonElement | null;
const newQuizBtn = document.getElementById('new-quiz-btn') as HTMLButtonElement | null;
const generateDifferentQuizBtnFromReview = document.getElementById('generate-different-quiz-btn-from-review') as HTMLButtonElement | null;
const newQuizBtnFromReview = document.getElementById('new-quiz-btn-from-review') as HTMLButtonElement | null;
const backToResultsBtn = document.getElementById('back-to-results-btn') as HTMLButtonElement | null;
const backToCreatorBtn = document.getElementById('back-to-creator-btn') as HTMLButtonElement | null;
const quizHistoryBtn = document.getElementById('quiz-history-btn') as HTMLButtonElement | null;
const questionsContainer = document.getElementById('questions-container') as HTMLDivElement | null;
const quizNavContainer = document.getElementById('quiz-nav-container') as HTMLDivElement | null;
const scoreSpan = document.getElementById('score') as HTMLSpanElement | null;
const totalQuestionsSpan = document.getElementById('total-questions') as HTMLSpanElement | null;
const percentageSpan = document.getElementById('percentage') as HTMLSpanElement | null;
const studyAdvice = document.getElementById('study-advice') as HTMLParagraphElement | null;
const reviewContainer = document.getElementById('review-container') as HTMLDivElement | null;
const progressBar = document.getElementById('progress-bar') as HTMLDivElement | null;
const historyContainer = document.getElementById('history-container') as HTMLDivElement | null;
const numQuestionsInput = document.getElementById('num-questions-input') as HTMLInputElement | null;
const difficultySelector = document.querySelector('.difficulty-selector') as HTMLDivElement | null;
const subjectInput = document.getElementById('subject-input') as HTMLInputElement | null;
const explanationLangSelector = document.getElementById('explanation-lang-selector') as HTMLDivElement | null;
const timerEl = document.getElementById('timer') as HTMLSpanElement | null;
const timeTakenEl = document.getElementById('time-taken') as HTMLSpanElement | null;
const preQuizSummaryContainer = document.getElementById('pre-quiz-summary-container') as HTMLDivElement | null;
const summaryContent = document.getElementById('summary-content') as HTMLDivElement | null;
const quizLangSelector = document.getElementById('quiz-lang-selector') as HTMLDivElement | null;
const exportAnkiBtn = document.getElementById('export-anki-btn') as HTMLButtonElement | null;
const recallHubBtn = document.getElementById('recall-hub-btn') as HTMLButtonElement | null;
const recallCountBadge = document.getElementById('recall-count-badge') as HTMLSpanElement | null;
const spacedRepetitionPage = document.getElementById('spaced-repetition-page') as HTMLDivElement | null;
const recallSessionContainer = document.getElementById('recall-session-container') as HTMLDivElement | null;
const recallProgressEl = document.getElementById('recall-progress') as HTMLDivElement | null;
const recallQuestion = document.getElementById('recall-question') as HTMLDivElement | null;
const recallAnswer = document.getElementById('recall-answer') as HTMLDivElement | null;
const recallNavContainer = document.getElementById('recall-nav-container') as HTMLDivElement | null;
const recallShowAnswerBtn = document.getElementById('recall-show-answer-btn') as HTMLButtonElement | null;
const recallFeedbackBtns = document.getElementById('recall-feedback-btns') as HTMLDivElement | null;
const recallForgotBtn = document.getElementById('recall-forgot-btn') as HTMLButtonElement | null;
const recallGoodBtn = document.getElementById('recall-good-btn') as HTMLButtonElement | null;
const recallEasyBtn = document.getElementById('recall-easy-btn') as HTMLButtonElement | null;
const recallCompleteMessage = document.getElementById('recall-complete-message') as HTMLDivElement | null;
const recallBackToCreatorBtn = document.getElementById('recall-back-to-creator-btn') as HTMLButtonElement | null;
const learnMoreLoader = document.getElementById('learn-more-loader');
const learnMoreError = document.getElementById('learn-more-error');
const learnMoreContent = document.getElementById('learn-more-content');


// --- STATE ---
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

// --- STATE MANAGEMENT ---
function saveQuizState() {
    if (!quizData || quizData.length === 0 || !quizTitle) return;

    const activePage = quizFlowContainer?.querySelector('.page.active');
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
        // We only save the quiz state if we can successfully create the data URL
        readFileAsDataURL(selectedImageFile).then(dataUrl => {
            state.selectedImageFile = dataUrl;
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
        });
    } else {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    }
}

export function loadQuizState(): QuizState | null {
    const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    return savedState ? JSON.parse(savedState) : null;
}

export function clearQuizState() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    startTime = null;
    quizSummary = null;
}

export async function resumeQuiz(state: QuizState) {
    quizData = state.quizData;
    userAnswers = state.userAnswers;
    currentQuestionIndex = state.currentQuestionIndex || 0;
    startTime = state.startTime || null;
    quizSummary = state.summary || null;

    if (quizSummary && summaryContent && preQuizSummaryContainer) {
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

    showPage('quiz-flow-container');
    setupQuizUI(state.quizTitle);

    const targetPageId = state.currentPageId || 'landing-page';
    
    // Deactivate all pages within the quiz flow first
    quizFlowContainer?.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    const pageToShow = document.getElementById(targetPageId);
    if (pageToShow) pageToShow.classList.add('active');

    if (targetPageId === 'quiz-page' && quizPage) {
        if(startTime && !timerInterval) {
            timerInterval = window.setInterval(updateTimerDisplay, 1000);
        }
        displayCurrentQuestion();
    } else if (targetPageId === 'results-page') {
        const score = userAnswers.filter(a => a.isCorrect).length;
        displayResults(score);
    } else if (targetPageId === 'review-page') {
        displayReview();
    }
}

function saveQuizResultToHistory(score: number) {
    const total = quizData.length;
    if (total === 0 || !quizTitle || !timeTakenEl) return;

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


// --- CORE QUIZ LOGIC ---
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

async function generateQuiz(isVariation = false) {
    let currentPrompt: string;
    let currentFile: File | null;
    let currentImage: File | null;
    let currentSubject: string;

    isGenerationCancelled = false;
    
    if (!getAiInstance()) {
        showError(currentStrings.apiKeyMissing);
        return;
    }

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
        currentPrompt = promptInput?.value.trim() || '';
        currentFile = selectedFile;
        currentImage = selectedImageFile;
        currentSubject = subjectInput?.value.trim() || '';
        initialContext = { prompt: currentPrompt, file: currentFile, image: currentImage, subject: currentSubject };
    }

    if (!currentPrompt && !currentFile && !currentImage) {
        showError("Please enter a description, upload a document, or upload an image.");
        return;
    }

    hideError();
    clearQuizState();
    if(loaderContainer) loaderContainer.style.display = 'flex';
    if(generateBtn) {
        generateBtn.style.display = 'none';
        generateBtn.disabled = true;
    }
    if(generateDifferentQuizBtn) generateDifferentQuizBtn.disabled = true;
    if(generateDifferentQuizBtnFromReview) generateDifferentQuizBtnFromReview.disabled = true;
    
    const numQuestions = numQuestionsInput?.value || '5';
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
        schema.properties.summary = { type: Type.STRING, description: "A simple, clear summary of the content for a 14-year-old, including a real-life example, written in simple Arabic." };
        schema.required.unshift("summary");

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
You are "The Explainer and Tester Maestro," a world-class personal tutor. Your mission is to transform testing into an immersive, unforgettable learning journey for your user.

${summaryInstruction}

# Quiz Generation Instructions
Based on the user's request and any provided document/image, create a compelling and educational quiz.
- **User's State:** Knowledge Level: '${knowledgeLevel}', Learning Goal: '${learningGoal}'.
- **Quiz Structure:** Generate exactly ${numQuestions} questions with a difficulty level of '${difficulty}'.
- **Quiz Language (Questions & Options):** ${selectedQuizLang}. The quiz title, questions, options, and correct answers MUST be in this language.
- **Subject:** The quiz should be about '${currentSubject || 'the provided content'}'.
- **Question Variety:** IMPORTANT: You MUST ONLY generate questions from the following types: [${selectedQuestionTypes.join(', ')}]. For scenario-based or application questions, use the 'caseDescription' field.

# THE GOLDEN RULE: Explanation Protocol (Language: ${selectedExplanationLang})
This is the most critical part. For EVERY question, the 'explanation' field MUST be in **${selectedExplanationLang}**. It must be simple and include a practical, real-life example. Follow these steps:
1.  **Explain the "Why" (in ${selectedExplanationLang}):** Explain *why* the correct answer is right and others are wrong.
2.  **Practical, Real-Life Example (in ${selectedExplanationLang}):** Provide a simple example. Start it with "**مثال عملي:**" (Arabic) or "**Practical Example:**" (English).
3.  **The "Key Takeaway" (in ${selectedExplanationLang}):** Conclude with a single, memorable sentence. Start it with "**الخلاصة:**" (Arabic) or "**Key Takeaway:**" (English).

# User's Input
${isVariation ? `\n\nIMPORTANT: This is a request for a new, different quiz based on the same source material. DO NOT repeat questions.` : ''}
${currentPrompt ? `\n\nUser's specific instructions: "${currentPrompt}"` : ''}
${fileContent ? `\n\nGenerate the quiz from this document:\n---BEGIN DOCUMENT---\n${fileContent}\n---END DOCUMENT---` : ''}
${currentImage ? `\n\nOne or more questions should be based on the provided image. Set 'refersToUploadedImage' to true for them.` : ''}

# Output Format
The output MUST be a JSON object that strictly adheres to the provided schema.`;
        
        const promptParts: Part[] = [{ text: generationPrompt }];
        if (currentImage) {
            promptParts.push(await fileToGenerativePart(currentImage));
        }

        const quizContent = await generateQuizContent(promptParts, schema);
        
        if (isGenerationCancelled) return; 
        
        selectedImageFile = currentImage;

        if (quizContent.summary && summaryContent && preQuizSummaryContainer) {
            quizSummary = quizContent.summary;
            summaryContent.innerHTML = quizSummary.replace(/\n/g, '<br>');
            preQuizSummaryContainer.style.display = 'block';
        } else {
            quizSummary = null;
        }

        quizData = quizContent.quizData;
        userAnswers = Array(quizData.length).fill(null).map((_, i) => ({ questionIndex: i, userAnswer: null, isCorrect: false }));
        currentQuestionIndex = 0;
        showPage('quiz-flow-container');
        setupQuizUI(quizContent.quizTitle);
    } catch (error) {
        if (isGenerationCancelled) {
            console.log("Quiz generation cancelled by user.");
            return;
        }
        console.error("Quiz Generation failed:", error);
        showError(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
        isGenerationCancelled = false;
        if(loaderContainer) loaderContainer.style.display = 'none';
        if(generateBtn) {
            generateBtn.style.display = 'block';
            generateBtn.disabled = false;
        }
        if(generateDifferentQuizBtn) generateDifferentQuizBtn.disabled = false;
        if(generateDifferentQuizBtnFromReview) generateDifferentQuizBtnFromReview.disabled = false;
    }
}


async function handleFetchMoreResources(question: string) {
    if(!learnMoreContent || !learnMoreError || !learnMoreLoader) return;
    learnMoreContent.innerHTML = '';
    learnMoreError.style.display = 'none';
    learnMoreLoader.style.display = 'block';
    showModal('learn-more-modal');
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            youtubeLinks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, url: { type: Type.STRING } }, required: ["title", "url"] } },
            articleLinks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, url: { type: Type.STRING } }, required: ["title", "url"] } }
        },
        required: ["summary", "youtubeLinks", "articleLinks"]
    };

    try {
        const resources = await fetchMoreResources(question, schema);
        let contentHtml = '';
        if (resources.summary) contentHtml += `<h3>${currentStrings.resourceSummary}</h3><p>${resources.summary.replace(/\n/g, '<br>')}</p>`;
        if (resources.youtubeLinks?.length > 0) {
            contentHtml += `<h3>${currentStrings.resourceVideos}</h3><ul>`;
            resources.youtubeLinks.forEach((link: any) => { contentHtml += `<li><a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.title}</a></li>`; });
            contentHtml += `</ul>`;
        }
        if (resources.articleLinks?.length > 0) {
            contentHtml += `<h3>${currentStrings.resourceArticles}</h3><ul>`;
            resources.articleLinks.forEach((link: any) => { contentHtml += `<li><a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.title}</a></li>`; });
            contentHtml += `</ul>`;
        }
        learnMoreContent.innerHTML = contentHtml;
    } catch (error) {
        console.error("Failed to fetch resources:", error);
        if(learnMoreError) {
            learnMoreError.textContent = "Sorry, I couldn't find resources for that topic right now.";
            learnMoreError.style.display = 'block';
        }
    } finally {
        if(learnMoreLoader) learnMoreLoader.style.display = 'none';
    }
}

// --- QUIZ UI AND LOGIC ---
function showQuizPage(pageToShow: HTMLElement) {
    quizFlowContainer?.querySelectorAll('.page').forEach(page => (page as HTMLElement).classList.remove('active'));
    pageToShow.classList.add('active');
    saveQuizState();
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
    if (!questionsContainer || !quizNavContainer || !totalQuestionsSpan) return;

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
    
    switch (q.questionType) {
        case 'MCQ': case 'TrueFalse': renderMcqOptions(q, optionsContainer); break;
        case 'ShortAnswer': renderShortAnswer(q, optionsContainer); break;
        case 'Ordering': renderOrdering(q, optionsContainer); break;
        case 'Matching': renderMatching(q, optionsContainer); break;
    }

    questionBlock.appendChild(optionsContainer);
    questionsContainer.appendChild(questionBlock);
    const submitAnswerBtn = document.createElement('button');
    submitAnswerBtn.id = 'submit-answer-btn';
    submitAnswerBtn.textContent = currentStrings.submitAnswer;
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
    container.innerHTML = `<div class="ordering-container"><h4>Click the items in the correct order:</h4><div id="ordering-source" class="ordering-list"></div><h4>Your order:</h4><div id="ordering-user" class="ordering-list"></div></div>`;
    const sourceContainer = container.querySelector<HTMLDivElement>('#ordering-source');
    const userContainer = container.querySelector<HTMLDivElement>('#ordering-user');
    if (!sourceContainer || !userContainer) return;
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
    container.innerHTML = `<div class="matching-container"><div class="matching-column" id="matching-prompts"><h4>Prompts</h4></div><div class="matching-column" id="matching-answers"><h4>Answers</h4></div><div class="matches-made-list"></div></div>`;
    const promptsCol = container.querySelector<HTMLDivElement>('#matching-prompts');
    const answersCol = container.querySelector<HTMLDivElement>('#matching-answers');
    if (!promptsCol || !answersCol) return;
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
            const pairContainer = container.querySelector<HTMLDivElement>('.matches-made-list');
            if(pairContainer) {
                const pairEl = document.createElement('div');
                pairEl.classList.add('match-pair');
                pairEl.dataset.prompt = promptEl.dataset.value;
                pairEl.dataset.answer = answerEl.dataset.value;
                pairEl.innerHTML = `<span>${promptEl.textContent}</span> <span>↔️</span> <span>${answerEl.textContent}</span>`;
                pairContainer.appendChild(pairEl);
            }
        }
    });
}

function submitAnswer() {
    if (!questionsContainer) return;
    const q = quizData[currentQuestionIndex];
    let userAnswer: any = null;
    let isCorrect = false;

    switch (q.questionType) {
        case 'MCQ': case 'TrueFalse':
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
            userAnswer = Array.from(matchedPairs).map(pair => ({ prompt: (pair as HTMLElement).dataset.prompt, answer: (pair as HTMLElement).dataset.answer }));
            break;
    }
    
    if (userAnswer) {
        const deepEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);
        const sortedDeepEqual = (a: any, b: any) => {
            const sortFn = (x: any, y: any) => x.prompt.localeCompare(y.prompt);
            return JSON.stringify([...a].sort(sortFn)) === JSON.stringify([...b].sort(sortFn));
        };
        if(q.questionType === 'Ordering') isCorrect = deepEqual(userAnswer, q.correctAnswer);
        else if (q.questionType === 'Matching') isCorrect = userAnswer.length === q.correctAnswer.length && sortedDeepEqual(userAnswer, q.correctAnswer);
        else isCorrect = userAnswer.toLowerCase() === q.correctAnswer.toLowerCase();
    }
    
    userAnswers[currentQuestionIndex] = { questionIndex: currentQuestionIndex, userAnswer, isCorrect };
    
    showAnswerFeedback();
    updateProgressBar();
    saveQuizState();
}

function showAnswerFeedback() {
    if(!questionsContainer || !quizNavContainer) return;
    const q = quizData[currentQuestionIndex];
    const answerData = userAnswers[currentQuestionIndex];

    questionsContainer.querySelectorAll('.option-item, .ordering-item, .matching-item').forEach(opt => opt.classList.add('disabled'));
    questionsContainer.querySelectorAll('input').forEach(input => input.disabled = true);
    
    if (q.questionType === 'MCQ' || q.questionType === 'TrueFalse') {
        questionsContainer.querySelectorAll('.option-item').forEach(opt => {
            const radio = opt.querySelector('input') as HTMLInputElement | null;
            if (radio?.value === q.correctAnswer) opt.classList.add('correct');
            if (radio?.checked && !answerData.isCorrect) opt.classList.add('incorrect');
        });
    }

    const feedbackContainer = document.createElement('div');
    feedbackContainer.classList.add('question-feedback', answerData.isCorrect ? 'correct' : 'incorrect');
    const feedbackHeader = document.createElement('h3');
    feedbackHeader.textContent = answerData.isCorrect ? currentStrings.correct : currentStrings.incorrect;
    feedbackHeader.classList.add(answerData.isCorrect ? 'correct' : 'incorrect');
    const feedbackExplanation = document.createElement('p');
    feedbackExplanation.innerHTML = `<strong>Explanation:</strong> ${q.explanation.replace(/\n/g, '<br>')}`;
    feedbackContainer.appendChild(feedbackHeader);

    if (!answerData.isCorrect && (q.questionType === 'ShortAnswer' || q.questionType === 'Ordering' || q.questionType === 'Matching')) {
        const correctAnswerEl = document.createElement('div');
        let correctAnswerHtml = '<strong>Correct Answer:</strong> ';
        if (q.questionType === 'Ordering') correctAnswerHtml += q.correctAnswer.join(' → ');
        else if (q.questionType === 'Matching') correctAnswerHtml += q.correctAnswer.map((p: any) => `${p.prompt} → ${p.answer}`).join(', ');
        else correctAnswerHtml += q.correctAnswer;
        correctAnswerEl.innerHTML = correctAnswerHtml;
        feedbackContainer.appendChild(correctAnswerEl);
    }
    feedbackContainer.appendChild(feedbackExplanation);
    
    const learnMoreBtn = document.createElement('button');
    learnMoreBtn.textContent = currentStrings.learnMore;
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
    nextBtn.textContent = isLastQuestion ? currentStrings.finishQuiz : currentStrings.nextQuestion;
    nextBtn.addEventListener('click', () => {
        if (isLastQuestion) displayResults(calculateScore());
        else { currentQuestionIndex++; displayCurrentQuestion(); }
    });
    quizNavContainer.appendChild(nextBtn);
}

function updateProgressBar() {
    if (!progressBar) return;
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
    if(timeTakenEl) timeTakenEl.textContent = `${Math.floor(timeTaken / 60).toString().padStart(2, '0')}:${(timeTaken % 60).toString().padStart(2, '0')}`;

    const percentage = quizData.length > 0 ? (score / quizData.length) * 100 : 0;
    if(scoreSpan) scoreSpan.textContent = score.toString();
    if(percentageSpan) percentageSpan.textContent = percentage.toFixed(1);
    
    if(studyAdvice) {
        studyAdvice.classList.remove('passed-message', 'failed-message');
        if (percentage >= passPercentageThreshold) {
            studyAdvice.textContent = currentStrings.passMessage;
            studyAdvice.classList.add('passed-message');
        } else {
            studyAdvice.textContent = currentStrings.failMessage;
            studyAdvice.classList.add('failed-message');
        }
    }
    saveQuizResultToHistory(score);
    if(resultsPage) showQuizPage(resultsPage);
}

function displayReview() {
    if(!reviewContainer) return;
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
            case 'MCQ': case 'TrueFalse':
                const reviewOptionsList = document.createElement('ul');
                reviewOptionsList.classList.add('review-options-list');
                q.options.forEach((optionText: string) => {
                    const reviewOptionItem = document.createElement('li');
                    reviewOptionItem.textContent = optionText;
                    if (optionText === q.correctAnswer) reviewOptionItem.classList.add('correct-answer');
                    if (userAnswerData?.userAnswer === optionText) {
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
                answerContainer.innerHTML = `<p><strong>Your Order:</strong> ${userAnswerData?.userAnswer ? (userAnswerData.userAnswer as string[]).join(' → ') : '<i>Not answered</i>'}</p><p><strong>Correct Order:</strong> ${(q.correctAnswer as string[]).join(' → ')}</p>`;
                break;
            case 'Matching':
                 const correctMatches = (q.correctAnswer as {prompt: string, answer: string}[]).map(p => `<li>${p.prompt} → ${p.answer}</li>`).join('');
                 answerContainer.innerHTML = `<p><strong>Correct Matches:</strong><ul class="review-matching-list">${correctMatches}</ul></p>`;
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
        addToRecallBtn.textContent = isAlreadyInDeck ? currentStrings.addedToRecall : currentStrings.addToRecall;
        addToRecallBtn.disabled = isAlreadyInDeck;
        reviewActions.appendChild(addToRecallBtn);
        
        const learnMoreBtn = document.createElement('button');
        learnMoreBtn.textContent = currentStrings.learnMore;
        learnMoreBtn.classList.add('learn-more-btn');
        learnMoreBtn.dataset.question = q.question;
        reviewActions.appendChild(learnMoreBtn);
        reviewBlock.appendChild(reviewActions);
        reviewContainer.appendChild(reviewBlock);
    });
    if(reviewPage) showQuizPage(reviewPage);
}

function displayHistory() {
    const history: QuizHistoryEntry[] = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
    if (!historyContainer || !historyPage) return;
    historyContainer.innerHTML = '';

    if (history.length === 0) {
        historyContainer.innerHTML = `<p class="no-history-message">${currentStrings.noHistory}</p>`;
    } else {
        history.forEach((entry, index) => {
            const entryEl = document.createElement('div');
            entryEl.classList.add('history-entry');
            entryEl.innerHTML = `<h3>${entry.title}</h3><p><strong>Date:</strong> ${entry.date}</p><p><strong>Mode:</strong> Learning Path</p><p><strong>Score:</strong> ${entry.score}/${entry.total} (${entry.percentage}%)</p><p><strong>Time:</strong> ${entry.timeTaken}</p><div class="button-group"><button class="retake-history-btn" data-history-index="${index}">${currentStrings.retakeQuiz}</button></div>`;
            historyContainer.appendChild(entryEl);
        });
    }
    showQuizPage(historyPage);
}

function startQuizFromData(data: any[], title: string) {
    quizData = data;
    userAnswers = Array(quizData.length).fill(null).map((_, i) => ({ questionIndex: i, userAnswer: null, isCorrect: false }));
    currentQuestionIndex = 0;
    setupQuizUI(title);
    startQuizBtn?.click();
}

export function showQuizCreator() {
    showPage('quiz-creator-page');
}

function setupQuizUI(title: string) {
    if(quizTitle) quizTitle.textContent = title;
    if (preQuizSummaryContainer && summaryContent) {
        if (!quizSummary) {
            preQuizSummaryContainer.style.display = 'none';
            summaryContent.innerHTML = '';
        }
    }
    if(landingPage) showQuizPage(landingPage);
}

function clearFileInput() {
    selectedFile = null;
    if(fileInput) fileInput.value = '';
    if(fileNameDisplay) fileNameDisplay.style.display = 'none';
    if(fileNameSpan) fileNameSpan.textContent = '';
}

function clearImageInput() {
    selectedImageFile = null;
    if(imageInput) imageInput.value = '';
    if(imageNameDisplay) imageNameDisplay.style.display = 'none';
    if(imageNameSpan) imageNameSpan.textContent = '';
}

function handleNewQuiz() {
    clearQuizState();
    initialContext = null;
    showQuizCreator();
    if(promptInput) promptInput.value = '';
    if(subjectInput) subjectInput.value = '';
    clearFileInput();
    clearImageInput();
    promptInput?.focus();
}

function handleAnkiExport() {
    if (!quizData || quizData.length === 0) return;
    const ankiCards = quizData.map(q => {
        let answerText = '';
        switch(q.questionType) {
            case 'MCQ': case 'TrueFalse': case 'ShortAnswer': answerText = `<strong>Correct Answer:</strong> ${q.correctAnswer}`; break;
            case 'Ordering': answerText = `<strong>Correct Order:</strong> ${(q.correctAnswer as string[]).join(' → ')}`; break;
            case 'Matching':
                const correctMatches = (q.correctAnswer as {prompt: string, answer: string}[]).map(p => `<li>${p.prompt} → ${p.answer}</li>`).join('');
                answerText = `<strong>Correct Matches:</strong><ul>${correctMatches}</ul>`; break;
        }
        const front = q.question.replace(/\n/g, "<br>");
        const back = `${answerText}<hr>${q.explanation}`.replace(/\n/g, "<br>");
        return `${front.replace(/\t/g, " ")}\t${back.replace(/\t/g, " ")}`;
    }).join('\n');

    const blob = new Blob([ankiCards], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quizTitle?.textContent?.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'quiz'}_anki_export.txt`;
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
}

function updateTimerDisplay() {
    if (!startTime || !timerEl) return;
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
    const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
    timerEl.textContent = `${minutes}:${seconds}`;
}

// --- SPACED REPETITION (SMART RECALL) ---
function loadRecallDeck(): RecallItem[] { return JSON.parse(localStorage.getItem(RECALL_STORAGE_KEY) || '[]'); }
function saveRecallDeck(deck: RecallItem[]) { localStorage.setItem(RECALL_STORAGE_KEY, JSON.stringify(deck)); updateRecallUI(); }
function getDueRecallItems(): RecallItem[] { const deck = loadRecallDeck(); const now = Date.now(); return deck.filter(item => item.nextReviewDate <= now); }

function updateRecallUI() {
    if (!recallHubBtn || !recallCountBadge) return;
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
    if (deck.some(item => JSON.stringify(item.questionData) === JSON.stringify(questionData))) return;
    const newItem: RecallItem = { id: Date.now(), questionData: questionData, nextReviewDate: Date.now(), interval: 1, easeFactor: 2.5 };
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
        case 'forgot': item.interval = 1; item.easeFactor = Math.max(1.3, item.easeFactor - 0.2); break;
        case 'good': item.interval = Math.ceil(item.interval * item.easeFactor); break;
        case 'easy': item.interval = Math.ceil(item.interval * item.easeFactor * 1.3); item.easeFactor += 0.15; break;
    }
    item.nextReviewDate = Date.now() + item.interval * oneDay;
    deck[itemIndex] = item;
    saveRecallDeck(deck);
}

function startRecallSession() {
    dueRecallItems = getDueRecallItems();
    if (dueRecallItems.length === 0 || !spacedRepetitionPage || !recallSessionContainer || !recallCompleteMessage) return;
    currentRecallIndex = 0;
    showQuizPage(spacedRepetitionPage);
    recallCompleteMessage.style.display = 'none';
    recallSessionContainer.style.display = 'block';
    displayCurrentRecallItem();
}

function displayCurrentRecallItem() {
    if (currentRecallIndex >= dueRecallItems.length) { endRecallSession(); return; }
    if(!recallProgressEl || !recallQuestion || !recallAnswer || !recallShowAnswerBtn || !recallFeedbackBtns) return;
    const item = dueRecallItems[currentRecallIndex];
    const q = item.questionData;
    const progressPercent = (currentRecallIndex / dueRecallItems.length) * 100;
    recallProgressEl.innerHTML = `<div class="progress-bar-inner" style="width: ${progressPercent}%"></div>`;
    recallQuestion.innerHTML = '';
    appendQuestionImage(q, recallQuestion);
    const questionText = document.createElement('div');
    questionText.textContent = q.question;
    recallQuestion.appendChild(questionText);
    recallAnswer.innerHTML = `<strong>Answer:</strong> ${q.explanation.replace(/\n/g, '<br>')}`;
    recallAnswer.style.display = 'none';
    recallShowAnswerBtn.style.display = 'block';
    recallFeedbackBtns.style.display = 'none';
}

function endRecallSession() {
    if(recallSessionContainer) recallSessionContainer.style.display = 'none';
    if(recallCompleteMessage) recallCompleteMessage.style.display = 'block';
    updateRecallUI();
}

// --- INITIALIZATION ---
export function initQuizModule() {
    updateRecallUI();
    generateBtn?.addEventListener('click', () => generateQuiz(false));
    promptInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generateQuiz(false); } });
    cancelBtn?.addEventListener('click', () => {
        isGenerationCancelled = true;
        if(loaderContainer) loaderContainer.style.display = 'none';
        if(generateBtn) { generateBtn.style.display = 'block'; generateBtn.disabled = false; }
    });

    fileInput?.addEventListener('change', () => {
        if (fileInput.files?.length) { selectedFile = fileInput.files[0]; if(fileNameSpan) fileNameSpan.textContent = selectedFile.name; if(fileNameDisplay) fileNameDisplay.style.display = 'flex'; } 
        else { clearFileInput(); }
    });
    removeFileBtn?.addEventListener('click', clearFileInput);

    imageInput?.addEventListener('change', () => {
        if (imageInput.files?.length) { selectedImageFile = imageInput.files[0]; if(imageNameSpan) imageNameSpan.textContent = selectedImageFile.name; if(imageNameDisplay) imageNameDisplay.style.display = 'flex'; }
        else { clearImageInput(); }
    });
    removeImageBtn?.addEventListener('click', clearImageInput);

    startQuizBtn?.addEventListener('click', () => {
        currentQuestionIndex = 0;
        if (timerInterval) clearInterval(timerInterval);
        startTime = Date.now();
        timerInterval = window.setInterval(updateTimerDisplay, 1000);
        displayCurrentQuestion();
        if(quizPage) showQuizPage(quizPage);
    });

    reviewAnswersBtn?.addEventListener('click', displayReview);
    retakeQuizBtn?.addEventListener('click', () => {
        userAnswers = Array(quizData.length).fill(null).map((_, i) => ({ questionIndex: i, userAnswer: null, isCorrect: false }));
        startQuizBtn?.click();
    });

    [newQuizBtn, newQuizBtnFromReview, backToCreatorBtn, recallBackToCreatorBtn].forEach(btn => btn?.addEventListener('click', handleNewQuiz));
    exportAnkiBtn?.addEventListener('click', handleAnkiExport);
    generateDifferentQuizBtn?.addEventListener('click', () => generateQuiz(true));
    generateDifferentQuizBtnFromReview?.addEventListener('click', () => generateQuiz(true));
    backToResultsBtn?.addEventListener('click', () => { if(resultsPage) showQuizPage(resultsPage); });
    quizHistoryBtn?.addEventListener('click', displayHistory);

    historyContainer?.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        if (target.matches('.retake-history-btn')) {
            const index = parseInt(target.dataset.historyIndex || '-1', 10);
            if (index > -1) {
                const history: QuizHistoryEntry[] = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
                if (history[index]) startQuizFromData(history[index].quizData, history[index].title);
            }
        }
    });

    document.body.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.matches('.add-to-recall-btn')) {
            const questionBlock = target.closest('.review-question-block') as HTMLElement;
            if (questionBlock?.dataset.questionIndex) {
                addQuestionToRecall(parseInt(questionBlock.dataset.questionIndex));
                target.textContent = currentStrings.addedToRecall;
                (target as HTMLButtonElement).disabled = true;
            }
        } else if (target.matches('.learn-more-btn')) {
            const question = target.dataset.question;
            if (question) handleFetchMoreResources(question);
        }
    });

    difficultySelector?.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        if (target.matches('.difficulty-btn')) {
            difficultySelector.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
            target.classList.add('active');
            selectedDifficulty = target.dataset.difficulty || 'Mixed';
        }
    });

    explanationLangSelector?.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        if (target.matches('.difficulty-btn')) {
            explanationLangSelector.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
            target.classList.add('active');
            selectedExplanationLang = target.dataset.lang || 'Arabic';
        }
    });

    quizLangSelector?.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        if (target.matches('.difficulty-btn')) {
            quizLangSelector.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
            target.classList.add('active');
            selectedQuizLang = target.dataset.lang || 'English';
        }
    });

    // Spaced Repetition Event Listeners
    recallHubBtn?.addEventListener('click', startRecallSession);
    recallShowAnswerBtn?.addEventListener('click', () => {
        if(recallAnswer) recallAnswer.style.display = 'block';
        if(recallShowAnswerBtn) recallShowAnswerBtn.style.display = 'none';
        if(recallFeedbackBtns) recallFeedbackBtns.style.display = 'flex';
    });
    recallFeedbackBtns?.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const performance = target.dataset.perf as 'forgot' | 'good' | 'easy';
        if (performance) {
            const currentItemId = dueRecallItems[currentRecallIndex].id;
            updateRecallItem(currentItemId, performance);
            currentRecallIndex++;
            displayCurrentRecallItem();
        }
    });
}