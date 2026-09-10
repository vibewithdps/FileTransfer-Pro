/*
==========================================================
    FileTransfer Pro v2
    File Controller (Hybrid Offline LocalStore + MongoDB fallback)
==========================================================
*/

"use strict";

const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const localStore = require("../utils/localStore");

// Helper to get socket.io instance
function getSocketIO() {
    try {
        const socketModule = require("../sockets/socket");
        return socketModule;
    } catch (e) {
        return null;
    }
}

// =====================================
// GET ALL FILES
// =====================================
exports.getFiles = async (req, res) => {
    try {
        let files = localStore.getAllFiles();
        const { q, category } = req.query;

        // Category filter
        if (category && category !== "all") {
            files = files.filter(f => f.category.toLowerCase() === category.toLowerCase());
        }

        // Search query filter
        if (q && q.trim()) {
            const query = q.trim().toLowerCase();
            files = files.filter(f => 
                f.name.toLowerCase().includes(query) || 
                f.originalName.toLowerCase().includes(query)
            );
        }

        const stats = localStore.getStorageStats();

        res.status(200).json({
            success: true,
            count: files.length,
            total: stats.totalFiles,
            stats,
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
// DOWNLOAD FILE (WITH RANGE STREAMING)
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

        // Support HTTP Range requests (crucial for video/audio seeking on iOS & Android)
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

        // Notify connected clients via Socket
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

        // Notify connected clients via Socket
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