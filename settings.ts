import { applyLanguage, currentStrings, initializeUiText } from './i18n';
import { initializeAi, getAiInstance, setAiInstance } from './api';
import { showModal } from './ui';
import { chatSessions } from './chat';

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

// --- DOM SELECTORS ---
const body = document.body;
const mainContainer = document.querySelector('.main-container') as HTMLDivElement | null;
const settingsModal = document.getElementById('general-settings-modal');
const settingsCloseBtn = document.getElementById('settings-close-btn');

// General
const languageSelector = document.getElementById('language-selector');
const themeSelector = document.getElementById('theme-selector');
const fontSizeSelector = document.getElementById('font-size-selector');
const startupPageSelector = document.getElementById('startup-page-selector');
const apiKeyInput = document.getElementById('api-key-input') as HTMLInputElement | null;
const saveApiKeyBtn = document.getElementById('save-api-key-btn');
const clearApiKeyBtn = document.getElementById('clear-api-key-btn');
const apiKeyStatus = document.getElementById('api-key-status') as HTMLParagraphElement | null;
const exportDataBtn = document.getElementById('export-data-btn');

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
    applyAllSettings();
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
    
    // The API key is not part of the UI but needs to be initialized
    // Quiz/Chat specific settings are applied within their own modules
    initializeAi(appSettings.apiKey);
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
                applyLanguage(lang); // This will also call initializeUiText
                 languageSelector.querySelectorAll('.setting-btn').forEach(btn => {
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
}