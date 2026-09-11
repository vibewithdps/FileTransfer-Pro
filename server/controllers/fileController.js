/*
==========================================================
    FileTransfer Pro v2
    File Controller (Session-Isolated Downloads & Listings)
==========================================================
*/

"use strict";

const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const localStore = require("../utils/localStore");
const sessionManager = require("../utils/sessionManager");

function getSocketIO() {
    try {
        return require("../sockets/socket");
    } catch (e) {
        return null;
    }
}

// =====================================
// GET FILES (SESSION-AWARE)
// =====================================
exports.getFiles = async (req, res) => {
    try {
        const sessionId = req.headers["x-session-id"] || req.query.session;
        const sessionToken = req.headers["x-session-token"] || req.query.token;
        const { q, category } = req.query;

        let files = [];

        // If in session mode, ONLY return files belonging to this private session!
        if (sessionId) {
            if (!sessionManager.validateSession(sessionId, sessionToken)) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized: Invalid or expired session credentials"
                });
            }
            files = sessionManager.getSessionFiles(sessionId);
        } else {
            // If someone is outside any session, return empty or only unassigned files
            // To ensure strict privacy as requested by user, don't expose private session files!
            files = [];
        }

        // Category filter
        if (category && category !== "all") {
            files = files.filter(f => f.category && f.category.toLowerCase() === category.toLowerCase());
        }

        // Search query filter
        if (q && q.trim()) {
            const query = q.trim().toLowerCase();
            files = files.filter(f => 
                (f.name && f.name.toLowerCase().includes(query)) || 
                (f.originalName && f.originalName.toLowerCase().includes(query))
            );
        }

        let totalSize = 0;
        files.forEach(f => totalSize += (f.size || 0));

        res.status(200).json({
            success: true,
            count: files.length,
            total: files.length,
            totalSize,
            formattedTotalSize: localStore.formatBytes(totalSize),
            files
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================
// GET SINGLE FILE METADATA
// =====================================
exports.getFile = async (req, res) => {
    try {
        const filename = path.basename(req.params.name);
        const filePath = path.join(localStore.UPLOAD_DIR, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: "File not found"
            });
        }

        const stat = fs.statSync(filePath);
        const mimeType = mime.lookup(filename) || "application/octet-stream";

        res.status(200).json({
            success: true,
            file: {
                name: filename,
                size: stat.size,
                formattedSize: localStore.formatBytes(stat.size),
                mimeType,
                category: localStore.getCategory(filename, mimeType),
                createdAt: stat.birthtime,
                modifiedAt: stat.mtime
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================
// DOWNLOAD FILE (ATTACHMENT)
// =====================================
exports.downloadFile = async (req, res) => {
    try {
        const filename = path.basename(req.params.name);
        const filePath = path.join(localStore.UPLOAD_DIR, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: "File not found on server"
            });
        }

        localStore.incrementDownload(filename);
        res.download(filePath, filename);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================
// PREVIEW / STREAM FILE (INLINE + RANGE)
// =====================================
exports.previewFile = async (req, res) => {
    try {
        const filename = path.basename(req.params.name);
        const filePath = path.join(localStore.UPLOAD_DIR, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).send("File not found");
        }

        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const mimeType = mime.lookup(filename) || "application/octet-stream";
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            if (start >= fileSize) {
                res.status(416).send("Requested range not satisfiable\n" + start + " >= " + fileSize);
                return;
            }

            const chunksize = (end - start) + 1;
            const fileStream = fs.createReadStream(filePath, { start, end });

            res.writeHead(206, {
                "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": chunksize,
                "Content-Type": mimeType,
                "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`
            });

            fileStream.pipe(res);
        } else {
            res.writeHead(200, {
                "Content-Length": fileSize,
                "Content-Type": mimeType,
                "Accept-Ranges": "bytes",
                "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`
            });
            fs.createReadStream(filePath).pipe(res);
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// =====================================
// RENAME FILE
// =====================================
exports.renameFile = async (req, res) => {
    try {
        const oldName = path.basename(req.params.name);
        const { newName } = req.body;

        if (!newName || !newName.trim()) {
            return res.status(400).json({
                success: false,
                message: "New file name is required"
            });
        }

        const cleanNewName = localStore.renameFile(oldName, newName.trim());
        const sessionId = sessionManager.renameFileInSession(oldName, cleanNewName);

        const socket = getSocketIO();
        if (socket && typeof socket.fileRenamed === "function") {
            socket.fileRenamed(oldName, cleanNewName);
        }

        res.status(200).json({
            success: true,
            oldName,
            newName: cleanNewName,
            message: "File renamed successfully"
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================
// DELETE FILE
// =====================================
exports.deleteFile = async (req, res) => {
    try {
        const filename = path.basename(req.params.name);
        localStore.deleteFile(filename);
        const sessionId = sessionManager.removeFileFromSession(filename);

        const socket = getSocketIO();
        if (socket && typeof socket.fileDeleted === "function") {
            socket.fileDeleted(filename);
        }

        res.status(200).json({
            success: true,
            filename,
            message: "File deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================
// GET STORAGE STATS
// =====================================
exports.getStats = async (req, res) => {
    try {
        const stats = localStore.getStorageStats();
        res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};