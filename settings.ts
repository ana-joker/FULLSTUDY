import { applyLanguage, currentStrings } from './i18n';
import { initializeAi, setAiInstance } from './api';
import { showModal } from './ui';
import { chatSessions } from './chat';
import { GoogleGenAI } from '@google/genai';

// --- TYPES ---
export type AppSettings = {
    // General
    language: 'ar' | 'en';
    theme: 'light' | 'dark';
    fontSize: 'small' | 'medium' | 'large';
    startupPage: 'home' | 'last-session';
    apiKey: string | null;
    
    // Chat Specific (but stored in one object for simplicity)
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
    autoCreateTitle: boolean;
    streamingOutput: boolean;
    displayMarkdown: boolean;
    showTimestamps: boolean;
};

// --- DOM SELECTORS (declared, but not initialized) ---
let body: HTMLElement;
let mainContainer: HTMLDivElement | null;
let settingsModal: HTMLElement | null;
let settingsCloseBtn: HTMLElement | null;
let languageSelector: HTMLElement | null;
let themeSelector: HTMLElement | null;
let fontSizeSelector: HTMLElement | null;
let startupPageSelector: HTMLElement | null;
let apiKeyInput: HTMLInputElement | null;
let saveApiKeyBtn: HTMLElement | null;
let clearApiKeyBtn: HTMLElement | null;
let apiKeyStatus: HTMLParagraphElement | null;
let exportDataBtn: HTMLElement | null;

// --- STATE ---
const SETTINGS_KEY = 'interactiveQuizSettings';
export let appSettings: AppSettings;
const defaultSettings: AppSettings = {
    language: 'ar',
    theme: 'dark',
    fontSize: 'medium',
    startupPage: 'home',
    temperature: 0.5,
    topK: 32,
    topP: 0.95,
    maxOutputTokens: 8192,
    apiKey: null,
    autoCreateTitle: true,
    streamingOutput: true,
    displayMarkdown: true,
    showTimestamps: false,
};

// --- FUNCTIONS ---
export function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings));
}

export function loadSettings() {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    appSettings = savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : { ...defaultSettings };
    // Applying settings is now part of the init function,
    // which runs after the DOM is ready.
}

function applyTheme(theme: 'light' | 'dark') {
    appSettings.theme = theme;
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(`${theme}-theme`);
    if(themeSelector) {
        themeSelector.querySelectorAll('.setting-btn').forEach(btn => {
            btn.classList.remove('active');
            if ((btn as HTMLButtonElement).dataset.theme === theme) {
                btn.classList.add('active');
            }
        });
    }
}

function applyFontSize(size: string) {
    if (!mainContainer || !fontSizeSelector) return;
    appSettings.fontSize = size as AppSettings['fontSize'];
    mainContainer.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    mainContainer.classList.add(`font-size-${size}`);
    fontSizeSelector.querySelectorAll('.font-size-btn').forEach(btn => {
        btn.classList.remove('active');
        if ((btn as HTMLButtonElement).dataset.size === size) {
            btn.classList.add('active');
        }
    });
}

function applyAllSettings() {
    // Apply General Settings to the UI
    applyLanguage(appSettings.language);
    applyTheme(appSettings.theme);
    applyFontSize(appSettings.fontSize);
    
    // Update UI elements in the general settings modal
    const startupInput = document.querySelector(`input[name="startup-page"][value="${appSettings.startupPage}"]`) as HTMLInputElement | null;
    if (startupInput) startupInput.checked = true;

    if (appSettings.apiKey && apiKeyInput) { apiKeyInput.value = appSettings.apiKey; }
    
    initializeAi(appSettings.apiKey);
}

async function verifyAndSaveApiKey(key: string) {
    if (!apiKeyStatus || !apiKeyInput) return;

    apiKeyStatus.textContent = 'Verifying...';
    apiKeyStatus.className = 'setting-description';
    
    try {
        const tempAi = new GoogleGenAI({ apiKey: key });
        await tempAi.models.generateContent({model: 'gemini-2.5-flash', contents: 'test'}); 

        // If successful
        appSettings.apiKey = key;
        saveSettings();
        setAiInstance(tempAi);
        apiKeyStatus.textContent = currentStrings.apiKeySaved;
        apiKeyStatus.classList.add('success');

    } catch (error) {
        console.error("API Key validation failed", error);
        appSettings.apiKey = null;
        saveSettings();
        setAiInstance(null);
        if(apiKeyInput) apiKeyInput.value = '';
        apiKeyStatus.textContent = currentStrings.apiKeyInvalid;
        apiKeyStatus.classList.add('error');
    }
}

function exportData() {
    const dataToExport = {
        settings: appSettings,
        chatHistory: chatSessions,
        quizHistory: JSON.parse(localStorage.getItem('interactiveQuizHistory') || '[]'),
        recallDeck: JSON.parse(localStorage.getItem('interactiveQuizRecallDeck') || '[]'),
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_hub_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function initSettingsModule() {
    // Initialize selectors now that the DOM is ready
    body = document.body;
    mainContainer = document.querySelector('.main-container');
    settingsModal = document.getElementById('general-settings-modal');
    settingsCloseBtn = document.getElementById('settings-close-btn');
    languageSelector = document.getElementById('language-selector');
    themeSelector = document.getElementById('theme-selector');
    fontSizeSelector = document.getElementById('font-size-selector');
    startupPageSelector = document.getElementById('startup-page-selector');
    apiKeyInput = document.getElementById('api-key-input') as HTMLInputElement | null;
    saveApiKeyBtn = document.getElementById('save-api-key-btn');
    clearApiKeyBtn = document.getElementById('clear-api-key-btn');
    apiKeyStatus = document.getElementById('api-key-status') as HTMLParagraphElement | null;
    exportDataBtn = document.getElementById('export-data-btn');
    
    applyAllSettings();
    
    const settingsTriggers = document.querySelectorAll('.general-settings-trigger');
    settingsTriggers.forEach(btn => {
        btn.addEventListener('click', () => showModal('general-settings-modal'));
    });

    settingsCloseBtn?.addEventListener('click', () => {
        saveSettings();
        showModal('general-settings-modal', false);
    });

    // --- General Settings Listeners ---
    languageSelector?.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        if (target.matches('.setting-btn')) {
            const lang = target.dataset.lang as AppSettings['language'];
            if (lang) {
                appSettings.language = lang;
                applyLanguage(lang);
                 languageSelector?.querySelectorAll('.setting-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if ((btn as HTMLButtonElement).dataset.lang === lang) btn.classList.add('active');
                });
            }
        }
    });

    themeSelector?.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        if (target.matches('.setting-btn')) {
            const theme = target.dataset.theme as AppSettings['theme'];
            if (theme) applyTheme(theme);
        }
    });

    fontSizeSelector?.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        if (target.matches('.font-size-btn')) {
            const size = target.dataset.size;
            if (size) applyFontSize(size);
        }
    });
    
    startupPageSelector?.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        appSettings.startupPage = target.value as AppSettings['startupPage'];
    });
    
    exportDataBtn?.addEventListener('click', exportData);

    // --- API Key Listeners ---
    saveApiKeyBtn?.addEventListener('click', () => {
        if (apiKeyInput) {
            const key = apiKeyInput.value.trim();
            if (key) {
                verifyAndSaveApiKey(key);
            }
        }
    });

    clearApiKeyBtn?.addEventListener('click', () => {
        if (apiKeyInput && apiKeyStatus) {
            appSettings.apiKey = null;
            saveSettings();
            setAiInstance(null);
            apiKeyInput.value = '';
            apiKeyStatus.textContent = currentStrings.apiKeyCleared;
            apiKeyStatus.className = 'setting-description success';
        }
    });
}