/*
==========================================================
                FileTransfer Pro v2
----------------------------------------------------------
SQLite Database Manager
Created By DPS
Version : 2.0.0
==========================================================
*/

"use strict";

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const logger = require("../utils/logger");

/*=========================================================
                    Database Directory
=========================================================*/

const DATABASE_DIR = path.join(

    __dirname,

    "..",

    "..",

    "database"

);

if (!fs.existsSync(DATABASE_DIR)) {

    fs.mkdirSync(

        DATABASE_DIR,

        {

            recursive: true

        }

    );

}

/*=========================================================
                    Database File
=========================================================*/

const DATABASE_FILE = path.join(

    DATABASE_DIR,

    "filetransfer.db"

);

/*=========================================================
                    Open Database
=========================================================*/

const db = new Database(

    DATABASE_FILE

);

db.pragma(

    "journal_mode = WAL"

);

db.pragma(

    "foreign_keys = ON"

);

logger.success(

    "SQLite database initialized."

);

/*=========================================================
                    Initialize Schema
=========================================================*/

function initialize() {

    db.exec(`

CREATE TABLE IF NOT EXISTS users (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    username TEXT UNIQUE NOT NULL,

    email TEXT UNIQUE,

    password TEXT NOT NULL,

    avatar TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);

CREATE TABLE IF NOT EXISTS files (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    filename TEXT NOT NULL,

    original_name TEXT,

    size INTEGER,

    type TEXT,

    hash TEXT,

    uploaded_by INTEGER,

    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(uploaded_by)

        REFERENCES users(id)

);

`);

    logger.success(

        "Core tables created."

    );

}

/*=========================================================
                    Share Links Table
=========================================================*/

db.exec(`

CREATE TABLE IF NOT EXISTS share_links (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    file_id INTEGER NOT NULL,

    share_token TEXT UNIQUE NOT NULL,

    password TEXT,

    expires_at DATETIME,

    download_count INTEGER DEFAULT 0,

    max_downloads INTEGER DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(file_id)

        REFERENCES files(id)

        ON DELETE CASCADE

);

`);

/*=========================================================
                    Activity Logs
=========================================================*/

db.exec(`

CREATE TABLE IF NOT EXISTS activity_logs (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER,

    action TEXT NOT NULL,

    target TEXT,

    ip_address TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id)

        REFERENCES users(id)

        ON DELETE SET NULL

);

`);

/*=========================================================
                    Settings
=========================================================*/

db.exec(`

CREATE TABLE IF NOT EXISTS settings (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    setting_key TEXT UNIQUE,

    setting_value TEXT,

    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP

);

`);

/*=========================================================
                    Performance Indexes
=========================================================*/

db.exec(`

CREATE INDEX IF NOT EXISTS idx_files_name

ON files(filename);

CREATE INDEX IF NOT EXISTS idx_files_hash

ON files(hash);

CREATE INDEX IF NOT EXISTS idx_users_username

ON users(username);

CREATE INDEX IF NOT EXISTS idx_share_token

ON share_links(share_token);

CREATE INDEX IF NOT EXISTS idx_logs_action

ON activity_logs(action);

`);

/*=========================================================
                    Default Settings
=========================================================*/

const insertSetting = db.prepare(`

INSERT OR IGNORE INTO settings

(setting_key, setting_value)

VALUES (?, ?)

`);

insertSetting.run(

    "theme",

    "dark"

);

insertSetting.run(

    "language",

    "en"

);

insertSetting.run(

    "allow_registration",

    "true"

);

insertSetting.run(

    "max_upload_size",

    "1073741824"

);

insertSetting.run(

    "footer",

    "Created By DPS"

);

logger.success(

    "Database schema initialized."

);

/*=========================================================
                    Optimize Database
=========================================================*/

db.pragma(

    "optimize"

);

db.pragma(

    "analysis_limit=400"

);

/*=========================================================
                Backup Database
=========================================================*/

function backup(destination) {

    const backupPath = destination ||

        path.join(

            DATABASE_DIR,

            `backup_${Date.now()}.db`

        );

    fs.copyFileSync(

        DATABASE_FILE,

        backupPath

    );

    logger.success(

        `Database backup created: ${backupPath}`

    );

    return backupPath;

}

/*=========================================================
                Database Statistics
=========================================================*/

function statistics() {

    const users = db

        .prepare(

            "SELECT COUNT(*) AS total FROM users"

        )

        .get();

    const files = db

        .prepare(

            "SELECT COUNT(*) AS total FROM files"

        )

        .get();

    const shares = db

        .prepare(

            "SELECT COUNT(*) AS total FROM share_links"

        )

        .get();

    const logs = db

        .prepare(

            "SELECT COUNT(*) AS total FROM activity_logs"

        )

        .get();

    return {

        users: users.total,

        files: files.total,

        shares: shares.total,

        logs: logs.total

    };

}

/*=========================================================
                Vacuum Database
=========================================================*/

function vacuum() {

    db.exec(

        "VACUUM"

    );

    logger.success(

        "Database vacuum completed."

    );

}

/*=========================================================
                Execute Query
=========================================================*/

function execute(sql, params = []) {

    return db

        .prepare(sql)

        .run(...params);

}

/*=========================================================
                Get One Row
=========================================================*/

function get(sql, params = []) {

    return db

        .prepare(sql)

        .get(...params);

}

/*=========================================================
                Get All Rows
=========================================================*/

function all(sql, params = []) {

    return db

        .prepare(sql)

        .all(...params);

}

/*=========================================================
                Transaction
=========================================================*/

function transaction(callback) {

    return db.transaction(callback);

}

/*=========================================================
                Close Database
=========================================================*/

function close() {

    db.close();

    logger.info(

        "Database connection closed."

    );

}

/*=========================================================
                Module Exports
=========================================================*/

module.exports = {

    db,

    initialize,

    backup,

    statistics,

    vacuum,

    execute,

    get,

    all,

    transaction,

    close

};