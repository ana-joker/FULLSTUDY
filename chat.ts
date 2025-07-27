
import { Part } from "@google/genai";
import { getAiInstance, startChatSession, generateTitle } from "./api";
import { ChatSession, ChatMessage } from './state';
import { fileToGenerativePart } from "./utils";
import { showPage, showError } from "./ui";
import { currentStrings } from "./i18n";
import { appSettings, saveSettings } from "./settings";

// --- CONSTANTS ---
const CHAT_HISTORY_KEY = 'chatHistory';

// --- DOM ELEMENTS ---
const chatPage = document.getElementById('chat-page');
const chatListEl = document.getElementById('chat-list');
const newChatBtn = document.getElementById('new-chat-btn');
const systemInstructionContainer = document.getElementById('system-instruction-container');
const systemInstructionInput = document.getElementById('system-instruction-input') as HTMLTextAreaElement;
const chatMessagesEl = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
const chatFileInput = document.getElementById('chat-file-input') as HTMLInputElement;
const chatFilePreviewContainer = document.getElementById('chat-file-preview-container');
const chatLoader = document.getElementById('chat-loader');
const recordBtn = document.getElementById('record-btn') as HTMLButtonElement;
const stopRecordingBtn = document.getElementById('stop-recording-btn') as HTMLButtonElement;
const recordingUi = document.getElementById('recording-ui');
const recordingTimerEl = document.getElementById('recording-timer');
const welcomeMessage = document.getElementById('chat-welcome-message');
const chatSettingsTrigger = document.getElementById('chat-settings-trigger');
const chatSettingsPopover = document.getElementById('chat-settings-popover');

// Chat Settings Popover Elements
const temperatureSlider = document.getElementById('temperature-slider') as HTMLInputElement | null;
const temperatureValue = document.getElementById('temperature-value') as HTMLSpanElement | null;
const topkSlider = document.getElementById('topk-slider') as HTMLInputElement | null;
const topkValue = document.getElementById('topk-value') as HTMLSpanElement | null;
const toppSlider = document.getElementById('topp-slider') as HTMLInputElement | null;
const toppValue = document.getElementById('topp-value') as HTMLSpanElement | null;
const maxTokensSlider = document.getElementById('max-tokens-slider') as HTMLInputElement | null;
const maxTokensValue = document.getElementById('max-tokens-value') as HTMLSpanElement | null;
const autoCreateTitleToggle = document.getElementById('auto-create-title-toggle') as HTMLInputElement;
const streamingOutputToggle = document.getElementById('streaming-output-toggle') as HTMLInputElement;


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
    systemInstructionInput.value = '';
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
    
    systemInstructionInput.value = session.systemInstruction || '';
    
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
    
    let textHtml = message.text;
    if(appSettings.displayMarkdown) {
        textHtml = textHtml
            .replace(/</g, "&lt;").replace(/>/g, "&gt;") // Basic sanitize
            .replace(/\n/g, '<br>') 
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>')       // Italic
            .replace(/`([^`]+)`/g, '<code>$1</code>');  // Inline code
    }
    content.innerHTML = textHtml;
    
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

    const userParts: Part[] = [];
    const fileMetadataForMessage: ChatMessage['files'] = [];

    if (text) userParts.push({ text });

    for (const file of attachedFiles) {
        userParts.push(await fileToGenerativePart(file));
        fileMetadataForMessage.push({ name: file.name, type: file.type, url: URL.createObjectURL(file) });
    }

    const userMessage: ChatMessage = {
        id: Date.now(),
        role: 'user',
        parts: userParts,
        text: text,
        files: fileMetadataForMessage,
        timestamp: new Date().toLocaleTimeString()
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
        const chat = await startChatSession(session.history.map(m => ({ role: m.role, parts: m.parts })), session.systemInstruction);
        if (!chat) throw new Error("Failed to start chat session.");
        
        const resultStream = await chat.sendMessageStream({ message: userParts });
        
        let responseText = '';
        const modelMessage: ChatMessage = {
            id: Date.now() + 1,
            role: 'model',
            parts: [],
            text: '...',
            timestamp: new Date().toLocaleTimeString()
        };
        
        let modelMessageEl: HTMLElement | null | undefined;
        
        if (appSettings.streamingOutput) {
            session.history.push(modelMessage);
            renderMessage(modelMessage);
            modelMessageEl = document.getElementById(`message-${modelMessage.id}`)?.querySelector('.message-content');
        }

        if(chatLoader) chatLoader.style.display = 'none';
        
        for await (const chunk of resultStream) {
            responseText += chunk.text;
            if (appSettings.streamingOutput && modelMessageEl) {
                modelMessageEl.firstChild!.nodeValue = responseText; // Update only text node
                chatMessagesEl!.scrollTop = chatMessagesEl!.scrollHeight;
            }
        }
        
        modelMessage.text = responseText;
        modelMessage.parts = [{ text: responseText }];
        
        if (!appSettings.streamingOutput) {
            session.history.push(modelMessage);
            renderMessage(modelMessage);
        } else if (modelMessageEl) {
            modelMessageEl.innerHTML = responseText.replace(/\n/g, '<br>') + `
                <div class="message-actions">
                    <button class="message-action-btn" data-action="copy" title="${currentStrings.copy}">📋</button>
                    <button class="message-action-btn" data-action="regenerate" title="${currentStrings.regenerate}">🔄</button>
                    <button class="message-action-btn" data-action="delete" title="${currentStrings.delete}">🗑️</button>
                </div>
            `;
        }

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
 * Handles clicks on sidebar chat item actions (pin, edit).
 * @param e The click event.
 */
function handleChatItemAction(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const action = target.dataset.action;
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
    }
}


/**
 * Handles actions on a message (copy, regenerate, delete).
 * @param e The click event.
 */
function handleMessageAction(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const action = target.dataset.action;
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

function initChatSettings() {
    // Populate popover with current settings
    if (temperatureSlider) temperatureSlider.value = String(appSettings.temperature);
    if (temperatureValue) temperatureValue.textContent = String(appSettings.temperature);
    if (topkSlider) topkSlider.value = String(appSettings.topK);
    if (topkValue) topkValue.textContent = String(appSettings.topK);
    if (toppSlider) toppSlider.value = String(appSettings.topP);
    if (toppValue) toppValue.textContent = String(appSettings.topP);
    if (maxTokensSlider) maxTokensSlider.value = String(appSettings.maxOutputTokens);
    if (maxTokensValue) maxTokensValue.textContent = String(appSettings.maxOutputTokens);
    if(autoCreateTitleToggle) autoCreateTitleToggle.checked = appSettings.autoCreateTitle;
    if(streamingOutputToggle) streamingOutputToggle.checked = appSettings.streamingOutput;


    // Add event listeners
    chatSettingsTrigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        chatSettingsPopover?.style.display === 'none' 
            ? chatSettingsPopover.style.display = 'block'
            : chatSettingsPopover.style.display = 'none';
    });

    document.body.addEventListener('click', () => {
        if(chatSettingsPopover) chatSettingsPopover.style.display = 'none';
    });

    chatSettingsPopover?.addEventListener('click', (e) => e.stopPropagation());

    const save = () => { saveSettings(); };

    temperatureSlider?.addEventListener('input', () => {
        if (temperatureValue) temperatureValue.textContent = temperatureSlider.value;
        appSettings.temperature = parseFloat(temperatureSlider.value);
        save();
    });
    topkSlider?.addEventListener('input', () => {
        if (topkValue) topkValue.textContent = topkSlider.value;
        appSettings.topK = parseInt(topkSlider.value, 10);
        save();
    });
    toppSlider?.addEventListener('input', () => {
        if (toppValue) toppValue.textContent = toppSlider.value;
        appSettings.topP = parseFloat(toppSlider.value);
        save();
    });
    maxTokensSlider?.addEventListener('input', () => {
        if (maxTokensValue) maxTokensValue.textContent = maxTokensSlider.value;
        appSettings.maxOutputTokens = parseInt(maxTokensSlider.value, 10);
        save();
    });
    autoCreateTitleToggle?.addEventListener('change', () => { appSettings.autoCreateTitle = autoCreateTitleToggle.checked; save(); });
    streamingOutputToggle?.addEventListener('change', () => { appSettings.streamingOutput = streamingOutputToggle.checked; save(); });
}

export function initChatModule() {
    loadChatHistory();
    initChatSettings();
    
    newChatBtn?.addEventListener('click', startNewChat);
    sendBtn?.addEventListener('click', sendMessage);
    chatInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    chatInput?.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = `${chatInput.scrollHeight}px`;
        sendBtn.disabled = chatInput.value.trim().length === 0 && attachedFiles.length === 0;
    });

    chatFileInput?.addEventListener('change', handleFileAttachment);
    chatMessagesEl?.addEventListener('click', handleMessageAction);
    chatListEl?.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('.chat-item-action-btn');
        if (target) {
            handleChatItemAction(e);
        }
    });
    
    systemInstructionContainer?.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('#system-instruction-header')) {
            systemInstructionContainer.classList.toggle('open');
        }
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