/*
==========================================================
    FileTransfer Pro v2
    Session Controller (Private QR Pairing)
==========================================================
*/

"use strict";

const sessionManager = require("../utils/sessionManager");
const ipUtils = require("../utils/ip");
const qrService = require("../services/qrService");

function getSocketIO() {
    try {
        return require("../sockets/socket");
    } catch (e) {
        return null;
    }
}

// Helper to determine device name from user-agent
function parseDeviceName(userAgent = "") {
    if (!userAgent) return "Unknown Device";
    if (/iPhone/i.test(userAgent)) return "Apple iPhone";
    if (/iPad/i.test(userAgent)) return "Apple iPad";
    if (/Android/i.test(userAgent)) return "Android Phone";
    if (/Macintosh|Mac OS/i.test(userAgent)) return "Mac Computer";
    if (/Windows/i.test(userAgent)) return "Windows PC";
    if (/Linux/i.test(userAgent)) return "Linux Device";
    return "Device";
}

// Create a new private session
exports.createSession = async (req, res) => {
    try {
        const clientIp = req.headers["x-forwarded-for"] || req.ip || "LAN Device";
        const userAgent = req.headers["user-agent"] || "";
        const deviceName = parseDeviceName(userAgent);

        const session = sessionManager.createSession({
            name: deviceName,
            ip: clientIp,
            userAgent
        });

        // Determine server URL for QR generation
        const primaryIp = ipUtils.getPrimaryIp();
        const port = process.env.PORT || 5000;
        const hostHeader = req.headers.host || `${primaryIp}:${port}`;
        const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";

        // Join URL embedded in the QR Code
        const joinUrl = `${protocol}://${hostHeader}/?join=${session.id}&token=${session.token}`;

        // Generate QR code Data URL
        const qrCodeDataUrl = await qrService.generateDataURL(joinUrl);

        res.status(201).json({
            success: true,
            session: {
                id: session.id,
                pin: session.pin,
                token: session.token,
                status: session.status,
                joinUrl,
                qrCodeDataUrl,
                host: session.host
            }
        });
    } catch (error) {
        console.error("Create session error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Join a session (scanned QR or entered PIN)
exports.joinSession = async (req, res) => {
    try {
        const { sessionId, token, pin } = req.body;
        const clientIp = req.headers["x-forwarded-for"] || req.ip || "LAN Device";
        const userAgent = req.headers["user-agent"] || "";
        const deviceName = parseDeviceName(userAgent);

        let session = null;

        // If joining with PIN
        if (pin) {
            session = sessionManager.getSessionByPin(pin);
            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: "Invalid or expired 6-digit PIN code"
                });
            }
        } else if (sessionId) {
            session = sessionManager.getSession(sessionId);
            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: "Session not found or expired"
                });
            }
            if (session.token !== token) {
                return res.status(403).json({
                    success: false,
                    message: "Invalid session security token"
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: "Session ID or PIN required"
            });
        }

        // Pair the session
        session = sessionManager.pairSession(session.id, session.token, {
            name: deviceName,
            ip: clientIp,
            userAgent
        });

        // Broadcast sessionPaired to both sockets in room
        const socket = getSocketIO();
        if (socket && typeof socket.sessionPaired === "function") {
            socket.sessionPaired(session.id, {
                host: session.host,
                client: session.client
            });
        }

        res.status(200).json({
            success: true,
            message: "Successfully paired with session",
            session: {
                id: session.id,
                token: session.token,
                status: session.status,
                host: session.host,
                client: session.client
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Get session status
exports.getStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const session = sessionManager.getSession(id);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found"
            });
        }

        res.status(200).json({
            success: true,
            status: session.status,
            host: session.host,
            client: session.client,
            filesCount: session.files.length,
            clipboardCount: session.clipboard.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get files for a specific session
exports.getSessionFiles = async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.headers["x-session-token"] || req.query.token;

        if (!sessionManager.validateSession(id, token)) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: Invalid session credentials"
            });
        }

        const files = sessionManager.getSessionFiles(id);
        res.status(200).json({
            success: true,
            count: files.length,
            files
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get clipboard for a specific session
exports.getSessionClipboard = async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.headers["x-session-token"] || req.query.token;

        if (!sessionManager.validateSession(id, token)) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: Invalid session credentials"
            });
        }

        const items = sessionManager.getSessionClipboard(id);
        res.status(200).json({
            success: true,
            items
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add clipboard item to a specific session
exports.addSessionClipboard = async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.headers["x-session-token"] || req.body.token;
        const { text, sender } = req.body;

        if (!sessionManager.validateSession(id, token)) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: Invalid session credentials"
            });
        }

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Text content cannot be empty"
            });
        }

        const deviceName = sender || parseDeviceName(req.headers["user-agent"]);
        const item = sessionManager.addClipboardToSession(id, text, deviceName);

        // Broadcast to session room only
        const socket = getSocketIO();
        if (socket && typeof socket.sessionClipboardUpdated === "function") {
            socket.sessionClipboardUpdated(id, item);
        }

        res.status(201).json({
            success: true,
            item
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete clipboard item from session
exports.deleteSessionClipboard = async (req, res) => {
    try {
        const { id, clipId } = req.params;
        const token = req.headers["x-session-token"] || req.query.token;

        if (!sessionManager.validateSession(id, token)) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: Invalid session credentials"
            });
        }

        const deleted = sessionManager.deleteClipboardFromSession(id, clipId);
        const socket = getSocketIO();
        if (deleted && socket && typeof socket.sessionClipboardUpdated === "function") {
            socket.sessionClipboardUpdated(id, { deletedId: clipId });
        }

        res.status(200).json({
            success: true,
            message: "Clipboard item removed"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// End session
exports.endSession = async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.headers["x-session-token"] || req.body.token || req.query.token;

        if (!sessionManager.validateSession(id, token)) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: Invalid session credentials"
            });
        }

        sessionManager.closeSession(id);

        const socket = getSocketIO();
        if (socket && typeof socket.sessionEnded === "function") {
            socket.sessionEnded(id);
        }

        res.status(200).json({
            success: true,
            message: "Session ended and cleared successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
