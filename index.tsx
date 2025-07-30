/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initQuizModule, showQuizCreator, resumeQuiz, loadQuizState, clearQuizState } from './quiz';
import { initChatModule, showChat, loadLatestChat } from './chat';
import { initSettingsModule, loadSettings, appSettings } from './settings';
import { initializeUiText } from './i18n';
import { showPage, showModal } from './ui';
import { initPKBModule } from './pkb';

// --- DOM ELEMENT SELECTORS (will be initialized in main) ---
let navigateToChatBtn: HTMLElement | null;
let navigateToQuizBtn: HTMLElement | null;
let navigateToPKBBtn: HTMLElement | null;
let backToHomeBtns: NodeListOf<Element>;
let resumePromptContainer: HTMLElement | null;
let resumeYesBtn: HTMLElement | null;
let resumeNoBtn: HTMLElement | null;


/**
 * Initializes the entire application.
 */
async function main() {
    // --- INITIALIZE DOM ELEMENT SELECTORS ---
    navigateToChatBtn = document.getElementById('navigate-to-chat');
    navigateToQuizBtn = document.getElementById('navigate-to-quiz');
    navigateToPKBBtn = document.getElementById('navigate-to-pkb');
    backToHomeBtns = document.querySelectorAll('.back-to-home-btn');
    resumePromptContainer = document.getElementById('resume-prompt-container');
    resumeYesBtn = document.getElementById('resume-yes-btn');
    resumeNoBtn = document.getElementById('resume-no-btn');
    
    // 1. Load settings and apply them (theme, language, etc.)
    loadSettings();
    initializeUiText();

    // 2. Initialize feature modules
    initSettingsModule();
    initQuizModule();
    initChatModule();
    await initPKBModule();

    // 3. Setup top-level navigation
    navigateToChatBtn?.addEventListener('click', () => {
        showChat();
    });

    navigateToQuizBtn?.addEventListener('click', () => {
        showQuizCreator();
    });

    // PKB navigation is handled within its own module (initPKBModule)

    backToHomeBtns.forEach(btn => {
        btn.addEventListener('click', () => showPage('home-page'));
    });

    // 4. Check for a quiz to resume or a chat session to load
    const savedQuizState = loadQuizState();
    if (savedQuizState) {
        if(resumePromptContainer) showModal('resume-prompt-container');
    } else if (appSettings.startupPage === 'last-session') {
        if (!loadLatestChat()) {
            // if no chat to load, default to home
            showPage('home-page');
        }
    } else {
         showPage('home-page');
    }

    // 5. Setup resume listeners
    resumeYesBtn?.addEventListener('click', () => {
        const savedState = loadQuizState();
        if (savedState) {
            resumeQuiz(savedState);
        }
        if(resumePromptContainer) showModal('resume-prompt-container', false);
    });

    resumeNoBtn?.addEventListener('click', () => {
        clearQuizState();
        if(resumePromptContainer) showModal('resume-prompt-container', false);
    });
}

// --- APP ENTRY POINT ---
document.addEventListener('DOMContentLoaded', main);