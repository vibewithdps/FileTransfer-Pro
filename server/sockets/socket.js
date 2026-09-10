/*
==========================================================
    FileTransfer Pro v2
    Real-Time Socket.IO Hub
==========================================================
*/

"use strict";

const { Server } = require("socket.io");

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

        socket.emit("welcome", {
            id: socket.id,
            message: "Connected to FileTransfer Pro v2 Hub"
        });

        socket.on("disconnect", () => {
            connectedUsers.delete(socket.id);
            emitOnlineUsers();
        });

        socket.on("pingServer", () => {
            socket.emit("pong", { time: Date.now() });
        });
    });

    return io;
}

function emitOnlineUsers() {
    if (!io) return;
    io.emit("onlineUsers", connectedUsers.size);
}

function getOnlineUsers() {
    return connectedUsers.size;
}

function fileUploaded(file) {
    if (!io) return;
    io.emit("fileUploaded", {
        success: true,
        file,
        time: Date.now()
    });
}

function fileDeleted(file) {
    if (!io) return;
    io.emit("fileDeleted", {
        success: true,
        file,
        time: Date.now()
    });
}

function fileRenamed(oldName, newName) {
    if (!io) return;
    io.emit("fileRenamed", {
        old: oldName,
        new: newName,
        time: Date.now()
    });
}

function clipboardUpdated(item) {
    if (!io) return;
    io.emit("clipboardUpdated", {
        item,
        time: Date.now()
    });
}

function clipboardDeleted(id) {
    if (!io) return;
    io.emit("clipboardDeleted", {
        id,
        time: Date.now()
    });
}

function refreshFiles() {
    if (!io) return;
    io.emit("refreshFiles");
}

module.exports = {
    initialize,
    emitOnlineUsers,
    getOnlineUsers,
    fileUploaded,
    fileDeleted,
    fileRenamed,
    clipboardUpdated,
    clipboardDeleted,
    refreshFiles
};