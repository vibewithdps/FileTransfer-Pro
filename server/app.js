/*
==========================================================
    FileTransfer Pro v2
    Express Application Configuration
==========================================================
*/

"use strict";

require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const mongoose = require("mongoose");

// Routes
const fileRoutes = require("./routes/fileRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const clipboardRoutes = require("./routes/clipboardRoutes");
const networkRoutes = require("./routes/networkRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const chunkRoutes = require("./routes/chunkRoutes");

const app = express();

// =====================================
// SECURITY & CORS MIDDLEWARE
// =====================================
app.use(
    helmet({
        contentSecurityPolicy: false, // Disabled for seamless LAN file previews, inline media and QR images
        crossOriginResourcePolicy: { policy: "cross-origin" }
    })
);

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Range", "x-client-device"]
    })
);

app.use(compression());

// =====================================
// BODY PARSER
// =====================================
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));
app.use(cookieParser());

// =====================================
// LOGGER
// =====================================
if (process.env.NODE_ENV !== "production") {
    app.use(morgan("short"));
}

// =====================================
// STATIC FILES SERVING (CLIENT UI)
// =====================================
const clientPath = path.join(__dirname, "..", "client");
app.use(express.static(clientPath));
app.use("/public", express.static(path.join(clientPath, "public")));

// =====================================
// OPTIONAL NON-BLOCKING MONGODB SYNC
// =====================================
if (process.env.MONGO_URI && process.env.ENABLE_MONGODB === "true") {
    mongoose
        .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 })
        .then(() => {
            console.log("✅ Cloud MongoDB Atlas Connected");
        })
        .catch((err) => {
            console.log("ℹ️ Running in 100% Offline LAN Mode (Local Filesystem Store active)");
        });
} else {
    console.log("⚡ Zero-Config Offline LAN Mode active (Instant file transfers without cloud dependency)");
}

// =====================================
// API ROUTES
// =====================================
app.use("/api/files", fileRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/clipboard", clipboardRoutes);
app.use("/api/network", networkRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/chunks", chunkRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "🚀 FileTransfer Pro v2 Running",
        version: "2.0.0",
        mode: "LAN Instant Access"
    });
});

// Fallback to index.html for SPA routes
app.get("*", (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Global error:", err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

module.exports = app;