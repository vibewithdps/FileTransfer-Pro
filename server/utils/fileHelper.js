const crypto = require("crypto");
const path = require("path");
const fs = require("fs");



// =====================================
// FORMAT FILE SIZE
// =====================================

const formatFileSize = (bytes) => {

    if (bytes === 0) return "0 Bytes";

    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB",
        "TB"
    ];

    const index = Math.floor(
        Math.log(bytes) / Math.log(1024)
    );

    return (
        (bytes / Math.pow(1024, index)).toFixed(2)
        + " "
        + units[index]
    );

};




// =====================================
// FILE EXTENSION
// =====================================

const getExtension = (filename) => {

    return path.extname(filename).toLowerCase();

};




// =====================================
// SAFE FILE NAME
// =====================================

const sanitizeFilename = (filename) => {

    return filename

        .replace(/[^\w.\-]/g, "_")

        .replace(/_+/g, "_");

};




// =====================================
// UNIQUE FILE NAME
// =====================================

const generateStoredName = (filename) => {

    const extension = getExtension(filename);

    return `${Date.now()}_${crypto.randomUUID()}${extension}`;

};




// =====================================
// FILE CATEGORY
// =====================================

const getCategory = (mimeType) => {

    if (mimeType.startsWith("image/"))
        return "image";

    if (mimeType.startsWith("video/"))
        return "video";

    if (mimeType.startsWith("audio/"))
        return "audio";

    if (
        mimeType.includes("pdf") ||
        mimeType.includes("word") ||
        mimeType.includes("excel") ||
        mimeType.includes("presentation") ||
        mimeType === "text/plain"
    )
        return "document";

    if (
        mimeType.includes("zip") ||
        mimeType.includes("rar")
    )
        return "archive";

    return "other";

};




// =====================================
// SHA-256 HASH
// =====================================

const generateFileHash = (filePath) => {

    return new Promise((resolve, reject) => {

        const hash =
            crypto.createHash("sha256");

        const stream =
            fs.createReadStream(filePath);

        stream.on("data", (chunk) => {

            hash.update(chunk);

        });

        stream.on("end", () => {

            resolve(
                hash.digest("hex")
            );

        });

        stream.on("error", reject);

    });

};




module.exports = {

    formatFileSize,

    getExtension,

    sanitizeFilename,

    generateStoredName,

    getCategory,

    generateFileHash

};