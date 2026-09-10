/*
==========================================================
    FileTransfer Pro v2
    Network Discovery & QR Routes
==========================================================
*/

"use strict";

const express = require("express");
const router = express.Router();
const os = require("os");
const ipUtils = require("../utils/ip");
const qrService = require("../services/qrService");

router.get("/", async (req, res) => {
    try {
        const interfaces = ipUtils.getNetworkInterfaces();
        const primaryIp = ipUtils.getPrimaryIp();
        const port = process.env.PORT || 5000;
        const serverUrl = `http://${primaryIp}:${port}`;

        // Generate QR code Data URL for mobile scanning
        const qrCodeDataUrl = await qrService.generateDataURL(serverUrl);

        res.status(200).json({
            success: true,
            hostname: os.hostname(),
            platform: os.platform(),
            port,
            primaryIp,
            serverUrl,
            qrCodeDataUrl,
            interfaces: interfaces.map(i => ({
                ...i,
                url: `http://${i.address}:${port}`
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
