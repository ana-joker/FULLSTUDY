

import { Part } from "@google/genai";
import { getAiInstance, startChatSession, generateTitle } from "./api";
import { ChatSession, ChatMessage, PKB } from './state';
import { fileToGenerativePart, estimateTokens } from "./utils";
import { showPage, showError } from "./ui";
import { currentStrings } from "./i18n";
import { appSettings, saveSettings } from "./settings";
import { getActivePKBContent, getActivePKBs } from "./pkb";
import mermaid from 'mermaid';

// --- CONSTANTS ---
const CHAT_HISTORY_KEY = 'chatHistory';
const TOKEN_LIMIT = 1000000;

// --- DOM ELEMENTS (declare only) ---
let chatPage: HTMLElement | null;
let chatListEl: HTMLElement | null;
let newChatBtn: HTMLElement | null;
let systemInstructionContainer: HTMLElement | null;
let systemInstructionInput: HTMLTextAreaElement;
let chatMessagesEl: HTMLElement | null;
let chatInput: HTMLTextAreaElement;
let sendBtn: HTMLButtonElement;
let chatFileInput: HTMLInputElement;
let chatFilePreviewContainer: HTMLElement | null;
let chatLoader: HTMLElement | null;
let recordBtn: HTMLButtonElement;
let stopRecordingBtn: HTMLButtonElement;
let recordingUi: HTMLElement | null;
let recordingTimerEl: HTMLElement | null;
let welcomeMessage: HTMLElement | null;
let chatSettingsTrigger: HTMLElement | null;
let chatSettingsPopover: HTMLElement | null;
let activePKBContainer: HTMLElement | null;
let activePKBHeader: HTMLElement | null;
let activePKBList: HTMLElement | null;
let tokenWarning: HTMLElement | null;
let invokePKBBtn: HTMLElement | null;


// New settings toggles
let autoCreateTitleToggle: HTMLInputElement;
let chatShowWordCountToggle: HTMLInputElement;
let chatShowCharCountToggle: HTMLInputElement;
let chatShowModelNameToggle: HTMLInputElement;
let chatShowTimestampsToggle: HTMLInputElement;
let chatAutoHideCodeBlocksToggle: HTMLInputElement;
let chatEnableSpellcheckToggle: HTMLInputElement;
let chatDisplayMarkdownToggle: HTMLInputElement;
let chatDisplayMermaidToggle: HTMLInputElement;

// Model Param Sliders
let temperatureSlider: HTMLInputElement, topPSlider: HTMLInputElement, topKSlider: HTMLInputElement;
let temperatureValue: HTMLSpanElement, topPValue: HTMLSpanElement, topKValue: HTMLSpanElement;


// --- CHAT STATE ---
export let chatSessions: ChatSession[] = [];
let activeChatSessionId: string | null = null;
let attachedFiles: File[] = [];

// --- MEDIA RECORDER STATE ---
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let recordingTimerInterval: number | null = null;

/**
 * Loads chat history from localStorage.
 */
function loadChatHistory() {
    const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
    chatSessions = savedHistory ? JSON.parse(savedHistory) : [];
    // Sort by pinned status, then by most recently updated
    sortAndSaveChatHistory();
}

/**
 * Saves the entire chat history to localStorage after sorting.
 */
function sortAndSaveChatHistory() {
    chatSessions.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.lastUpdated - a.lastUpdated);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatSessions));
}

/**
 * Switches the main view to the chat page.
 */
export function showChat() {
    showPage('chat-page');
    renderChatList();
    renderActivePKBList(getActivePKBs());
    if (!activeChatSessionId && chatSessions.length > 0) {
        loadChat(chatSessions[0].id);
    } else if (activeChatSessionId) {
        loadChat(activeChatSessionId);
    } else {
        startNewChat();
    }
}

/**
 * Loads the most recently updated chat session.
 * @returns {boolean} - True if a chat was loaded, false otherwise.
 */
export function loadLatestChat(): boolean {
    if (chatSessions.length > 0) {
        showChat();
        loadChat(chatSessions[0].id);
        return true;
    }
    return false;
}


/**
 * Renders the list of chat sessions in the sidebar.
 */
function renderChatList() {
    if (!chatListEl) return;
    chatListEl.innerHTML = '';
    chatSessions.forEach(session => {
        const item = document.createElement('div');
        item.className = `chat-history-item ${session.id === activeChatSessionId ? 'active' : ''} ${session.isPinned ? 'pinned' : ''}`;
        item.dataset.sessionId = session.id;
        
        item.innerHTML = `
            <span class="chat-title-text">${session.title}</span>
            <div class="chat-item-actions">
                <button class="chat-item-action-btn" data-action="pin" title="${session.isPinned ? currentStrings.unpin : currentStrings.pin}">${session.isPinned ? '📌' : '📍'}</button>
                <button class="chat-item-action-btn" data-action="edit" title="${currentStrings.edit}">✏️</button>
                <button class="chat-item-action-btn" data-action="delete" title="${currentStrings.delete}">🗑️</button>
            </div>
        `;

        item.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            // Prevent loading chat if an action button was clicked
            if (!target.closest('.chat-item-actions')) {
                loadChat(session.id);
            }
        });

        chatListEl.appendChild(item);
    });
}

/**
 * Renders the list of active PKBs in the sidebar.
 * @param activePKBs Array of active PKB objects.
 */
export function renderActivePKBList(activePKBs: PKB[]) {
    if (!activePKBContainer || !activePKBList) return;

    if (activePKBs.length > 0) {
        activePKBContainer.style.display = 'block';
        activePKBList.innerHTML = '';
        activePKBs.forEach(pkb => {
            const listItem = document.createElement('li');
            listItem.className = 'active-pkb-list-item';
            listItem.textContent = pkb.name;
            listItem.title = pkb.description;
            activePKBList.appendChild(listItem);
        });
    } else {
        activePKBContainer.style.display = 'none';
    }
}


/**
 * Starts a new, empty chat session.
 */
function startNewChat() {
    activeChatSessionId = null;
    if (chatMessagesEl) {
        chatMessagesEl.innerHTML = '';
        if (welcomeMessage) {
            chatMessagesEl.appendChild(welcomeMessage.cloneNode(true));
        }
    }
    if(systemInstructionInput) systemInstructionInput.value = '';
    clearAttachments();
    renderChatList(); // To remove 'active' class from previous session
}

/**
 * Loads a specific chat session into the main view.
 * @param sessionId The ID of the chat session to load.
 */
function loadChat(sessionId: string) {
    const session = chatSessions.find(s => s.id === sessionId);
    if (!session || !chatMessagesEl) return;
    
    activeChatSessionId = sessionId;
    chatMessagesEl.innerHTML = '';
    
    if (session.history.length === 0 && welcomeMessage) {
         chatMessagesEl.appendChild(welcomeMessage.cloneNode(true));
    } else {
        session.history.forEach(renderMessage);
    }
    
    if(systemInstructionInput) systemInstructionInput.value = session.systemInstruction || '';
    
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    renderChatList();
}

/**
 * Adds a message to the UI.
 * @param message The message object to render.
 */
function renderMessage(message: ChatMessage) {
    if (!chatMessagesEl) return;

    const welcome = chatMessagesEl.querySelector('#chat-welcome-message');
    if (welcome) welcome.remove();

    const messageWrapper = document.createElement('div');
    messageWrapper.className = `chat-message ${message.role}`;
    messageWrapper.id = `message-${message.id}`;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = message.role === 'user' ? '👤' : '🤖';

    const content = document.createElement('div');
    content.className = 'message-content';
    
    // Process markdown and special blocks
    let textHtml = message.text;
    if(appSettings.chatDisplayMarkdown) {
        textHtml = textHtml.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // Basic sanitize
        
        // Process code blocks first
        textHtml = textHtml.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
            const safeCode = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            if (lang.toLowerCase() === 'mermaid' && appSettings.chatDisplayMermaid) {
                return `<pre class="mermaid">${safeCode}</pre>`;
            }
            if (appSettings.chatAutoHideCodeBlocks) {
                return `<details><summary>${lang || 'Code Block'}</summary><pre><code>${safeCode}</code></pre></details>`;
            }
            return `<pre><code>${safeCode}</code></pre>`;
        });
        
        // Process other markdown
        textHtml = textHtml
            .replace(/\n/g, '<br>') 
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>')       // Italic
            .replace(/`([^`]+)`/g, '<code>$1</code>');  // Inline code
    }
    content.innerHTML = textHtml;
    
    // Message Metadata
    const metadataContainer = document.createElement('div');
    metadataContainer.className = 'message-metadata';
    let hasMetadata = false;

    if (appSettings.chatShowWordCount) {
        metadataContainer.innerHTML += `<span>Words: ${message.text.split(/\s+/).filter(Boolean).length}</span>`;
        hasMetadata = true;
    }
    if (appSettings.chatShowCharCount) {
        metadataContainer.innerHTML += `<span>Chars: ${message.text.length}</span>`;
        hasMetadata = true;
    }
    if (appSettings.chatShowModelName && message.role === 'model') {
        metadataContainer.innerHTML += `<span>Model: gemini-2.5-flash</span>`;
        hasMetadata = true;
    }
    if (appSettings.chatShowTimestamps && message.timestamp) {
        metadataContainer.innerHTML += `<span>${message.timestamp}</span>`;
        hasMetadata = true;
    }
    if (hasMetadata) {
        content.appendChild(metadataContainer);
    }
    
    if (message.files && message.files.length > 0) {
        message.files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = file.url;
                content.prepend(img);
            } else if (file.type.startsWith('audio/')) {
                const audio = document.createElement('audio');
                audio.controls = true;
                audio.src = file.url;
                content.prepend(audio);
            }
        });
    }

    const actions = document.createElement('div');
    actions.className = 'message-actions';
    actions.innerHTML = `
        <button class="message-action-btn" data-action="copy" title="${currentStrings.copy}">📋</button>
        ${message.role === 'model' ? `<button class="message-action-btn" data-action="regenerate" title="${currentStrings.regenerate}">🔄</button>` : ''}
        <button class="message-action-btn" data-action="delete" title="${currentStrings.delete}">🗑️</button>
    `;
    content.appendChild(actions);

    messageWrapper.appendChild(avatar);
    messageWrapper.appendChild(content);
    chatMessagesEl.appendChild(messageWrapper);
    
    // Run mermaid if needed
    if (appSettings.chatDisplayMermaid) {
        try {
            mermaid.run({ nodes: messageWrapper.querySelectorAll('.mermaid') });
        } catch(e) {
            console.error("Mermaid rendering failed:", e);
        }
    }
    
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

/**
 * Handles sending a message, including text and attachments.
 */
async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text && attachedFiles.length === 0) return;

    if (!getAiInstance()) {
        showError(currentStrings.apiKeyMissing);
        return;
    }

    if(tokenWarning) tokenWarning.style.display = 'none';

    // --- PKB Integration ---
    const pkbParts = await getActivePKBContent();
    const userParts: Part[] = [];
    const fileMetadataForMessage: ChatMessage['files'] = [];

    if (text) userParts.push({ text });
    for (const file of attachedFiles) {
        userParts.push(await fileToGenerativePart(file));
        fileMetadataForMessage.push({ name: file.name, type: file.type, url: URL.createObjectURL(file) });
    }
    
    const allParts = [...pkbParts, ...userParts];

    // Token check
    const totalTokens = estimateTokens(allParts);
    if (totalTokens > TOKEN_LIMIT) {
        if(tokenWarning) {
            tokenWarning.textContent = currentStrings.tokenWarning;
            tokenWarning.style.display = 'block';
        }
        return;
    }
    // --- End PKB Integration ---

    let isNewChat = false;
    let session: ChatSession;
    if (!activeChatSessionId) {
        isNewChat = true;
        const newSession: ChatSession = {
            id: `chat-${Date.now()}`,
            title: text.substring(0, 30) || "New Chat",
            history: [],
            systemInstruction: systemInstructionInput.value.trim(),
            lastUpdated: Date.now(),
            isPinned: false,
        };
        chatSessions.unshift(newSession);
        session = newSession;
        activeChatSessionId = newSession.id;
    } else {
        session = chatSessions.find(s => s.id === activeChatSessionId)!;
        session.lastUpdated = Date.now();
        session.systemInstruction = systemInstructionInput.value.trim();
    }

    const userMessage: ChatMessage = {
        id: Date.now(),
        role: 'user',
        parts: allParts, // Use all parts (PKB + user) for history
        text: text, // Keep original user text for display
        files: fileMetadataForMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    session.history.push(userMessage);
    renderMessage(userMessage);
    
    if (isNewChat && appSettings.autoCreateTitle && text) {
        session.title = await generateTitle(text);
    }
    
    renderChatList();

    chatInput.value = '';
    chatInput.style.height = 'auto';
    clearAttachments();
    sendBtn.disabled = true;

    if (chatLoader) chatLoader.style.display = 'flex';

    try {
        const chat = await startChatSession(session.history.map(m => ({ role: m.role, parts: m.parts })), session.systemInstruction, appSettings.modelParams);
        if (!chat) throw new Error("Failed to start chat session.");
        
        const resultStream = await chat.sendMessageStream({ message: allParts });
        
        let responseText = '';
        const modelMessage: ChatMessage = {
            id: Date.now() + 1,
            role: 'model',
            parts: [],
            text: '...',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        session.history.push(modelMessage);
        renderMessage(modelMessage);
        const modelMessageEl = document.getElementById(`message-${modelMessage.id}`);
        const modelContentEl = modelMessageEl?.querySelector('.message-content');

        if(chatLoader) chatLoader.style.display = 'none';
        
        for await (const chunk of resultStream) {
            responseText += chunk.text;
            if (modelContentEl?.firstChild) {
                // Just update the main text content, preserving other elements
                modelContentEl.firstChild.nodeValue = responseText;
                chatMessagesEl!.scrollTop = chatMessagesEl!.scrollHeight;
            }
        }
        
        modelMessage.text = responseText;
        modelMessage.parts = [{ text: responseText }];
        
        // Re-render the final message to process markdown and add actions
        if(modelMessageEl) {
            chatMessagesEl?.removeChild(modelMessageEl);
        }
        renderMessage(modelMessage);

    } catch (err) {
        console.error(err);
        showError(err instanceof Error ? err.message : "An error occurred.");
        const errorMessage: ChatMessage = { id: Date.now() + 1, role: 'model', parts: [], text: `Sorry, an error occurred: ${err instanceof Error ? err.message : 'Unknown error'}` };
        session.history.push(errorMessage);
        renderMessage(errorMessage);
    } finally {
        if(chatLoader) chatLoader.style.display = 'none';
        sortAndSaveChatHistory();
        renderChatList();
    }
}


/**
 * Handles clicks on sidebar chat item actions (pin, edit, delete).
 * @param e The click event.
 */
function handleChatItemAction(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const button = target.closest<HTMLElement>('.chat-item-action-btn');
    if (!button) return;

    const action = button.dataset.action;
    if (!action) return;

    const itemEl = target.closest<HTMLElement>('.chat-history-item');
    const sessionId = itemEl?.dataset.sessionId;
    if (!sessionId) return;
    
    const session = chatSessions.find(s => s.id === sessionId);
    if (!session) return;
    
    e.stopPropagation(); // Prevent chat from loading

    switch(action) {
        case 'pin':
            session.isPinned = !session.isPinned;
            sortAndSaveChatHistory();
            renderChatList();
            break;
        case 'edit':
            const titleEl = itemEl.querySelector('.chat-title-text') as HTMLElement;
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'chat-title-input';
            input.value = session.title;
            
            titleEl.replaceWith(input);
            input.focus();
            input.select();
            
            const saveTitle = () => {
                session.title = input.value.trim() || 'Untitled Chat';
                sortAndSaveChatHistory();
                renderChatList();
            };

            input.addEventListener('blur', saveTitle);
            input.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter') input.blur();
                if (ev.key === 'Escape') {
                    input.value = session.title; // revert
                    input.blur();
                }
            });
            break;
        case 'delete':
            handleDeleteChat(sessionId);
            break;
    }
}

/**
 * Deletes a chat session after confirmation.
 * @param sessionId The ID of the session to delete.
 */
function handleDeleteChat(sessionId: string) {
    if (confirm(currentStrings.chatDeleteConfirm)) {
        chatSessions = chatSessions.filter(s => s.id !== sessionId);
        if (activeChatSessionId === sessionId) {
            startNewChat();
        }
        sortAndSaveChatHistory();
        renderChatList();
    }
}

/**
 * Handles actions on a message (copy, regenerate, delete).
 * @param e The click event.
 */
function handleMessageAction(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const button = target.closest<HTMLElement>('.message-action-btn');
    if (!button) return;

    const action = button.dataset.action;
    if (!action) return;
    
    const messageEl = target.closest('.chat-message');
    const messageId = Number(messageEl?.id.replace('message-', ''));
    if (!messageId || !activeChatSessionId) return;

    const session = chatSessions.find(s => s.id === activeChatSessionId);
    if (!session) return;
    
    const messageIndex = session.history.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    switch (action) {
        case 'copy':
            navigator.clipboard.writeText(session.history[messageIndex].text);
            break;
        case 'delete':
            session.history.splice(messageIndex, 1);
            messageEl?.remove();
            sortAndSaveChatHistory();
            break;
        case 'regenerate':
            if (messageIndex > 0 && session.history[messageIndex - 1].role === 'user') {
                session.history.splice(messageIndex);
                messageEl?.remove();
                const lastUserMessage = session.history[session.history.length-1];
                if (lastUserMessage) {
                    // This simple version doesn't re-attach files.
                    chatInput.value = lastUserMessage.text;
                    sendMessage();
                }
            }
            break;
    }
}

function handleFileAttachment(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;
    attachedFiles.push(...Array.from(input.files));
    renderFilePreviews();
    sendBtn.disabled = false;
    input.value = '';
}

function renderFilePreviews() {
    if (!chatFilePreviewContainer) return;
    chatFilePreviewContainer.innerHTML = '';
    attachedFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-preview-item';
        item.textContent = file.name;
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-file-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => {
            attachedFiles.splice(index, 1);
            renderFilePreviews();
        };
        item.appendChild(removeBtn);
        chatFilePreviewContainer.appendChild(item);
    });
}

function clearAttachments() {
    attachedFiles = [];
    renderFilePreviews();
}

async function handleVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        stopRecordingBtn?.click();
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.addEventListener("dataavailable", event => audioChunks.push(event.data));
            mediaRecorder.addEventListener("stop", () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
                attachedFiles.push(audioFile);
                renderFilePreviews();
                sendBtn.disabled = false;
                stream.getTracks().forEach(track => track.stop());
            });

            mediaRecorder.start();
            if (recordingUi) recordingUi.style.display = 'flex';
            if (recordBtn) recordBtn.classList.add('recording');
            
            let seconds = 0;
            if (recordingTimerInterval) clearInterval(recordingTimerInterval);
            recordingTimerInterval = window.setInterval(() => {
                seconds++;
                const min = Math.floor(seconds / 60).toString().padStart(2, '0');
                const sec = (seconds % 60).toString().padStart(2, '0');
                if (recordingTimerEl) recordingTimerEl.textContent = `${min}:${sec}`;
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            showError("Could not access microphone. Please check permissions.");
        }
    }
}

function initModelParamSliders() {
    if (!temperatureSlider || !topPSlider || !topKSlider || !temperatureValue || !topPValue || !topKValue) return;

    const params = appSettings.modelParams;

    // Set initial values from settings
    temperatureSlider.value = String(params.temperature);
    temperatureValue.textContent = String(params.temperature.toFixed(1));
    topPSlider.value = String(params.topP);
    topPValue.textContent = String(params.topP.toFixed(2));
    topKSlider.value = String(params.topK);
    topKValue.textContent = String(params.topK);

    // Add event listeners
    temperatureSlider.addEventListener('input', () => {
        const val = parseFloat(temperatureSlider.value);
        appSettings.modelParams.temperature = val;
        temperatureValue.textContent = val.toFixed(1);
        saveSettings();
    });

    topPSlider.addEventListener('input', () => {
        const val = parseFloat(topPSlider.value);
        appSettings.modelParams.topP = val;
        topPValue.textContent = val.toFixed(2);
        saveSettings();
    });

    topKSlider.addEventListener('input', () => {
        const val = parseInt(topKSlider.value, 10);
        appSettings.modelParams.topK = val;
        topKValue.textContent = String(val);
        saveSettings();
    });
}

function initChatSettings() {
    // Populate popover with current settings
    autoCreateTitleToggle.checked = appSettings.autoCreateTitle;
    chatShowWordCountToggle.checked = appSettings.chatShowWordCount;
    chatShowCharCountToggle.checked = appSettings.chatShowCharCount;
    chatShowModelNameToggle.checked = appSettings.chatShowModelName;
    chatShowTimestampsToggle.checked = appSettings.chatShowTimestamps;
    chatAutoHideCodeBlocksToggle.checked = appSettings.chatAutoHideCodeBlocks;
    chatEnableSpellcheckToggle.checked = appSettings.chatEnableSpellcheck;
    chatDisplayMarkdownToggle.checked = appSettings.chatDisplayMarkdown;
    chatDisplayMermaidToggle.checked = appSettings.chatDisplayMermaid;
    
    chatInput.spellcheck = appSettings.chatEnableSpellcheck;

    initModelParamSliders();

    // Add event listeners
    chatSettingsTrigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        if(chatSettingsPopover) {
            chatSettingsPopover.style.display = chatSettingsPopover.style.display === 'none' 
            ? 'block'
            : 'none';
        }
    });

    document.body.addEventListener('click', (e) => {
        if(chatSettingsPopover && !chatSettingsPopover.contains(e.target as Node) && !chatSettingsTrigger?.contains(e.target as Node)) {
            chatSettingsPopover.style.display = 'none';
        }
    });

    chatSettingsPopover?.addEventListener('click', (e) => e.stopPropagation());

    const save = () => { saveSettings(); };

    autoCreateTitleToggle.addEventListener('change', () => { appSettings.autoCreateTitle = autoCreateTitleToggle.checked; save(); });
    chatShowWordCountToggle.addEventListener('change', () => { appSettings.chatShowWordCount = chatShowWordCountToggle.checked; save(); });
    chatShowCharCountToggle.addEventListener('change', () => { appSettings.chatShowCharCount = chatShowCharCountToggle.checked; save(); });
    chatShowModelNameToggle.addEventListener('change', () => { appSettings.chatShowModelName = chatShowModelNameToggle.checked; save(); });
    chatShowTimestampsToggle.addEventListener('change', () => { appSettings.chatShowTimestamps = chatShowTimestampsToggle.checked; save(); });
    chatAutoHideCodeBlocksToggle.addEventListener('change', () => { appSettings.chatAutoHideCodeBlocks = chatAutoHideCodeBlocksToggle.checked; save(); });
    chatEnableSpellcheckToggle.addEventListener('change', () => { 
        appSettings.chatEnableSpellcheck = chatEnableSpellcheckToggle.checked;
        chatInput.spellcheck = appSettings.chatEnableSpellcheck;
        save();
    });
    chatDisplayMarkdownToggle.addEventListener('change', () => { appSettings.chatDisplayMarkdown = chatDisplayMarkdownToggle.checked; save(); });
    chatDisplayMermaidToggle.addEventListener('change', () => { appSettings.chatDisplayMermaid = chatDisplayMermaidToggle.checked; save(); });
}

export function initChatModule() {
    // --- INITIALIZE DOM ELEMENTS ---
    chatPage = document.getElementById('chat-page');
    chatListEl = document.getElementById('chat-list');
    newChatBtn = document.getElementById('new-chat-btn');
    systemInstructionContainer = document.getElementById('system-instruction-container');
    systemInstructionInput = document.getElementById('system-instruction-input') as HTMLTextAreaElement;
    chatMessagesEl = document.getElementById('chat-messages');
    chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
    sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
    chatFileInput = document.getElementById('chat-file-input') as HTMLInputElement;
    chatFilePreviewContainer = document.getElementById('chat-file-preview-container');
    chatLoader = document.getElementById('chat-loader');
    recordBtn = document.getElementById('record-btn') as HTMLButtonElement;
    stopRecordingBtn = document.getElementById('stop-recording-btn') as HTMLButtonElement;
    recordingUi = document.getElementById('recording-ui');
    recordingTimerEl = document.getElementById('recording-timer');
    welcomeMessage = document.getElementById('chat-welcome-message');
    chatSettingsTrigger = document.getElementById('chat-settings-trigger');
    chatSettingsPopover = document.getElementById('chat-settings-popover');
    activePKBContainer = document.getElementById('active-pkb-container');
    activePKBHeader = document.getElementById('active-pkb-header');
    activePKBList = document.getElementById('active-pkb-list');
    tokenWarning = document.getElementById('token-warning');
    invokePKBBtn = document.getElementById('invoke-pkb-btn');

    
    // New Toggles
    autoCreateTitleToggle = document.getElementById('auto-create-title-toggle') as HTMLInputElement;
    chatShowWordCountToggle = document.getElementById('chat-show-word-count-toggle') as HTMLInputElement;
    chatShowCharCountToggle = document.getElementById('chat-show-char-count-toggle') as HTMLInputElement;
    chatShowModelNameToggle = document.getElementById('chat-show-model-name-toggle') as HTMLInputElement;
    chatShowTimestampsToggle = document.getElementById('chat-show-timestamps-toggle') as HTMLInputElement;
    chatAutoHideCodeBlocksToggle = document.getElementById('chat-auto-hide-code-blocks-toggle') as HTMLInputElement;
    chatEnableSpellcheckToggle = document.getElementById('chat-enable-spellcheck-toggle') as HTMLInputElement;
    chatDisplayMarkdownToggle = document.getElementById('chat-display-markdown-toggle') as HTMLInputElement;
    chatDisplayMermaidToggle = document.getElementById('chat-display-mermaid-toggle') as HTMLInputElement;

    // Model Param Sliders
    temperatureSlider = document.getElementById('chat-temperature-slider') as HTMLInputElement;
    temperatureValue = document.getElementById('chat-temperature-value') as HTMLSpanElement;
    topPSlider = document.getElementById('chat-topp-slider') as HTMLInputElement;
    topPValue = document.getElementById('chat-topp-value') as HTMLSpanElement;
    topKSlider = document.getElementById('chat-topk-slider') as HTMLInputElement;
    topKValue = document.getElementById('chat-topk-value') as HTMLSpanElement;


    // Initialize Mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: appSettings.theme === 'dark' ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit'
    });

    loadChatHistory();
    initChatSettings();
    
    newChatBtn?.addEventListener('click', startNewChat);
    sendBtn?.addEventListener('click', sendMessage);
    chatInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    chatInput?.addEventListener('input', () => {
        if(chatInput) {
            chatInput.style.height = 'auto';
            chatInput.style.height = `${chatInput.scrollHeight}px`;
        }
        if(sendBtn && chatInput) sendBtn.disabled = chatInput.value.trim().length === 0 && attachedFiles.length === 0;
    });

    chatFileInput?.addEventListener('change', handleFileAttachment);
    chatMessagesEl?.addEventListener('click', handleMessageAction);
    chatListEl?.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('.chat-item-action-btn');
        if (target) {
            handleChatItemAction(e as MouseEvent);
        }
    });
    
    systemInstructionContainer?.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('#system-instruction-header')) {
            systemInstructionContainer.classList.toggle('open');
        }
    });

    activePKBHeader?.addEventListener('click', () => {
        activePKBContainer?.classList.toggle('open');
    });

    recordBtn?.addEventListener('click', handleVoiceRecording);
    stopRecordingBtn?.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
        if (recordingUi) recordingUi.style.display = 'none';
        if (recordBtn) recordBtn.classList.remove('recording');
        if (recordingTimerInterval) clearInterval(recordingTimerInterval);
        if (recordingTimerEl) recordingTimerEl.textContent = '00:00';
    });
}