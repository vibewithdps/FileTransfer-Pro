const mongoose = require("mongoose");

const chunkUploadSchema = new mongoose.Schema(
    {
        // Unique upload session ID
        uploadId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        // Original filename
        originalName: {
            type: String,
            required: true,
            trim: true
        },

        // Stored filename after merge
        storedName: {
            type: String,
            default: null
        },

        // File owner
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        // MIME type
        mimeType: {
            type: String,
            required: true
        },

        // Total file size (bytes)
        totalSize: {
            type: Number,
            required: true
        },

        // Chunk size (bytes)
        chunkSize: {
            type: Number,
            required: true
        },

        // Total chunks expected
        totalChunks: {
            type: Number,
            required: true
        },

        // Uploaded chunk indexes
        uploadedChunks: {
            type: [Number],
            default: []
        },

        // Upload percentage
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },

        // SHA-256 hash sent by client
        fileHash: {
            type: String,
            default: null
        },

        // Upload status
        status: {
            type: String,
            enum: [
                "pending",
                "uploading",
                "merging",
                "completed",
                "failed",
                "cancelled"
            ],
            default: "pending"
        },

        // Final merged file path
        finalPath: {
            type: String,
            default: null
        },

        // Upload expiration time
        expiresAt: {
            type: Date,
            default: () => {
                const date = new Date();
                date.setHours(date.getHours() + 24);
                return date;
            }
        }
    },
    {
        timestamps: true
    }
);

// =====================================
// INDEXES
// =====================================

// Fast lookup by owner & upload status
chunkUploadSchema.index({
    owner: 1,
    status: 1
});

// Automatically delete abandoned uploads
chunkUploadSchema.index(
    {
        expiresAt: 1
    },
    {
        expireAfterSeconds: 0
    }
);

module.exports = mongoose.model(
    "ChunkUpload",
    chunkUploadSchema
);