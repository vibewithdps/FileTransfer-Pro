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

    registerEvents() {
        const statusPill = document.getElementById("statusPill");
        const statusText = document.getElementById("statusText");
        const onlineCount = document.getElementById("onlineCount");

        this.io.on("connect", () => {
            if (statusPill) {
                statusPill.className = "status-pill online";
                if (statusText) statusText.textContent = "LAN Connected";
            }
        });

        this.io.on("disconnect", () => {
            if (statusPill) {
                statusPill.className = "status-pill offline";
                if (statusText) statusText.textContent = "Reconnecting...";
            }
        });

        this.io.on("onlineUsers", (count) => {
            if (onlineCount) {
                onlineCount.textContent = `${count} ${count === 1 ? "Device" : "Devices"}`;
            }
        });

        this.io.on("fileUploaded", (data) => {
            if (window.App) {
                App.showToast(`📤 Received: ${data.file.originalName || data.file.name}`, "success");
                App.playSound("success");
            }
            if (window.UI) {
                UI.loadFiles();
            }
        });

        this.io.on("fileDeleted", (data) => {
            if (window.App) {
                App.showToast(`🗑️ Deleted: ${data.file}`, "info");
            }
            if (window.UI) {
                UI.loadFiles();
            }
        });

        this.io.on("fileRenamed", (data) => {
            if (window.App) {
                App.showToast(`✏️ Renamed: ${data.old} ➜ ${data.new}`, "info");
            }
            if (window.UI) {
                UI.loadFiles();
            }
        });

        this.io.on("clipboardUpdated", (data) => {
            if (window.App) {
                App.showToast("📋 New text copied to clipboard hub", "info");
                App.playSound("pop");
            }
            if (window.UI) {
                UI.loadClipboard();
            }
        });

        this.io.on("clipboardDeleted", () => {
            if (window.UI) {
                UI.loadClipboard();
            }
        });
    }
};

window.addEventListener("DOMContentLoaded", () => {
    Socket.init();
});

window.Socket = Socket;