/*
==========================================================
    FileTransfer Pro v2
    Main Server Entrypoint (Multi-Platform LAN Host)
==========================================================
*/

"use strict";

require("dotenv").config();

const http = require("http");
const app = require("./app");
const socketManager = require("./sockets/socket");
const ipUtils = require("./utils/ip");
const qrService = require("./services/qrService");
const open = require("open");

const PORT = parseInt(process.env.PORT, 10) || 5000;
const server = http.createServer(app);

// Initialize Socket.IO
socketManager.initialize(server);

// Start server on 0.0.0.0 (all interfaces)
server.listen(PORT, "0.0.0.0", async () => {
    const interfaces = ipUtils.getNetworkInterfaces();
    const primaryIp = ipUtils.getPrimaryIp();
    const localUrl = `http://localhost:${PORT}`;
    const primaryLanUrl = `http://${primaryIp}:${PORT}`;

    // Generate terminal ASCII QR code for fast mobile scanning
    const terminalQR = await qrService.generateTerminalQR(primaryLanUrl);

    console.clear();
    console.log("\x1b[36m%s\x1b[0m", "======================================================================");
    console.log("\x1b[1m\x1b[32m%s\x1b[0m", "   🚀  FILETRANSFER PRO v2 — CROSS-PLATFORM LAN HUB RUNNING");
    console.log("\x1b[36m%s\x1b[0m", "======================================================================");
    console.log(`\x1b[33m💻 Host Device:\x1b[0m       ${localUrl}`);
    console.log(`\x1b[33m📱 Mobile / LAN:\x1b[0m      \x1b[1m\x1b[32m${primaryLanUrl}\x1b[0m`);
    
    if (interfaces.length > 1) {
        console.log(`\x1b[33m🌐 Other Interfaces:\x1b[0m`);
        interfaces.slice(1).forEach(iface => {
            console.log(`   • [${iface.name}] http://${iface.address}:${PORT}`);
        });
    }

    console.log("\x1b[36m%s\x1b[0m", "----------------------------------------------------------------------");
    console.log("\x1b[35m%s\x1b[0m", "📱 Scan this QR Code with your Phone Camera (Android / iPhone / iPad):");
    console.log(terminalQR);
    console.log("\x1b[36m%s\x1b[0m", "----------------------------------------------------------------------");
    console.log("⚡ Works seamlessly on Windows, Mac, Linux, Android, iOS & Tablets.");
    console.log("Press Ctrl+C to stop the server anytime.\n");

    // Automatically open local URL on host computer if not in headless/CI mode
    if (process.env.AUTO_OPEN !== "false" && process.env.NODE_ENV !== "test") {
        try {
            await open(localUrl);
        } catch (e) {
            // Ignore if browser launch not supported in environment
        }
    }
});

// Graceful shutdown
const shutdown = () => {
    console.log("\n🛑 Stopping FileTransfer Pro server...");
    server.close(() => {
        console.log("Server stopped successfully. Goodbye!");
        process.exit(0);
    });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);