/*
==========================================================
    FileTransfer Pro v2
    Clipboard Controller (Cross-Device Text/Link Sharing)
==========================================================
*/

"use strict";

const localStore = require("../utils/localStore");

function getSocketIO() {
    try {
        return require("../sockets/socket");
    } catch (e) {
        return null;
    }
}

// Get clipboard history
exports.getClipboard = async (req, res) => {
    try {
        const items = localStore.readClipboard();
        res.status(200).json({
            success: true,
            items
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add new clipboard item
exports.addClipboard = async (req, res) => {
    try {
        const { text, sender } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Text content cannot be empty"
            });
        }

        const device = sender || req.headers["x-client-device"] || "LAN Device";
        const item = localStore.addClipboardItem(text, device);

        const socket = getSocketIO();
        if (socket && typeof socket.clipboardUpdated === "function") {
            socket.clipboardUpdated(item);
        }

        res.status(201).json({
            success: true,
            message: "Clipboard text shared successfully",
            item
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete clipboard item
exports.deleteClipboard = async (req, res) => {
    try {
        const { id } = req.params;
        localStore.deleteClipboardItem(id);

        const socket = getSocketIO();
        if (socket && typeof socket.clipboardDeleted === "function") {
            socket.clipboardDeleted(id);
        }

        res.status(200).json({
            success: true,
            message: "Item removed from clipboard"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
