/*
==========================================================
    FileTransfer Pro v2
    File Routes
==========================================================
*/

"use strict";

const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");

// List all files with optional search & category filter
router.get("/", fileController.getFiles);

// Storage stats
router.get("/stats", fileController.getStats);

// Single file metadata
router.get("/info/:name", fileController.getFile);

// Download file (force attachment download)
router.get("/download/:name", fileController.downloadFile);

// Preview / Stream file (inline display + HTTP Range video/audio seek)
router.get("/preview/:name", fileController.previewFile);

// Rename file
router.put("/:name", fileController.renameFile);

// Delete file
router.delete("/:name", fileController.deleteFile);

module.exports = router;