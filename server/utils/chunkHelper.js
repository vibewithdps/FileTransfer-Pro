const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

// =====================================
// ROOT UPLOAD DIRECTORIES
// =====================================

const ROOT_DIR = path.join(process.cwd(), "storage");
const CHUNK_DIR = path.join(ROOT_DIR, "chunks");
const FILE_DIR = path.join(ROOT_DIR, "files");

// =====================================
// ENSURE DIRECTORIES EXIST
// =====================================

async function ensureDirectories() {
    await fsp.mkdir(CHUNK_DIR, { recursive: true });
    await fsp.mkdir(FILE_DIR, { recursive: true });
}

// =====================================
// GET UPLOAD DIRECTORY
// =====================================

function getUploadDirectory(uploadId) {
    return path.join(CHUNK_DIR, uploadId);
}

// =====================================
// CREATE SESSION DIRECTORY
// =====================================

async function createUploadDirectory(uploadId) {
    const dir = getUploadDirectory(uploadId);

    await fsp.mkdir(dir, {
        recursive: true,
    });

    return dir;
}

// =====================================
// CHUNK FILE PATH
// =====================================

function getChunkPath(uploadId, chunkIndex) {
    return path.join(
        getUploadDirectory(uploadId),
        `${chunkIndex}.chunk`
    );
}

// =====================================
// FINAL FILE PATH
// =====================================

function getFinalFilePath(filename) {
    return path.join(FILE_DIR, filename);
}

// =====================================
// CHECK CHUNK EXISTS
// =====================================

function chunkExists(uploadId, chunkIndex) {
    return fs.existsSync(
        getChunkPath(uploadId, chunkIndex)
    );
}

// =====================================
// LIST UPLOADED CHUNKS
// =====================================

async function getUploadedChunks(uploadId) {
    const dir = getUploadDirectory(uploadId);

    if (!fs.existsSync(dir)) {
        return [];
    }

    const files = await fsp.readdir(dir);

    return files
        .map(file => Number(file.replace(".chunk", "")))
        .sort((a, b) => a - b);
}

// =====================================
// MERGE CHUNKS
// =====================================

async function mergeChunks(
    uploadId,
    totalChunks,
    outputFile
) {
    const writeStream = fs.createWriteStream(outputFile);

    for (let i = 0; i < totalChunks; i++) {
        const chunkFile = getChunkPath(uploadId, i);

        await new Promise((resolve, reject) => {
            const readStream = fs.createReadStream(chunkFile);

            readStream.on("error", reject);
            writeStream.on("error", reject);

            readStream.on("end", resolve);

            readStream.pipe(writeStream, {
                end: false,
            });
        });
    }

    writeStream.end();

    await new Promise(resolve => {
        writeStream.on("finish", resolve);
    });
}

// =====================================
// DELETE CHUNK DIRECTORY
// =====================================

async function removeUploadDirectory(uploadId) {
    const dir = getUploadDirectory(uploadId);

    await fsp.rm(dir, {
        recursive: true,
        force: true,
    });
}

// =====================================
// UPLOAD PROGRESS
// =====================================

function calculateProgress(uploaded, total) {
    return Math.round(
        (uploaded / total) * 100
    );
}

// =====================================
// VALIDATE CHUNK INDEX
// =====================================

function isValidChunk(index, totalChunks) {
    return (
        Number.isInteger(index) &&
        index >= 0 &&
        index < totalChunks
    );
}

module.exports = {
    ROOT_DIR,
    CHUNK_DIR,
    FILE_DIR,
    ensureDirectories,
    createUploadDirectory,
    getUploadDirectory,
    getChunkPath,
    getFinalFilePath,
    chunkExists,
    getUploadedChunks,
    mergeChunks,
    removeUploadDirectory,
    calculateProgress,
    isValidChunk,
};