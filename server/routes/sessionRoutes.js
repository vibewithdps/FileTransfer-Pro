/*
==========================================================
    FileTransfer Pro v2
    Session Routes (Private QR Pairing)
==========================================================
*/

"use strict";

const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/sessionController");

// Create new session & get QR
router.post("/create", sessionController.createSession);

// Join existing session with token or PIN
router.post("/join", sessionController.joinSession);

// Check session status
router.get("/:id/status", sessionController.getStatus);

// Get files for specific session
router.get("/:id/files", sessionController.getSessionFiles);

// Get clipboard for specific session
router.get("/:id/clipboard", sessionController.getSessionClipboard);

// Add clipboard to specific session
router.post("/:id/clipboard", sessionController.addSessionClipboard);

// Delete clipboard item from specific session
router.delete("/:id/clipboard/:clipId", sessionController.deleteSessionClipboard);

// End & clear session
router.post("/:id/end", sessionController.endSession);

module.exports = router;
