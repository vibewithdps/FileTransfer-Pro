/*
==========================================================
    FileTransfer Pro v2
    Upload Controller
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

// Single file upload
exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file received"
            });
        }

        const sender = req.headers["x-client-device"] || req.ip || "LAN Device";
        localStore.recordFile(req.file.filename, req.file.originalname, sender);

        const socket = getSocketIO();
        if (socket && typeof socket.fileUploaded === "function") {
            socket.fileUploaded({
                name: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                formattedSize: localStore.formatBytes(req.file.size),
                category: localStore.getCategory(req.file.filename, req.file.mimetype),
                sender
            });
        }

        res.status(200).json({
            success: true,
            message: "File uploaded successfully",
            file: {
                name: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                formattedSize: localStore.formatBytes(req.file.size)
            }
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Multiple file upload
exports.uploadMultiple = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No files received"
            });
        }

        const sender = req.headers["x-client-device"] || req.ip || "LAN Device";
        const socket = getSocketIO();
        const results = [];

        for (const file of req.files) {
            localStore.recordFile(file.filename, file.originalname, sender);
            const fileData = {
                name: file.filename,
                originalName: file.originalname,
                size: file.size,
                formattedSize: localStore.formatBytes(file.size),
                category: localStore.getCategory(file.filename, file.mimetype),
                sender
            };

            results.push(fileData);

            if (socket && typeof socket.fileUploaded === "function") {
                socket.fileUploaded(fileData);
            }
        }

        res.status(200).json({
            success: true,
            message: `${results.length} files uploaded successfully`,
            count: results.length,
            files: results
        });
    } catch (error) {
        console.error("Multiple upload error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};