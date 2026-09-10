/*
==========================================================
                FileTransfer Pro v2
----------------------------------------------------------
Global Error Handler Middleware
Created By DPS
Version : 2.0.0
==========================================================
*/

"use strict";

const multer = require("multer");

const logger = require("../utils/logger");

const response = require("../utils/response");

/*=========================================================
                Global Error Handler
=========================================================*/

function errorHandler(

    err,

    req,

    res,

    next

) {

    if (!err) {

        return next();

    }

    logger.error(

        err.stack ||

        err.message ||

        "Unknown Error"

    );

    /*=====================================================
                    Multer Errors
    =====================================================*/

    if (

        err instanceof

        multer.MulterError

    ) {

        return response.error(

            res,

            err.message,

            400

        );

    }

    /*=====================================================
                    Invalid JSON
    =====================================================*/

    if (

        err instanceof SyntaxError &&

        err.status === 400 &&

        "body" in err

    ) {

        return response.error(

            res,

            "Invalid JSON Format",

            400

        );

    }

    /*=====================================================
                    Validation Error
    =====================================================*/

    if (

        err.name ===

        "ValidationError"

    ) {

        return response.validation(

            res,

            err.errors ||

            []

        );

    }

    /*=====================================================
                    Unauthorized
    =====================================================*/

    if (

        err.status === 401

    ) {

        return response.unauthorized(

            res,

            err.message

        );

    }

    /*=====================================================
                    Forbidden
    =====================================================*/

    if (

        err.status === 403

    ) {

        return response.forbidden(

            res,

            err.message

        );

    }

        /*=====================================================
                    Not Found
    =====================================================*/

    if (

        err.status === 404

    ) {

        return response.notFound(

            res,

            err.message ||

            "Resource Not Found"

        );

    }

    /*=====================================================
                    Payload Too Large
    =====================================================*/

    if (

        err.status === 413

    ) {

        return response.error(

            res,

            "Uploaded file is too large.",

            413

        );

    }

    /*=====================================================
                    Development Mode
    =====================================================*/

    if (

        process.env.NODE_ENV !==

        "production"

    ) {

        return res.status(

            err.status || 500

        ).json({

            success: false,

            message:

                err.message ||

                "Internal Server Error",

            stack: err.stack,

            timestamp:

                new Date().toISOString()

        });

    }

    /*=====================================================
                    Production Mode
    =====================================================*/

    return response.error(

        res,

        "Internal Server Error",

        err.status || 500

    );

}

/*=========================================================
                Async Handler
=========================================================*/

function asyncHandler(fn) {

    return function (

        req,

        res,

        next

    ) {

        Promise.resolve(

            fn(

                req,

                res,

                next

            )

        ).catch(next);

    };

}

/*=========================================================
                Module Exports
=========================================================*/

module.exports = {

    errorHandler,

    asyncHandler

};