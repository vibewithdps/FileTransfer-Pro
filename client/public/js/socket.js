/*
==========================================================
    FileTransfer Pro v2
    Socket.IO Real-Time Client Manager
==========================================================
*/

"use strict";

const Socket = {
    io: null,

    init() {
        if (typeof io === "undefined") {
            console.warn("Socket.io library not loaded");
            return;
        }

        this.io = io({
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: Infinity
        });

        this.registerEvents();
    },

    joinSession(sessionId, token, role = "client", deviceName = "Device") {
        if (!this.io || !sessionId) return;
        this.io.emit("joinSessionRoom", {
            sessionId,
            token,
            role,
            deviceName
        });
    },

    registerEvents() {
        const statusPill = document.getElementById("statusPill");
        const statusText = document.getElementById("statusText");

        this.io.on("connect", () => {
            if (App.session && App.session.status === "paired") {
                if (statusPill) statusPill.className = "status-pill paired";
                if (statusText) statusText.textContent = "🔒 Paired & Private";
            } else {
                if (statusPill) statusPill.className = "status-pill waiting";
                if (statusText) statusText.textContent = "Scan QR to Connect";
            }

            // If session already exists in App, rejoin room
            if (App.session && App.session.id) {
                this.joinSession(App.session.id, App.session.token, App.session.role);
            }
        });

        this.io.on("disconnect", () => {
            if (statusPill) {
                statusPill.className = "status-pill offline";
                if (statusText) statusText.textContent = "Reconnecting...";
            }
        });

        // Private Pairing Handshake
        this.io.on("sessionPaired", (data) => {
            console.log("Socket: sessionPaired event received", data);
            if (window.App && typeof App.onSessionPaired === "function") {
                App.onSessionPaired(data);
            }
        });

        // Private Session File Uploaded
        this.io.on("sessionFileUploaded", (data) => {
            if (window.App) {
                App.showToast(`📤 Received: ${data.file.originalName || data.file.name}`, "success");
                App.playSound("success");
            }
            if (window.UI) {
                UI.loadFiles();
            }
        });

        // Private Session Clipboard Updated
        this.io.on("sessionClipboardUpdated", (data) => {
            if (window.App) {
                App.showToast("📋 New text received from paired device", "info");
                App.playSound("pop");
            }
            if (window.UI) {
                UI.loadClipboard();
            }
        });

        // Session Ended by Peer
        this.io.on("sessionEnded", (data) => {
            if (window.App && typeof App.onSessionEnded === "function") {
                App.onSessionEnded(data);
            }
        });

        // Peer Disconnected notice
        this.io.on("peerDisconnected", (data) => {
            if (window.App) {
                App.showToast(`⚠️ ${data.deviceName || "Peer device"} temporarily lost connection`, "warning");
            }
        });

        // Global fallback listeners
        this.io.on("fileUploaded", (data) => {
            if (window.App) {
                App.showToast(`📤 Received: ${data.file.originalName || data.file.name}`, "success");
                App.playSound("success");
            }
            if (window.UI) UI.loadFiles();
        });

        this.io.on("fileDeleted", (data) => {
            if (window.App) App.showToast(`🗑️ File deleted`, "info");
            if (window.UI) UI.loadFiles();
        });

        this.io.on("fileRenamed", () => {
            if (window.UI) UI.loadFiles();
        });

        this.io.on("clipboardUpdated", () => {
            if (window.UI) UI.loadClipboard();
        });
    }
};

window.addEventListener("DOMContentLoaded", () => {
    Socket.init();
});

window.Socket = Socket;