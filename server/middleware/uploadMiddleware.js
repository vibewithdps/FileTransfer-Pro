/*
==========================================================
    FileTransfer Pro v2
    Universal Upload Middleware (All Formats, High Limit, Clean Names)
==========================================================
*/

"use strict";

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const localStore = require("../utils/localStore");

const uploadDirectory = localStore.UPLOAD_DIR;

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Generate safe filename without overwriting existing files
function getAvailableFilename(dir, originalName) {
    const parsed = path.parse(originalName);
    // Sanitize filename
    const cleanBase = parsed.name.replace(/[/\\?%*:|"<>]/g, "_").trim() || "file";
    const ext = parsed.ext;
    
    let candidate = `${cleanBase}${ext}`;
    let counter = 1;

    while (fs.existsSync(path.join(dir, candidate))) {
        candidate = `${cleanBase} (${counter})${ext}`;
        counter++;
    }

    return candidate;
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDirectory);
    },
    filename(req, file, cb) {
        // Decode URI component if encoded
        let decodedName = file.originalname;
        try {
            decodedName = Buffer.from(file.originalname, "latin1").toString("utf8");
        } catch (e) {
            decodedName = file.originalname;
        }

        const safeFilename = getAvailableFilename(uploadDirectory, decodedName);
        cb(null, safeFilename);
    }
});

// Accept all file types for seamless LAN transfer
const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 * 1024 // 50 GB per file limit (huge for LAN)
    }
});

module.exports = upload;
