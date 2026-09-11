/*
==========================================================
    FileTransfer Pro v2
    Real-Time Socket.IO Hub (Session-Scoped Room Engine)
==========================================================
*/

"use strict";

const { Server } = require("socket.io");
const sessionManager = require("../utils/sessionManager");

let io = null;
const connectedUsers = new Map();

function initialize(server) {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT", "DELETE"]
        },
        transports: ["websocket", "polling"]
    });

    io.on("connection", (socket) => {
        const clientIp = socket.handshake.headers["x-forwarded-for"] || socket.handshake.address || "LAN Device";
        const userAgent = socket.handshake.headers["user-agent"] || "Unknown Device";

        connectedUsers.set(socket.id, {
            id: socket.id,
            ip: clientIp,
            userAgent,
            connectedAt: new Date()
        });

        emitOnlineUsers();

        // Device joins private session room
        socket.on("joinSessionRoom", (data) => {
            if (!data || !data.sessionId) return;
            const sessionId = data.sessionId.toUpperCase();
            const token = data.token;
            const role = data.role || "client"; // 'host' | 'client'
            const deviceName = data.deviceName || "Device";

            // Validate credentials
            if (!sessionManager.validateSession(sessionId, token)) {
                socket.emit("sessionError", { message: "Invalid or expired session" });
                return;
            }

            const roomName = `room_${sessionId}`;
            socket.join(roomName);
            socket.sessionId = sessionId;
            socket.role = role;
            socket.deviceName = deviceName;

            const session = sessionManager.getSession(sessionId);

            // Notify room that device joined
            socket.emit("sessionJoined", {
                sessionId,
                role,
                status: session ? session.status : "waiting"
            });

            // If session is already paired or both devices are in room, broadcast paired status
            if (session && session.status === "paired") {
                io.to(roomName).emit("sessionPaired", {
                    sessionId,
                    host: session.host,
                    client: session.client
                });
            }
        });

        // Ping / Keep-alive
        socket.on("pingServer", () => {
            socket.emit("pong", { time: Date.now() });
        });

        socket.on("disconnect", () => {
            if (socket.sessionId) {
                const roomName = `room_${socket.sessionId}`;
                socket.to(roomName).emit("peerDisconnected", {
                    deviceName: socket.deviceName || "Peer Device",
                    role: socket.role
                });
            }
            connectedUsers.delete(socket.id);
            emitOnlineUsers();
        });
    });

    return io;
}

function emitOnlineUsers() {
    if (!io) return;
    io.emit("onlineUsers", connectedUsers.size);
}

// Broadcasts paired event to the specific session room
function sessionPaired(sessionId, details) {
    if (!io) return;
    const roomName = `room_${sessionId.toUpperCase()}`;
    io.to(roomName).emit("sessionPaired", {
        sessionId,
        ...details,
        time: Date.now()
    });
}

// Broadcasts file upload to the specific session room ONLY
function sessionFileUploaded(sessionId, file) {
    if (!io) return;
    const roomName = `room_${sessionId.toUpperCase()}`;
    io.to(roomName).emit("sessionFileUploaded", {
        success: true,
        sessionId,
        file,
        time: Date.now()
    });
}

// Broadcasts clipboard to the specific session room ONLY
function sessionClipboardUpdated(sessionId, item) {
    if (!io) return;
    const roomName = `room_${sessionId.toUpperCase()}`;
    io.to(roomName).emit("sessionClipboardUpdated", {
        sessionId,
        item,
        time: Date.now()
    });
}

// Broadcasts session end to the specific session room
function sessionEnded(sessionId) {
    if (!io) return;
    const roomName = `room_${sessionId.toUpperCase()}`;
    io.to(roomName).emit("sessionEnded", {
        sessionId,
        message: "This transfer session has been closed.",
        time: Date.now()
    });
}

// Global fallback broadcasts (for backwards compatibility if needed)
function fileUploaded(file) {
    if (!io) return;
    io.emit("fileUploaded", { success: true, file, time: Date.now() });
}

function fileDeleted(file) {
    if (!io) return;
    io.emit("fileDeleted", { success: true, file, time: Date.now() });
}

function fileRenamed(oldName, newName) {
    if (!io) return;
    io.emit("fileRenamed", { old: oldName, new: newName, time: Date.now() });
}

module.exports = {
    initialize,
    emitOnlineUsers,
    sessionPaired,
    sessionFileUploaded,
    sessionClipboardUpdated,
    sessionEnded,
    fileUploaded,
    fileDeleted,
    fileRenamed
};