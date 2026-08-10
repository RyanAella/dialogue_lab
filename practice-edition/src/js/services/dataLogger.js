/**
 * @module DataLogger
 * Handles logging of dialogue turns for research purposes.
 */

import { DATA_LOGGER_CONFIG } from "../core/config.js";

const { STORAGE_KEYS, DEFAULT } = DATA_LOGGER_CONFIG;

let failedUploadQueue = [];

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getCurrentTimestamp() {
    return new Date().toISOString();
}

function getFormattedTimestamp() {
    const now = new Date();
    return {
        date: now.toLocaleDateString('de-DE'),
        time: now.toLocaleTimeString('de-DE'),
        datetime: now.toLocaleString('de-DE'),
        iso: now.toISOString()
    };
}

function loadFromLocalStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Error loading from localStorage:", error);
        return [];
    }
}

function saveToLocalStorage(conversations) {
    try {
        localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
    } catch (error) {
        console.error("Error saving to localStorage:", error);
    }
}

function loadFailedUploads() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.FAILED_UPLOADS);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        return [];
    }
}

function saveFailedUploads(queue) {
    try {
        localStorage.setItem(STORAGE_KEYS.FAILED_UPLOADS, JSON.stringify(queue));
    } catch (error) {
        console.error("Error saving failed uploads:", error);
    }
}

function getResearcherToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
        localStorage.setItem(STORAGE_KEYS.RESEARCHER_TOKEN, token);
        return token;
    }
    return localStorage.getItem(STORAGE_KEYS.RESEARCHER_TOKEN);
}

export const DataLogger = {
    _backendEndpoint: null,
    _conversationBuffer: [],
    _currentConversationId: null,
    _currentMetadata: {},
    _allConversations: [],
    config: { ...DEFAULT },

    init() {
        this._allConversations = loadFromLocalStorage();
        failedUploadQueue = loadFailedUploads();
        console.log(`DataLogger initialized. Loaded ${this._allConversations.length} previous conversations.`);
        if (this.config.retryFailedUploads && failedUploadQueue.length > 0) {
            setTimeout(() => this._retryFailedUploads(), 1000);
        }
    },

    async _uploadToBackend(conversationData) {
        const token = getResearcherToken();
        const endpoint = this._backendEndpoint;
        if (!endpoint) {
            console.error("No backend endpoint configured");
            return { success: false, error: "No backend endpoint configured" };
        }
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Researcher-Token': token || 'anonymous'
                },
                body: JSON.stringify(conversationData)
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }
            return { success: true };
        } catch (error) {
            console.error("Error uploading to backend:", error);
            return { success: false, error: error.message };
        }
    },

    async _retryFailedUploads() {
        const queue = loadFailedUploads();
        if (queue.length === 0) return;
        console.log(`Retrying ${queue.length} failed uploads...`);
        let successful = 0;
        const newQueue = [];
        for (const item of queue) {
            if (!item.conversation || !item.conversation.conversationId) {
                console.warn('Skipping invalid queue item:', item);
                continue;
            }
            const result = await this._uploadToBackend(item.conversation);
            if (result.success) {
                successful++;
            } else {
                const newItem = {
                    conversation: item.conversation,
                    error: result.error,
                    retryCount: (item.retryCount || 0) + 1,
                    timestamp: getCurrentTimestamp()
                };
                if (newItem.retryCount < this.config.maxRetries) {
                    newQueue.push(newItem);
                } else {
                    console.error(`Max retries exceeded for conversation: ${item.conversation.conversationId}`);
                }
            }
        }
        saveFailedUploads(newQueue);
        console.log(`Retry complete: ${successful}/${queue.length} uploads successful`);
    },

    startNewConversation(metadata = {}) {
        if (this._currentConversationId && this._conversationBuffer.length > 0) {
            this.endConversation();
        }
        this._conversationBuffer = [];
        this._currentConversationId = generateUUID();
        this._currentMetadata = {
            conversationId: this._currentConversationId,
            startTimestamp: getCurrentTimestamp(),
            startDatetime: getFormattedTimestamp().datetime,
            ...metadata
        };
        console.log(`Started new conversation with ID: ${this._currentConversationId} Metadata:`, this._currentMetadata);
    },

    _saveCurrentConversation() {
        if (!this._currentConversationId || this._conversationBuffer.length === 0) return;
        const conversationData = {
            conversationId: this._currentConversationId,
            metadata: this._currentMetadata,
            endTimestamp: getCurrentTimestamp(),
            endDatetime: getFormattedTimestamp().datetime,
            turns: [...this._conversationBuffer]
        };
        const existingIndex = this._allConversations.findIndex(c => c.conversationId === this._currentConversationId);
        if (existingIndex >= 0) {
            this._allConversations[existingIndex] = conversationData;
        } else {
            this._allConversations.push(conversationData);
        }
        saveToLocalStorage(this._allConversations);
        console.log(`Saved conversation to local storage: ${this._currentConversationId}`);
    },

    getConversationId() {
        return this._currentConversationId;
    },

    addTurn(role, content, metadata = {}) {
        if (!this._currentConversationId) {
            const meta = {};
            if (this._currentMetadata.mode) meta.mode = this._currentMetadata.mode;
            if (this._currentMetadata.scenarioId) meta.scenarioId = this._currentMetadata.scenarioId;
            if (this._currentMetadata.scenarioTitle) meta.scenarioTitle = this._currentMetadata.scenarioTitle;
            this.startNewConversation(meta);
        }
        const logEntry = {
            timestamp: getCurrentTimestamp(),
            formattedTimestamp: getFormattedTimestamp(),
            role: role,
            content: content,
            ...metadata,
        };
        this._conversationBuffer.push(logEntry);
        this._saveCurrentConversation();
    },

    updateConversationMetadata(metadata = {}) {
        this._currentMetadata = { ...this._currentMetadata, ...metadata };
        console.log("Updated conversation metadata:", this._currentMetadata);
    },

    async endConversation() {
        if (this._currentConversationId) {
            this._saveCurrentConversation();
            await this.uploadCurrentConversation();
        }
        this._conversationBuffer = [];
        this._currentConversationId = null;
        this._currentMetadata = {};
        console.log(`Ended conversation: none`);
    },

    async uploadCurrentConversation() {
        if (!this._currentConversationId || this._conversationBuffer.length === 0) {
            console.warn("No current conversation to upload");
            return { success: false, error: "No current conversation" };
        }
        const conversationData = {
            conversationId: this._currentConversationId,
            metadata: this._currentMetadata,
            endTimestamp: getCurrentTimestamp(),
            endDatetime: getFormattedTimestamp().datetime,
            turns: [...this._conversationBuffer]
        };
        console.log(`Uploading conversation to backend:`, conversationData);
        return this._uploadToBackend(conversationData);
    },

    setBackendEndpoint(url) {
        this._backendEndpoint = url;
        console.log("Backend endpoint set to:", url);
    },

    setAutoUpload(enabled) {
        this.config.autoUpload = enabled;
        console.log("Auto-upload", enabled ? "enabled" : "disabled");
    },

    async uploadAllConversations() {
        const all = loadFromLocalStorage();
        let successful = 0;
        let failed = 0;
        for (const conversation of all) {
            const result = await this._uploadToBackend(conversation);
            if (result.success) {
                successful++;
            } else {
                failed++;
                failedUploadQueue.push({
                    conversation: conversation,
                    error: result.error,
                    timestamp: getCurrentTimestamp()
                });
            }
        }
        saveFailedUploads(failedUploadQueue);
        return { success: successful, failed: failed };
    },

    exportAllAsJSON(filenamePrefix = "dialogue_lab") {
        const all = loadFromLocalStorage();
        const data = JSON.stringify(all, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    exportCurrentAsJSON(filenamePrefix = "dialogue_lab") {
        if (!this._currentConversationId) {
            console.warn("No current conversation to export");
            return;
        }
        const conversation = this._allConversations.find(c => c.conversationId === this._currentConversationId);
        if (!conversation) {
            console.warn("Current conversation not found in storage");
            return;
        }
        const data = JSON.stringify(conversation, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filenamePrefix}_current_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    exportAllAsCSV(filenamePrefix = "dialogue_lab") {
        const all = loadFromLocalStorage();
        let csv = "conversationId,role,timestamp,content,metadata\n";
        all.forEach(conversation => {
            conversation.turns.forEach(turn => {
                const metadataStr = JSON.stringify(turn.formattedTimestamp || {});
                const content = turn.content ? `"${turn.content.replace(/"/g, '""')}"` : '';
                csv += `${conversation.conversationId},${turn.role},${turn.timestamp},${content},${metadataStr}\n`;
            });
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};