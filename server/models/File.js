const mongoose = require("mongoose");


// =====================================
// FILE SCHEMA
// =====================================

const fileSchema = new mongoose.Schema(

    {

        // Original uploaded filename
        originalName: {

            type: String,

            required: true,

            trim: true

        },


        // Stored filename on server
        storedName: {

            type: String,

            required: true

        },


        // Owner of file
        owner: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "User",

            required: true,

            index: true

        },


        // File location
        path: {

            type: String,

            required: true

        },


        // MIME type

        mimeType: {

            type: String,

            required: true

        },


        // File size bytes

        size: {

            type: Number,

            required: true

        },


        // SHA-256 checksum

        hash: {

            type: String,

            default: null

        },


        // File status

        status: {

            type: String,

            enum: [

                "uploaded",

                "processing",

                "ready",

                "deleted"

            ],

            default: "ready"

        },


        // Download counter

        downloads: {

            type: Number,

            default: 0

        },


        // Public sharing

        isPublic: {

            type: Boolean,

            default: false

        },


        // Share token

        shareToken: {

            type: String,

            default: null

        },


        // File expiration

        expiresAt: {

            type: Date,

            default: null

        }


    },


    {

        timestamps:true

    }

);



// =====================================
// INDEXES
// =====================================


fileSchema.index({

    owner:1,

    createdAt:-1

});



fileSchema.index({

    shareToken:1

});



// =====================================
// MODEL EXPORT
// =====================================


module.exports =
mongoose.model(
    "File",
    fileSchema
);