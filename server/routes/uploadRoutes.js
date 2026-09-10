/*
==========================================================
    FileTransfer Pro v2
    Upload Routes
==========================================================
*/

"use strict";

const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadController");
const upload = require("../middleware/uploadMiddleware");

// Universal upload endpoint (accepts single or multiple files)
router.post("/", upload.any(), (req, res, next) => {
    if (req.files && req.files.length > 1) {
        return uploadController.uploadMultiple(req, res);
    } else if (req.files && req.files.length === 1) {
        req.file = req.files[0];
        return uploadController.uploadFile(req, res);
    } else if (req.file) {
        return uploadController.uploadFile(req, res);
    }
    return res.status(400).json({
        success: false,
        message: "No file was attached in request"
    });
});

// Explicit multiple upload endpoint
router.post("/multiple", upload.array("files", 100), uploadController.uploadMultiple);

module.exports = router;