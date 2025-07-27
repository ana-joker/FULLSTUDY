/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initQuizModule, showQuizCreator, resumeQuiz, loadQuizState, clearQuizState } from './quiz';
import { initChatModule, showChat, loadLatestChat } from './chat';
import { initSettingsModule, loadSettings, appSettings } from './settings';
import { initializeUiText } from './i18n';
import { showPage, showModal } from './ui';

// --- DOM ELEMENT SELECTORS ---
const navigateToChatBtn = document.getElementById('navigate-to-chat');
const navigateToQuizBtn = document.getElementById('navigate-to-quiz');
const backToHomeBtns = document.querySelectorAll('.back-to-home-btn');
const resumePromptContainer = document.getElementById('resume-prompt-container');
const resumeYesBtn = document.getElementById('resume-yes-btn');
const resumeNoBtn = document.getElementById('resume-no-btn');

/**
 * Initializes the entire application.
 */
function main() {
    // 1. Load settings and apply them (theme, language, etc.)
    loadSettings();
    initializeUiText();

    // 2. Initialize feature modules
    initSettingsModule();
    initQuizModule();
    initChatModule();

    // 3. Setup top-level navigation
    navigateToChatBtn?.addEventListener('click', () => {
        showChat();
    });

    navigateToQuizBtn?.addEventListener('click', () => {
        showQuizCreator();
    });

    backToHomeBtns.forEach(btn => {
        btn.addEventListener('click', () => showPage('home-page'));
    });

    // 4. Check for a quiz to resume or a chat session to load
    const savedQuizState = loadQuizState();
    if (savedQuizState) {
        showModal('resume-prompt-container');
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
        showModal('resume-prompt-container', false);
    });

    resumeNoBtn?.addEventListener('click', () => {
        clearQuizState();
        showModal('resume-prompt-container', false);
    });
}

// --- APP ENTRY POINT ---
document.addEventListener('DOMContentLoaded', main);