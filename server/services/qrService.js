/*
==========================================================
    FileTransfer Pro v2
    QR Code Generation Service
==========================================================
*/

"use strict";

const QRCode = require("qrcode");

/**
 * Generates an ASCII QR code string for the terminal
 * @param {string} text - URL or text to encode
 * @returns {Promise<string>}
 */
async function generateTerminalQR(text) {
    try {
        return await QRCode.toString(text, {
            type: "terminal",
            small: true
        });
    } catch (err) {
        console.error("Terminal QR generation failed:", err.message);
        return "";
    }
}

/**
 * Generates a PNG Data URL for browser display
 * @param {string} text - URL or text to encode
 * @returns {Promise<string>}
 */
async function generateDataURL(text) {
    try {
        return await QRCode.toDataURL(text, {
            errorCorrectionLevel: "M",
            margin: 2,
            scale: 8,
            color: {
                dark: "#0f172a",
                light: "#ffffff"
            }
        });
    } catch (err) {
        console.error("DataURL QR generation failed:", err.message);
        return "";
    }
}

/**
 * Generates SVG string for high-res vector rendering
 * @param {string} text - URL or text to encode
 * @returns {Promise<string>}
 */
async function generateSVG(text) {
    try {
        return await QRCode.toString(text, {
            type: "svg",
            margin: 1
        });
    } catch (err) {
        console.error("SVG QR generation failed:", err.message);
        return "";
    }
}

module.exports = {
    generateTerminalQR,
    generateDataURL,
    generateSVG
};
