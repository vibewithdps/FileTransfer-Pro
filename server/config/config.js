/*
==========================================================
                FileTransfer Pro v2
----------------------------------------------------------
Application Configuration
Created By DPS
Version : 2.0.0
==========================================================
*/

"use strict";

const path = require("path");

/*=========================================================
                    Root Paths
=========================================================*/

const ROOT = path.join(__dirname, "..", "..");

const CLIENT = path.join(ROOT, "client");

const SERVER = path.join(ROOT, "server");

const UPLOADS = path.join(ROOT, "uploads");

const LOGS = path.join(ROOT, "logs");

/*=========================================================
                    Server
=========================================================*/

const SERVER_CONFIG = {

    HOST: process.env.HOST || "0.0.0.0",

    PORT: Number(process.env.PORT) || 3000,

    ENV:

        process.env.NODE_ENV ||

        "development"

};

/*=========================================================
                    Application
=========================================================*/

const APP = {

    NAME: "FileTransfer Pro v2",

    VERSION: "2.0.0",

    AUTHOR: "Created By DPS",

    DESCRIPTION:

        "Professional File Sharing System"

};

/*=========================================================
                    Upload
=========================================================*/

const UPLOAD = {

    DIRECTORY: UPLOADS,

    MAX_FILE_SIZE:

        1024 *

        1024 *

        1024,

    MAX_FILES: 100,

    TEMP_DIRECTORY:

        path.join(

            UPLOADS,

            "temp"

        )

};

/*=========================================================
                    Allowed MIME Types
=========================================================*/

const MIME_TYPES = [

    /* Images */

    "image/jpeg",

    "image/png",

    "image/webp",

    "image/gif",

    "image/svg+xml",

    /* Video */

    "video/mp4",

    "video/x-matroska",

    "video/quicktime",

    "video/webm",

    /* Audio */

    "audio/mpeg",

    "audio/wav",

    "audio/ogg",

    /* Documents */

    "application/pdf",

    "application/msword",

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    "text/plain",

    /* Excel */

    "application/vnd.ms-excel",

    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    /* Archives */

    "application/zip",

    "application/x-rar-compressed",

    "application/x-7z-compressed"

];

/*=========================================================
                    JWT Configuration
=========================================================*/

const JWT = {

    SECRET:

        process.env.JWT_SECRET ||

        "DPS_FILE_TRANSFER_PRO_SECRET_CHANGE_ME",

    EXPIRES_IN:

        process.env.JWT_EXPIRES ||

        "7d",

    REFRESH_EXPIRES:

        process.env.JWT_REFRESH ||

        "30d"

};

/*=========================================================
                    Socket.IO
=========================================================*/

const SOCKET = {

    CORS_ORIGIN:

        process.env.SOCKET_ORIGIN ||

        "*",

    TRANSPORTS: [

        "websocket",

        "polling"

    ],

    PING_INTERVAL: 25000,

    PING_TIMEOUT: 60000

};

/*=========================================================
                    CORS Configuration
=========================================================*/

const CORS = {

    ORIGIN:

        process.env.CORS_ORIGIN ||

        "*",

    METHODS: [

        "GET",

        "POST",

        "PUT",

        "DELETE"

    ],

    CREDENTIALS: true

};

/*=========================================================
                    Security
=========================================================*/

const SECURITY = {

    ENABLE_HELMET: true,

    ENABLE_COMPRESSION: true,

    ENABLE_CORS: true,

    TRUST_PROXY: false

};

/*=========================================================
                    Rate Limiting
=========================================================*/

const RATE_LIMIT = {

    WINDOW_MS:

        15 * 60 * 1000,

    MAX_REQUESTS: 500

};

/*=========================================================
                    Dashboard
=========================================================*/

const DASHBOARD = {

    AUTO_REFRESH: 5000,

    SHOW_RECENT_FILES: true,

    MAX_RECENT_FILES: 10

};

/*=========================================================
                    Theme
=========================================================*/

const THEME = {

    DEFAULT: "dark",

    ALLOW_SWITCH: true

};

/*=========================================================
                    Application Constants
=========================================================*/

const CONSTANTS = {

    FOOTER_TEXT:

        "Created By DPS",

    COMPANY:

        "DPS",

    YEAR:

        new Date().getFullYear()

};

/*=========================================================
                    Export Configuration
=========================================================*/

module.exports = {

    ROOT,

    CLIENT,

    SERVER,

    UPLOADS,

    LOGS,

    APP,

    SERVER_CONFIG,

    UPLOAD,

    MIME_TYPES,

    JWT,

    SOCKET,

    CORS,

    SECURITY,

    RATE_LIMIT,

    DASHBOARD,

    THEME,

    CONSTANTS

};