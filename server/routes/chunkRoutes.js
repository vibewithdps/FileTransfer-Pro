const express = require("express");

const router = express.Router();

const chunkController = require("../controllers/chunkController");

const authMiddleware = require("../middleware/authMiddleware");

const chunkUploadMiddleware = require("../middleware/chunkUploadMiddleware");


// ======================================
// CREATE UPLOAD SESSION
// POST /api/chunks/session
// ======================================

router.post(
    "/session",
    authMiddleware.authenticate,
    chunkController.createSession
);



// ======================================
// UPLOAD SINGLE CHUNK
// POST /api/chunks/upload/:uploadId
// ======================================

router.post(
    "/upload/:uploadId",
    authMiddleware.authenticate,
    chunkUploadMiddleware.uploadChunk,
    chunkController.uploadChunk
);



// ======================================
// GET UPLOAD STATUS
// GET /api/chunks/status/:uploadId
// ======================================

router.get(
    "/status/:uploadId",
    authMiddleware.authenticate,
    chunkController.getStatus
);



// ======================================
// MERGE ALL CHUNKS
// POST /api/chunks/merge/:uploadId
// ======================================

router.post(
    "/merge/:uploadId",
    authMiddleware.authenticate,
    chunkController.completeUpload
);



// ======================================
// CANCEL UPLOAD
// DELETE /api/chunks/cancel/:uploadId
// ======================================

router.delete(
    "/cancel/:uploadId",
    authMiddleware.authenticate,
    chunkController.cancelUpload
);



module.exports = router;