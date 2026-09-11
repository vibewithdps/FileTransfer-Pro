/*
==========================================================
    FileTransfer Pro v2
    Private Paired Session & Room Manager
==========================================================
*/

"use strict";

const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const localStore = require("./localStore");

// Active sessions stored in memory: sessionId -> SessionObject
const activeSessions = new Map();

// Helper to generate 6-digit PIN code
function generatePin() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper to generate short session ID
function generateSessionId() {
    return crypto.randomBytes(4).toString("hex").toUpperCase(); // e.g. 'A7F93E2B'
}

/**
 * Creates a new private pairing session
 * @param {Object} hostInfo - Details about the hosting device
 * @returns {Object} session
 */
function createSession(hostInfo = {}) {
    const sessionId = generateSessionId();
    const pin = generatePin();
    const token = crypto.randomBytes(24).toString("hex");

    const session = {
        id: sessionId,
        pin,
        token,
        status: "waiting", // 'waiting' | 'paired' | 'ended'
        createdAt: Date.now(),
        lastActivity: Date.now(),
        host: {
            name: hostInfo.name || "Host Device",
            ip: hostInfo.ip || "Unknown IP",
            userAgent: hostInfo.userAgent || ""
        },
        client: null,
        files: [],
        clipboard: []
    };

    activeSessions.set(sessionId, session);
    return session;
}

/**
 * Retrieves a session by ID
 * @param {string} sessionId
 * @returns {Object|null}
 */
function getSession(sessionId) {
    if (!sessionId) return null;
    const session = activeSessions.get(sessionId.toUpperCase());
    if (session) {
        session.lastActivity = Date.now();
        return session;
    }
    return null;
}

/**
 * Finds a session by its 6-digit PIN
 * @param {string} pin
 * @returns {Object|null}
 */
function getSessionByPin(pin) {
    if (!pin) return null;
    const cleanPin = pin.trim().replace(/\s|-/g, "");
    for (const session of activeSessions.values()) {
        if (session.pin === cleanPin && session.status !== "ended") {
            session.lastActivity = Date.now();
            return session;
        }
    }
    return null;
}

/**
 * Validates session token
 * @param {string} sessionId
 * @param {string} token
 * @returns {boolean}
 */
function validateSession(sessionId, token) {
    const session = getSession(sessionId);
    if (!session || session.status === "ended") return false;
    return session.token === token;
}

/**
 * Pairs client device with an existing waiting session
 * @param {string} sessionId
 * @param {string} token
 * @param {Object} clientInfo
 * @returns {Object} session
 */
function pairSession(sessionId, token, clientInfo = {}) {
    const session = getSession(sessionId);
    if (!session) {
        throw new Error("Session not found or expired");
    }
    if (session.status === "ended") {
        throw new Error("This session has already ended");
    }
    if (session.token !== token) {
        throw new Error("Invalid session security token");
    }

    session.status = "paired";
    session.client = {
        name: clientInfo.name || "Mobile Device",
        ip: clientInfo.ip || "Unknown IP",
        userAgent: clientInfo.userAgent || "",
        connectedAt: Date.now()
    };
    session.lastActivity = Date.now();

    return session;
}

/**
 * Records an uploaded file to this specific session
 */
function addFileToSession(sessionId, fileData) {
    const session = getSession(sessionId);
    if (!session) return null;

    const fileEntry = {
        ...fileData,
        sessionId,
        uploadedAt: new Date().toISOString()
    };

    session.files.unshift(fileEntry);
    session.lastActivity = Date.now();
    return fileEntry;
}

/**
 * Gets files for a specific session only
 */
function getSessionFiles(sessionId) {
    const session = getSession(sessionId);
    if (!session) return [];
    return session.files;
}

/**
 * Adds a clipboard message to this specific session
 */
function addClipboardToSession(sessionId, text, sender = "Device") {
    const session = getSession(sessionId);
    if (!session) return null;

    const item = {
        id: "clip_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
        sessionId,
        text: text.trim(),
        sender,
        createdAt: new Date().toISOString()
    };

    session.clipboard.unshift(item);
    if (session.clipboard.length > 50) session.clipboard.pop();
    session.lastActivity = Date.now();
    return item;
}

/**
 * Gets clipboard history for this specific session
 */
function getSessionClipboard(sessionId) {
    const session = getSession(sessionId);
    if (!session) return [];
    return session.clipboard;
}

/**
 * Removes a file from any session tracking it
 */
function removeFileFromSession(filename) {
    for (const session of activeSessions.values()) {
        const idx = session.files.findIndex(f => f.name === filename);
        if (idx !== -1) {
            session.files.splice(idx, 1);
            session.lastActivity = Date.now();
            return session.id;
        }
    }
    return null;
}

/**
 * Updates filename in session
 */
function renameFileInSession(oldName, newName) {
    for (const session of activeSessions.values()) {
        const file = session.files.find(f => f.name === oldName);
        if (file) {
            file.name = newName;
            file.originalName = newName;
            session.lastActivity = Date.now();
            return session.id;
        }
    }
    return null;
}

/**
 * Deletes a clipboard entry from a session
 */
function deleteClipboardFromSession(sessionId, clipId) {
    const session = getSession(sessionId);
    if (!session) return false;
    const idx = session.clipboard.findIndex(c => c.id === clipId);
    if (idx !== -1) {
        session.clipboard.splice(idx, 1);
        session.lastActivity = Date.now();
        return true;
    }
    return false;
}

/**
 * Terminates and cleans up a session
 */
function closeSession(sessionId) {
    const session = getSession(sessionId);
    if (!session) return false;

    session.status = "ended";

    // Clean up files uploaded during this private session from disk
    if (session.files && session.files.length > 0) {
        session.files.forEach(f => {
            try {
                localStore.deleteFile(f.name);
            } catch (e) {}
        });
    }

    activeSessions.delete(sessionId.toUpperCase());
    return true;
}

// Periodically clean up stale sessions (> 4 hours of inactivity)
setInterval(() => {
    const now = Date.now();
    const MAX_INACTIVITY = 4 * 60 * 60 * 1000;
    for (const [id, session] of activeSessions.entries()) {
        if (now - session.lastActivity > MAX_INACTIVITY) {
            closeSession(id);
        }
    }
}, 10 * 60 * 1000);

module.exports = {
    createSession,
    getSession,
    getSessionByPin,
    validateSession,
    pairSession,
    addFileToSession,
    getSessionFiles,
    removeFileFromSession,
    renameFileInSession,
    addClipboardToSession,
    getSessionClipboard,
    deleteClipboardFromSession,
    closeSession
};
