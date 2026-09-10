/*
==========================================================
                FileTransfer Pro v2
----------------------------------------------------------
Professional Logger
Created By DPS
==========================================================
*/

"use strict";

const fs = require("fs");
const path = require("path");

/*=========================================================
                    Log Directory
=========================================================*/

const LOG_DIR = path.join(

    __dirname,

    "..",

    "..",

    "logs"

);

if (!fs.existsSync(LOG_DIR)) {

    fs.mkdirSync(LOG_DIR, {

        recursive: true

    });

}

/*=========================================================
                    Log File
=========================================================*/

const LOG_FILE = path.join(

    LOG_DIR,

    "server.log"

);

/*=========================================================
                    Colors
=========================================================*/

const COLORS = {

    reset: "\x1b[0m",

    red: "\x1b[31m",

    green: "\x1b[32m",

    yellow: "\x1b[33m",

    blue: "\x1b[34m",

    cyan: "\x1b[36m",

    magenta: "\x1b[35m",

    white: "\x1b[37m"

};

/*=========================================================
                    Timestamp
=========================================================*/

function timestamp() {

    return new Date().toLocaleString();

}

/*=========================================================
                    Write File
=========================================================*/

function write(level, message) {

    const line =

        `[${timestamp()}] ` +

        `[${level}] ` +

        message +

        "\n";

    fs.appendFile(

        LOG_FILE,

        line,

        err => {

            if (err) {

                console.error(err);

            }

        }

    );

}

/*=========================================================
                    Console Log
=========================================================*/

function consoleLog(color, level, message) {

    console.log(

        color +

        `[${level}] ` +

        COLORS.reset +

        message

    );

    write(level, message);

}

/*
==========================================================
                FileTransfer Pro v2
----------------------------------------------------------
Professional Logger
Created By DPS
==========================================================
*/

"use strict";

const fs = require("fs");
const path = require("path");

/*=========================================================
                    Log Directory
=========================================================*/

const LOG_DIR = path.join(

    __dirname,

    "..",

    "..",

    "logs"

);

if (!fs.existsSync(LOG_DIR)) {

    fs.mkdirSync(LOG_DIR, {

        recursive: true

    });

}

/*=========================================================
                    Log File
=========================================================*/

const LOG_FILE = path.join(

    LOG_DIR,

    "server.log"

);

/*=========================================================
                    Colors
=========================================================*/

const COLORS = {

    reset: "\x1b[0m",

    red: "\x1b[31m",

    green: "\x1b[32m",

    yellow: "\x1b[33m",

    blue: "\x1b[34m",

    cyan: "\x1b[36m",

    magenta: "\x1b[35m",

    white: "\x1b[37m"

};

/*=========================================================
                    Timestamp
=========================================================*/

function timestamp() {

    return new Date().toLocaleString();

}

/*=========================================================
                    Write File
=========================================================*/

function write(level, message) {

    const line =

        `[${timestamp()}] ` +

        `[${level}] ` +

        message +

        "\n";

    fs.appendFile(

        LOG_FILE,

        line,

        err => {

            if (err) {

                console.error(err);

            }

        }

    );

}

/*=========================================================
                    Console Log
=========================================================*/

function consoleLog(color, level, message) {

    console.log(

        color +

        `[${level}] ` +

        COLORS.reset +

        message

    );

    write(level, message);

}