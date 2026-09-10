/*
==========================================================
                FileTransfer Pro v2
----------------------------------------------------------
Response Utility
Created By DPS
Version : 2.0.0
==========================================================
*/

"use strict";

/*=========================================================
                    Timestamp
=========================================================*/

function timestamp() {

    return new Date().toISOString();

}

/*=========================================================
                    Success Response
=========================================================*/

function success(

    res,

    message = "Success",

    data = {},

    status = 200

) {

    return res.status(status).json({

        success: true,

        message,

        data,

        timestamp: timestamp()

    });

}

/*=========================================================
                    Error Response
=========================================================*/

function error(

    res,

    message = "Something went wrong",

    status = 500,

    errors = null

) {

    return res.status(status).json({

        success: false,

        message,

        errors,

        timestamp: timestamp()

    });

}

/*=========================================================
                    Validation Error
=========================================================*/

function validation(

    res,

    errors = []

) {

    return res.status(422).json({

        success: false,

        message: "Validation Failed",

        errors,

        timestamp: timestamp()

    });

}

/*=========================================================
                    Unauthorized
=========================================================*/

function unauthorized(

    res,

    message = "Unauthorized"

) {

    return res.status(401).json({

        success: false,

        message,

        timestamp: timestamp()

    });

}

/*=========================================================
                    Forbidden
=========================================================*/

function forbidden(

    res,

    message = "Access Denied"

) {

    return res.status(403).json({

        success: false,

        message,

        timestamp: timestamp()

    });

}

/*=========================================================
                    Not Found
=========================================================*/

function notFound(

    res,

    message = "Resource Not Found"

) {

    return res.status(404).json({

        success: false,

        message,

        timestamp: timestamp()

    });

}

/*=========================================================
                    Created
=========================================================*/

function created(

    res,

    message = "Created Successfully",

    data = {}

) {

    return res.status(201).json({

        success: true,

        message,

        data,

        timestamp: timestamp()

    });

}

/*=========================================================
                    No Content
=========================================================*/

function noContent(res) {

    return res.status(204).send();

}

/*=========================================================
                    Paginated Response
=========================================================*/

function paginated(

    res,

    message,

    data,

    page,

    limit,

    total

) {

    const totalPages = Math.ceil(

        total / limit

    );

    return res.status(200).json({

        success: true,

        message,

        data,

        pagination: {

            page,

            limit,

            total,

            totalPages,

            hasNext:

                page < totalPages,

            hasPrevious:

                page > 1

        },

        timestamp: timestamp()

    });

}

/*=========================================================
                    Custom Response
=========================================================*/

function custom(

    res,

    status,

    payload

) {

    return res.status(status).json({

        ...payload,

        timestamp: timestamp()

    });

}

/*=========================================================
                    Module Exports
=========================================================*/

module.exports = {

    success,

    error,

    validation,

    unauthorized,

    forbidden,

    notFound,

    created,

    noContent,

    paginated,

    custom

};