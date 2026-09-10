const express = require("express");

const router = express.Router();

const shareController =
    require("../controllers/shareController");

const authMiddleware =
    require("../middleware/authMiddleware");



// =====================================
// CREATE SHARE LINK
// POST /api/share/:id
// =====================================

router.post(

    "/:id",

    authMiddleware.authenticate,

    shareController.createShareLink

);



// =====================================
// GET SHARED FILE DETAILS
// GET /api/share/:token
// =====================================

router.get(

    "/:token",

    shareController.getSharedFile

);



// =====================================
// DOWNLOAD SHARED FILE
// GET /api/share/download/:token
// =====================================

router.get(

    "/download/:token",

    shareController.downloadSharedFile

);



module.exports = router;