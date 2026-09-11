/*
==========================================================
    FileTransfer Pro v2
    Upload Controller (Private Session Support)
==========================================================
*/

"use strict";

const localStore = require("../utils/localStore");
const sessionManager = require("../utils/sessionManager");

function getSocketIO() {
    try {
        return require("../sockets/socket");
    } catch (e) {
        return null;
    }
}

// Universal single file upload
exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file received"
            });
        }

        const sessionId = req.headers["x-session-id"] || req.query.session;
        const sessionToken = req.headers["x-session-token"] || req.query.token;
        const sender = req.headers["x-client-device"] || req.ip || "LAN Device";

        // If session is specified, validate it
        if (sessionId) {
            if (!sessionManager.validateSession(sessionId, sessionToken)) {
                // Delete the uploaded physical file since session is invalid
                localStore.deleteFile(req.file.filename);
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized: Invalid or expired session credentials"
                });
            }
        }

        localStore.recordFile(req.file.filename, req.file.originalname, sender);

        const fileData = {
            name: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            formattedSize: localStore.formatBytes(req.file.size),
            category: localStore.getCategory(req.file.filename, req.file.mimetype),
            mimeType: req.file.mimetype,
            sender,
            sessionId: sessionId || null
        };

        // If part of private session, register with session and notify session room
        const socket = getSocketIO();
        if (sessionId) {
            sessionManager.addFileToSession(sessionId, fileData);
            if (socket && typeof socket.sessionFileUploaded === "function") {
                socket.sessionFileUploaded(sessionId, fileData);
            }
        } else {
            if (socket && typeof socket.fileUploaded === "function") {
                socket.fileUploaded(fileData);
            }
        }

        res.status(200).json({
            success: true,
            message: "File uploaded successfully",
            file: fileData
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Universal multiple file upload
exports.uploadMultiple = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No files received"
            });
        }

        const sessionId = req.headers["x-session-id"] || req.query.session;
        const sessionToken = req.headers["x-session-token"] || req.query.token;
        const sender = req.headers["x-client-device"] || req.ip || "LAN Device";

        if (sessionId) {
            if (!sessionManager.validateSession(sessionId, sessionToken)) {
                req.files.forEach(f => localStore.deleteFile(f.filename));
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized: Invalid or expired session credentials"
                });
            }
        }

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
                mimeType: file.mimetype,
                sender,
                sessionId: sessionId || null
            };

            results.push(fileData);

            if (sessionId) {
                sessionManager.addFileToSession(sessionId, fileData);
                if (socket && typeof socket.sessionFileUploaded === "function") {
                    socket.sessionFileUploaded(sessionId, fileData);
                }
            } else {
                if (socket && typeof socket.fileUploaded === "function") {
                    socket.fileUploaded(fileData);
                }
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