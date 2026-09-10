/*
==========================================================
                FileTransfer Pro v2
----------------------------------------------------------
404 Not Found Middleware
Created By DPS
Version : 2.0.0
==========================================================
*/

"use strict";

const response = require("../utils/response");
const logger = require("../utils/logger");

/*=========================================================
                Not Found Middleware
=========================================================*/

function notFound(

    req,

    res,

    next

) {

    logger.warning(

        `404 ${req.method} ${req.originalUrl}`

    );

    return response.notFound(

        res,

        `Route '${req.originalUrl}' Not Found`

    );

}

/*=========================================================
                Module Export
=========================================================*/

module.exports = notFound;
