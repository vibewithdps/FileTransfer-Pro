/*
==========================================================
    FileTransfer Pro v2
    Clipboard Routes
==========================================================
*/

"use strict";

const express = require("express");
const router = express.Router();
const clipboardController = require("../controllers/clipboardController");

router.get("/", clipboardController.getClipboard);
router.post("/", clipboardController.addClipboard);
router.delete("/:id", clipboardController.deleteClipboard);

module.exports = router;
