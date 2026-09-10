/*
==========================================================
    FileTransfer Pro v2
    Offline-First Local Storage & Metadata Store
==========================================================
*/

"use strict";

const fs = require("fs");
const path = require("path");
const mime = require("mime-types");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
const META_FILE = path.join(UPLOAD_DIR, ".meta.json");
const CLIPBOARD_FILE = path.join(UPLOAD_DIR, ".clipboard.json");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Format bytes into human readable size
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Categorize a file by its extension or MIME type
 */
function getCategory(filename, mimeType) {
    const ext = path.extname(filename).toLowerCase().replace(".", "");
    
    const categories = {
        image: ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "tiff", "heic", "heif"],
        video: ["mp4", "webm", "mkv", "mov", "avi", "flv", "wmv", "3gp", "m4v"],
        audio: ["mp3", "wav", "ogg", "m4a", "flac", "aac", "wma"],
        document: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf", "odt", "ods", "csv", "md"],
        archive: ["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "iso", "apk", "dmg"],
        code: ["js", "jsx", "ts", "tsx", "py", "html", "css", "json", "java", "c", "cpp", "cs", "php", "go", "rs", "sh", "bat", "sql"]
    };

    for (const [cat, exts] of Object.entries(categories)) {
        if (exts.includes(ext)) return cat;
    }

    if (mimeType) {
        if (mimeType.startsWith("image/")) return "image";
        if (mimeType.startsWith("video/")) return "video";
        if (mimeType.startsWith("audio/")) return "audio";
        if (mimeType.startsWith("text/")) return "document";
    }

    return "other";
}

/**
 * Read metadata cache
 */
function readMetadata() {
    try {
        if (fs.existsSync(META_FILE)) {
            const raw = fs.readFileSync(META_FILE, "utf8");
            return JSON.parse(raw);
        }
    } catch (e) {
        console.warn("Failed to read .meta.json, resetting:", e.message);
    }
    return {};
}

/**
 * Save metadata cache
 */
function writeMetadata(data) {
    try {
        fs.writeFileSync(META_FILE, JSON.stringify(data, null, 2), "utf8");
    } catch (e) {
        console.error("Failed to write .meta.json:", e.message);
    }
}

/**
 * Get all files in uploads directory with enriched metadata
 */
function getAllFiles() {
    const meta = readMetadata();
    const dirents = fs.readdirSync(UPLOAD_DIR, { withFileTypes: true });
    const files = [];

    for (const dirent of dirents) {
        // Skip hidden files and meta files
        if (dirent.name.startsWith(".") || dirent.name === "desktop.ini" || dirent.name === "thumbs.db") {
            continue;
        }

        if (dirent.isFile()) {
            const filePath = path.join(UPLOAD_DIR, dirent.name);
            try {
                const stat = fs.statSync(filePath);
                const mimeType = mime.lookup(dirent.name) || "application/octet-stream";
                const category = getCategory(dirent.name, mimeType);
                const fileMeta = meta[dirent.name] || {};

                files.push({
                    name: dirent.name,
                    originalName: fileMeta.originalName || dirent.name,
                    size: stat.size,
                    formattedSize: formatBytes(stat.size),
                    mimeType,
                    category,
                    createdAt: fileMeta.createdAt || stat.birthtime || stat.mtime,
                    modifiedAt: stat.mtime,
                    downloads: fileMeta.downloads || 0,
                    sender: fileMeta.sender || "LAN Device"
                });
            } catch (err) {
                console.warn(`Could not stat file ${dirent.name}:`, err.message);
            }
        }
    }

    // Sort newest first
    files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return files;
}

/**
 * Get file stats: total files, total size, category breakdown
 */
function getStorageStats() {
    const files = getAllFiles();
    let totalSize = 0;
    const categories = {
        image: 0,
        video: 0,
        audio: 0,
        document: 0,
        archive: 0,
        code: 0,
        other: 0
    };

    for (const f of files) {
        totalSize += f.size;
        if (categories[f.category] !== undefined) {
            categories[f.category]++;
        } else {
            categories.other++;
        }
    }

    return {
        totalFiles: files.length,
        totalSize,
        formattedTotalSize: formatBytes(totalSize),
        categories
    };
}

/**
 * Record a new uploaded file in metadata
 */
function recordFile(filename, originalName, sender = "LAN Device") {
    const meta = readMetadata();
    meta[filename] = {
        originalName: originalName || filename,
        createdAt: new Date().toISOString(),
        downloads: 0,
        sender
    };
    writeMetadata(meta);
}

/**
 * Increment download count
 */
function incrementDownload(filename) {
    const meta = readMetadata();
    if (meta[filename]) {
        meta[filename].downloads = (meta[filename].downloads || 0) + 1;
        writeMetadata(meta);
    }
}

/**
 * Rename a file safely
 */
function renameFile(oldName, newName) {
    // Sanitize newName
    const cleanNewName = path.basename(newName).replace(/[/\\?%*:|"<>]/g, "-");
    const oldPath = path.join(UPLOAD_DIR, oldName);
    const newPath = path.join(UPLOAD_DIR, cleanNewName);

    if (!fs.existsSync(oldPath)) {
        throw new Error("Source file does not exist");
    }

    if (fs.existsSync(newPath) && oldName !== cleanNewName) {
        throw new Error("A file with that name already exists");
    }

    fs.renameSync(oldPath, newPath);

    // Update metadata
    const meta = readMetadata();
    if (meta[oldName]) {
        meta[cleanNewName] = { ...meta[oldName], originalName: cleanNewName };
        delete meta[oldName];
        writeMetadata(meta);
    }

    return cleanNewName;
}

/**
 * Delete a file
 */
function deleteFile(filename) {
    const safeName = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, safeName);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    const meta = readMetadata();
    if (meta[safeName]) {
        delete meta[safeName];
        writeMetadata(meta);
    }

    return true;
}

/**
 * Clipboard management (cross-device text/links sharing)
 */
function readClipboard() {
    try {
        if (fs.existsSync(CLIPBOARD_FILE)) {
            return JSON.parse(fs.readFileSync(CLIPBOARD_FILE, "utf8"));
        }
    } catch (e) {
        console.warn("Failed to read clipboard:", e.message);
    }
    return [];
}

function saveClipboard(items) {
    try {
        fs.writeFileSync(CLIPBOARD_FILE, JSON.stringify(items, null, 2), "utf8");
    } catch (e) {
        console.error("Failed to save clipboard:", e.message);
    }
}

function addClipboardItem(text, sender = "LAN Device") {
    const items = readClipboard();
    const newItem = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        text: text.trim(),
        sender,
        createdAt: new Date().toISOString()
    };
    // Keep last 50 clipboard items
    items.unshift(newItem);
    if (items.length > 50) items.pop();
    saveClipboard(items);
    return newItem;
}

function deleteClipboardItem(id) {
    let items = readClipboard();
    items = items.filter(item => item.id !== id);
    saveClipboard(items);
    return true;
}

module.exports = {
    UPLOAD_DIR,
    formatBytes,
    getCategory,
    getAllFiles,
    getStorageStats,
    recordFile,
    incrementDownload,
    renameFile,
    deleteFile,
    readClipboard,
    addClipboardItem,
    deleteClipboardItem
};
