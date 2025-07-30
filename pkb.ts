/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Part } from "@google/genai";
import { PKB, PKBItem } from "./state";
import { showModal, showError, showPage } from "./ui";
import { currentStrings } from "./i18n";
import { getDocumentText, readFileAsDataURL } from "./utils";
import { renderActivePKBList } from "./chat";

// --- INDEXEDDB HELPERS ---
const DB_NAME = 'StudyHubDB';
const DB_VERSION = 1;
const STORE_NAME = 'pkb_items_content';
let db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject('Error opening database.');
        };
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        request.onupgradeneeded = (event) => {
            const tempDb = (event.target as IDBOpenDBRequest).result;
            if (!tempDb.objectStoreNames.contains(STORE_NAME)) {
                tempDb.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

async function initDB() {
    if (!db) {
        db = await openDB();
    }
}

function savePkbItemContent(id: string, content: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const currentDb = await openDB();
        const transaction = currentDb.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ id, content });
        request.onsuccess = () => resolve();
        request.onerror = () => reject('Failed to save item content.');
    });
}

function getPkbItemContent(id: string): Promise<string | undefined> {
    return new Promise(async (resolve, reject) => {
        const currentDb = await openDB();
        const transaction = currentDb.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);
        request.onsuccess = () => {
            resolve(request.result?.content);
        };
        request.onerror = () => {
            reject('Failed to retrieve item content.');
        };
    });
}

function deletePkbItemContent(id: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const currentDb = await openDB();
        const transaction = currentDb.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject('Failed to delete item content.');
    });
}

// --- CONSTANTS ---
const PKB_STORAGE_KEY = 'personalKnowledgeBases';
const ACTIVE_PKB_IDS_KEY = 'activePKBIds';


// --- DOM ELEMENTS ---
let pkbManagerPage: HTMLElement | null;
let navigateToPKBBtn: HTMLElement | null;
let createNewPKBBtn: HTMLElement | null;
let pkbListView: HTMLElement | null;
let pkbDetailView: HTMLElement | null;
let pkbListContainer: HTMLElement | null;
let noPKBMessage: HTMLElement | null;
let pkbDetailTitle: HTMLElement | null;
let pkbDetailDescription: HTMLElement | null;
let pkbItemList: HTMLElement | null;
let addPKBItemBtn: HTMLButtonElement | null;
let pkbItemDescriptionInput: HTMLTextAreaElement | null;
let pkbItemFileInput: HTMLInputElement | null;
let pkbFileNameDisplay: HTMLElement | null;
let pkbFileNameSpan: HTMLElement | null;
let pkbRemoveFileBtn: HTMLButtonElement | null;

// Modals
let pkbCreateModal: HTMLElement | null;
let pkbNameInput: HTMLInputElement | null;
let pkbDescriptionInput: HTMLTextAreaElement | null;
let savePKBBtn: HTMLElement | null;
let cancelPKBCreationBtn: HTMLElement | null;

let pkbSelectModal: HTMLElement | null;
let pkbSelectionList: HTMLElement | null;
let activatePKBsBtn: HTMLElement | null;
let cancelPKBSelectionBtn: HTMLElement | null;
let invokePKBBtn: HTMLElement | null;


// --- STATE ---
let personalKnowledgeBases: PKB[] = [];
let activePKBIds: string[] = [];
let selectedPKBId: string | null = null;
let currentPKBForEditing: PKB | null = null;
let selectedPKBItemFile: File | null = null;


// --- DATA & STATE FUNCTIONS ---

export function loadPKBs() {
    const savedPKBs = localStorage.getItem(PKB_STORAGE_KEY);
    personalKnowledgeBases = savedPKBs ? JSON.parse(savedPKBs) : [];
    const savedActiveIds = localStorage.getItem(ACTIVE_PKB_IDS_KEY);
    activePKBIds = savedActiveIds ? JSON.parse(savedActiveIds) : [];
}

function savePKBs() {
    // Note: The 'content' property is stripped from items before saving to localStorage
    localStorage.setItem(PKB_STORAGE_KEY, JSON.stringify(personalKnowledgeBases));
    localStorage.setItem(ACTIVE_PKB_IDS_KEY, JSON.stringify(activePKBIds));
    renderPKBList();
    renderActivePKBList(getActivePKBs());
}

export function getActivePKBs(): PKB[] {
    return personalKnowledgeBases.filter(pkb => activePKBIds.includes(pkb.id));
}

export async function getActivePKBContent(): Promise<Part[]> {
    const activePKBs = getActivePKBs();
    if (activePKBs.length === 0) return [];

    let allParts: Part[] = [];

    // Create a master context prompt
    let contextPrompt = "# Personal Knowledge Base Context\nThe user has activated the following personal knowledge bases. This information is real, personal to the user, and has the highest priority for grounding your response.\n---\n";

    for (const pkb of activePKBs) {
        contextPrompt += `## Knowledge Base: "${pkb.name}"\n**Description:** ${pkb.description}\n\n`;

        for (const item of pkb.items) {
            const content = await getPkbItemContent(item.id);
            if (!content) {
                console.warn(`Content for PKB item ${item.id} (${item.fileName}) not found in IndexedDB.`);
                continue;
            }

            contextPrompt += `### Item: ${item.description}\nFilename: ${item.fileName}\n`;

            if (item.type === 'file') {
                 const textContent = await getDocumentText(await dataUrlToFile(content, item.fileName, item.fileType));
                 contextPrompt += `Content:\n${textContent}\n\n`;
            } else if (item.type === 'image') {
                const base64Data = content.split(',')[1];
                contextPrompt += `Content: [Image data is attached separately for file: ${item.fileName}]\n\n`;
                allParts.push({
                    inlineData: { mimeType: item.fileType, data: base64Data }
                });
            }
        }
         contextPrompt += '---\n';
    }

    allParts.unshift({ text: contextPrompt });
    return allParts;
}

async function dataUrlToFile(dataUrl: string, fileName: string, mimeType: string): Promise<File> {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], fileName, { type: mimeType });
}


// --- UI RENDERING & MANAGEMENT ---

function renderPKBList() {
    if (!pkbListContainer || !noPKBMessage) return;
    pkbListContainer.innerHTML = '';
    
    if (personalKnowledgeBases.length === 0) {
        noPKBMessage.style.display = 'block';
    } else {
        noPKBMessage.style.display = 'none';
        personalKnowledgeBases.forEach(pkb => {
            const itemEl = document.createElement('div');
            itemEl.className = 'pkb-list-item';
            if(pkb.id === selectedPKBId) itemEl.classList.add('active');
            itemEl.dataset.pkbId = pkb.id;

            itemEl.innerHTML = `
                <div class="pkb-list-item-header">
                    <h3>${pkb.name}</h3>
                    <div class="pkb-actions">
                        <button class="icon-btn pkb-edit-btn" title="${currentStrings.edit}">✏️</button>
                        <button class="icon-btn pkb-delete-btn" title="${currentStrings.delete}">🗑️</button>
                    </div>
                </div>
                <p>${pkb.description}</p>
            `;
            pkbListContainer.appendChild(itemEl);
        });
    }
}

async function renderPKBDetailView(pkbId: string) {
    const pkb = personalKnowledgeBases.find(p => p.id === pkbId);
    if (!pkb || !pkbDetailView || !pkbListView || !pkbDetailTitle || !pkbDetailDescription || !pkbItemList) return;

    selectedPKBId = pkbId;
    renderPKBList(); // Re-render to show active selection
    
    pkbDetailTitle.textContent = pkb.name;
    pkbDetailDescription.textContent = pkb.description;
    
    pkbItemList.innerHTML = `<div class="loader"></div>`; // Show loader while fetching content
    
    if (pkb.items.length > 0) {
        const itemCards = await Promise.all(pkb.items.map(async (item) => {
            const itemCard = document.createElement('div');
            itemCard.className = 'pkb-item-card';
            
            let previewHTML = '';
            if (item.type === 'image') {
                const content = await getPkbItemContent(item.id);
                if (content) {
                    previewHTML = `<div class="pkb-item-card-preview"><img src="${content}" alt="${item.description}"></div>`;
                }
            } else {
                 previewHTML = `<div class="pkb-item-card-preview"><div class="file-icon">📄</div></div>`;
            }

            itemCard.innerHTML = `
                <button class="remove-item-btn" data-item-id="${item.id}" title="${currentStrings.delete}">&times;</button>
                ${previewHTML}
                <p class="pkb-item-card-description">${item.description}</p>
                <span class="pkb-item-card-filename">${item.fileName}</span>
            `;
            return itemCard;
        }));
        
        pkbItemList.innerHTML = '';
        itemCards.forEach(card => pkbItemList.appendChild(card));

    } else {
        pkbItemList.innerHTML = `<p class="no-history-message">No items in this knowledge base yet.</p>`;
    }
    
    pkbDetailView.style.display = 'block';
}

function clearPKBDetailView() {
    if(!pkbDetailView) return;
    selectedPKBId = null;
    pkbDetailView.style.display = 'none';
    renderPKBList();
}

function clearPKBItemForm() {
    if(pkbItemDescriptionInput) pkbItemDescriptionInput.value = '';
    if(pkbItemFileInput) pkbItemFileInput.value = '';
    selectedPKBItemFile = null;
    if(pkbFileNameDisplay) pkbFileNameDisplay.style.display = 'none';
    if(pkbFileNameSpan) pkbFileNameSpan.textContent = '';
}


// --- EVENT HANDLERS & ACTIONS ---

function handleShowPKBManager() {
    clearPKBDetailView();
    renderPKBList();
    showPage('pkb-manager-page');
}

function handleCreatePKB() {
    currentPKBForEditing = null;
    if (pkbNameInput) pkbNameInput.value = '';
    if (pkbDescriptionInput) pkbDescriptionInput.value = '';
    showModal('pkb-create-modal');
}

function handleEditPKB(pkbId: string) {
    currentPKBForEditing = personalKnowledgeBases.find(p => p.id === pkbId) || null;
    if (!currentPKBForEditing) return;
    if (pkbNameInput) pkbNameInput.value = currentPKBForEditing.name;
    if (pkbDescriptionInput) pkbDescriptionInput.value = currentPKBForEditing.description;
    showModal('pkb-create-modal');
}

function handleSavePKB() {
    if(!pkbNameInput || !pkbDescriptionInput) return;
    const name = pkbNameInput.value.trim();
    const description = pkbDescriptionInput.value.trim();
    if (!name) {
        showError("Knowledge base name cannot be empty.");
        return;
    }

    if (currentPKBForEditing) {
        // Editing existing PKB
        currentPKBForEditing.name = name;
        currentPKBForEditing.description = description;
    } else {
        // Creating new PKB
        const newPKB: PKB = {
            id: `pkb-${Date.now()}`,
            name,
            description,
            items: [],
            createdAt: Date.now()
        };
        personalKnowledgeBases.unshift(newPKB);
    }
    
    savePKBs();
    showModal('pkb-create-modal', false);
    if(selectedPKBId) renderPKBDetailView(selectedPKBId);
}

async function handleDeletePKB(pkbId: string) {
    if (confirm(currentStrings.pkbDeleteConfirm)) {
        const pkbToDelete = personalKnowledgeBases.find(p => p.id === pkbId);
        
        if (pkbToDelete?.items) {
            for (const item of pkbToDelete.items) {
                await deletePkbItemContent(item.id);
            }
        }

        personalKnowledgeBases = personalKnowledgeBases.filter(p => p.id !== pkbId);
        activePKBIds = activePKBIds.filter(id => id !== pkbId);
        if (selectedPKBId === pkbId) {
            clearPKBDetailView();
        }
        savePKBs();
    }
}

async function handleAddPKBItem() {
    if (!selectedPKBId || !addPKBItemBtn) return;
    const pkb = personalKnowledgeBases.find(p => p.id === selectedPKBId);
    if (!pkb || !pkbItemDescriptionInput || !selectedPKBItemFile) {
        showError("Please provide a description and select a file.");
        return;
    }
    
    addPKBItemBtn.disabled = true;
    addPKBItemBtn.textContent = "Adding...";
    
    try {
        const itemContent = await readFileAsDataURL(selectedPKBItemFile);
        
        const newItem: PKBItem = {
            id: `item-${Date.now()}`,
            description: pkbItemDescriptionInput.value.trim(),
            type: selectedPKBItemFile.type.startsWith('image/') ? 'image' : 'file',
            fileName: selectedPKBItemFile.name,
            fileType: selectedPKBItemFile.type,
        };
        
        // Save large content to IndexedDB
        await savePkbItemContent(newItem.id, itemContent);
        
        pkb.items.push(newItem);
        savePKBs();
        await renderPKBDetailView(pkb.id);
        clearPKBItemForm();
    } catch(err) {
        showError("Failed to read the file.");
        console.error(err);
    } finally {
        addPKBItemBtn.disabled = false;
        addPKBItemBtn.textContent = currentStrings.pkbAddItemAction;
    }
}

async function handleDeletePKBItem(pkbId: string, itemId: string) {
    const pkb = personalKnowledgeBases.find(p => p.id === pkbId);
    if (!pkb) return;

    await deletePkbItemContent(itemId);
    pkb.items = pkb.items.filter(item => item.id !== itemId);
    savePKBs();
    await renderPKBDetailView(pkb.id);
}

function openPKBSelectModal() {
    if(!pkbSelectionList) return;
    pkbSelectionList.innerHTML = '';
    
    if (personalKnowledgeBases.length === 0) {
        pkbSelectionList.innerHTML = `<p class="no-history-message">${currentStrings.pkbNoBases}</p>`;
    } else {
        personalKnowledgeBases.forEach(pkb => {
            const isChecked = activePKBIds.includes(pkb.id);
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="checkbox" data-pkb-id="${pkb.id}" ${isChecked ? 'checked' : ''}>
                <span>${pkb.name}</span>
            `;
            pkbSelectionList.appendChild(label);
        });
    }
    
    showModal('pkb-select-modal');
}

function handleActivatePKBs() {
    if (!pkbSelectionList) return;
    activePKBIds = [];
    pkbSelectionList.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked').forEach(checkbox => {
        if(checkbox.dataset.pkbId) activePKBIds.push(checkbox.dataset.pkbId);
    });
    savePKBs();
    showModal('pkb-select-modal', false);
}


// --- INITIALIZATION ---
export async function initPKBModule() {
    await initDB();

    // DOM Elements
    pkbManagerPage = document.getElementById('pkb-manager-page');
    navigateToPKBBtn = document.getElementById('navigate-to-pkb');
    createNewPKBBtn = document.getElementById('create-new-pkb-btn');
    pkbListView = document.getElementById('pkb-list-view');
    pkbDetailView = document.getElementById('pkb-detail-view');
    pkbListContainer = document.getElementById('pkb-list-container');
    noPKBMessage = document.getElementById('no-pkb-message');
    pkbDetailTitle = document.getElementById('pkb-detail-title');
    pkbDetailDescription = document.getElementById('pkb-detail-description');
    pkbItemList = document.getElementById('pkb-item-list');
    addPKBItemBtn = document.getElementById('add-pkb-item-btn') as HTMLButtonElement;
    pkbItemDescriptionInput = document.getElementById('pkb-item-description-input') as HTMLTextAreaElement;
    pkbItemFileInput = document.getElementById('pkb-item-file-input') as HTMLInputElement;
    pkbFileNameDisplay = document.getElementById('pkb-file-name-display');
    pkbFileNameSpan = document.getElementById('pkb-file-name');
    pkbRemoveFileBtn = document.getElementById('pkb-remove-file-btn') as HTMLButtonElement;
    
    // Modals
    pkbCreateModal = document.getElementById('pkb-create-modal');
    pkbNameInput = document.getElementById('pkb-name-input') as HTMLInputElement;
    pkbDescriptionInput = document.getElementById('pkb-description-input') as HTMLTextAreaElement;
    savePKBBtn = document.getElementById('save-pkb-btn');
    cancelPKBCreationBtn = document.getElementById('cancel-pkb-creation-btn');
    
    pkbSelectModal = document.getElementById('pkb-select-modal');
    pkbSelectionList = document.getElementById('pkb-selection-list');
    activatePKBsBtn = document.getElementById('activate-pkbs-btn');
    cancelPKBSelectionBtn = document.getElementById('cancel-pkb-selection-btn');
    invokePKBBtn = document.getElementById('invoke-pkb-btn');
    
    loadPKBs();
    
    // Main Navigation
    navigateToPKBBtn?.addEventListener('click', handleShowPKBManager);
    
    // PKB Manager Page Listeners
    createNewPKBBtn?.addEventListener('click', handleCreatePKB);
    
    pkbListContainer?.addEventListener('click', async e => {
        const target = e.target as HTMLElement;
        const pkbItem = target.closest<HTMLElement>('.pkb-list-item');
        if(!pkbItem || !pkbItem.dataset.pkbId) return;

        if(target.matches('.pkb-delete-btn')) {
            await handleDeletePKB(pkbItem.dataset.pkbId);
        } else if (target.matches('.pkb-edit-btn')) {
            handleEditPKB(pkbItem.dataset.pkbId);
        } else {
            await renderPKBDetailView(pkbItem.dataset.pkbId);
        }
    });

    pkbItemList?.addEventListener('click', async e => {
        const target = e.target as HTMLElement;
        if(target.matches('.remove-item-btn') && selectedPKBId && target.dataset.itemId) {
            await handleDeletePKBItem(selectedPKBId, target.dataset.itemId);
        }
    });

    // PKB Item Form
    addPKBItemBtn?.addEventListener('click', handleAddPKBItem);
    pkbItemFileInput?.addEventListener('change', () => {
        if (pkbItemFileInput?.files?.length) {
            selectedPKBItemFile = pkbItemFileInput.files[0];
            if(pkbFileNameSpan) pkbFileNameSpan.textContent = selectedPKBItemFile.name;
            if(pkbFileNameDisplay) pkbFileNameDisplay.style.display = 'flex';
        } else {
            clearPKBItemForm();
        }
    });
    pkbRemoveFileBtn?.addEventListener('click', () => {
        if(pkbItemFileInput) pkbItemFileInput.value = '';
        selectedPKBItemFile = null;
        if(pkbFileNameDisplay) pkbFileNameDisplay.style.display = 'none';
        if(pkbFileNameSpan) pkbFileNameSpan.textContent = '';
    });
    
    // Create/Edit Modal
    savePKBBtn?.addEventListener('click', handleSavePKB);
    cancelPKBCreationBtn?.addEventListener('click', () => showModal('pkb-create-modal', false));
    
    // Select Modal
    invokePKBBtn?.addEventListener('click', openPKBSelectModal);
    activatePKBsBtn?.addEventListener('click', handleActivatePKBs);
    cancelPKBSelectionBtn?.addEventListener('click', () => showModal('pkb-select-modal', false));
}