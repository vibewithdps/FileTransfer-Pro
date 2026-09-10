const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const {
    v4: uuidv4
} = require("uuid");


const ChunkUpload =
    require("../models/ChunkUpload");


const File =
    require("../models/File");


const uploadManager =
    require("../utils/uploadManager");



// =====================================
// CREATE UPLOAD SESSION
// =====================================

exports.createUploadSession = async(data)=>{


    const uploadId =
        uuidv4();



    const session =
        await ChunkUpload.create({

            uploadId,

            owner:data.owner,

            originalName:
                data.originalName,

            mimeType:
                data.mimeType,

            totalSize:
                data.totalSize,

            chunkSize:
                data.chunkSize,

            totalChunks:
                data.totalChunks,

            fileHash:
                data.fileHash

        });



    uploadManager.createUploadFolder(

        uploadId

    );



    return session;

};





// =====================================
// SAVE CHUNK
// =====================================

exports.uploadChunk = async({

    uploadId,

    chunkIndex,

    buffer

})=>{


    const session =
        await ChunkUpload.findOne({

            uploadId

        });



    if(!session){

        throw new Error(
            "Upload session not found"
        );

    }



    uploadManager.saveChunk(

        uploadId,

        chunkIndex,

        buffer

    );



    if(
        !session.uploadedChunks.includes(
            Number(chunkIndex)
        )
    ){

        session.uploadedChunks.push(

            Number(chunkIndex)

        );

    }



    session.progress =
        Math.floor(

            (
                session.uploadedChunks.length /
                session.totalChunks

            ) * 100

        );



    session.status =
        "uploading";



    await session.save();



    return session;

};





// =====================================
// GET STATUS
// =====================================

exports.getStatus = async(uploadId)=>{


    return await ChunkUpload.findOne({

        uploadId

    });


};





// =====================================
// MISSING CHUNKS
// =====================================

exports.getMissingChunks = async(uploadId)=>{


    const session =
        await ChunkUpload.findOne({

            uploadId

        });



    if(!session){

        throw new Error(
            "Upload not found"
        );

    }



    const missing=[];



    for(

        let i=0;

        i < session.totalChunks;

        i++

    ){

        if(
            !session.uploadedChunks.includes(i)
        ){

            missing.push(i);

        }

    }



    return missing;

};





// =====================================
// MERGE CHUNKS
// =====================================

// =====================================
// MERGE CHUNKS + HASH VERIFY
// =====================================

exports.completeUpload = async(uploadId)=>{


    const session =
        await ChunkUpload.findOne({

            uploadId

        });



    if(!session){

        throw new Error(
            "Upload session missing"
        );

    }



    if(
        session.uploadedChunks.length !==
        session.totalChunks
    ){

        throw new Error(
            "All chunks not uploaded"
        );

    }



    session.status =
        "merging";


    await session.save();



    const finalName =
        `${Date.now()}-${session.originalName}`;



    const finalPath =
        uploadManager.getFinalPath(
            finalName
        );



    const writeStream =
        fs.createWriteStream(
            finalPath
        );



    for(
        let i=0;
        i < session.totalChunks;
        i++
    ){

        const chunkPath =
            path.join(

                uploadManager.getUploadPath(uploadId),

                `${i}.chunk`

            );


        if(!fs.existsSync(chunkPath)){


            throw new Error(
                `Missing chunk ${i}`
            );

        }



        const buffer =
            fs.readFileSync(
                chunkPath
            );


        writeStream.write(
            buffer
        );

    }



    writeStream.end();



    await new Promise(
        resolve =>
        writeStream.on(
            "finish",
            resolve
        )
    );



    // =================================
    // SHA-256 HASH CALCULATION
    // =================================


    const hash =
        crypto
        .createHash("sha256")
        .update(
            fs.readFileSync(
                finalPath
            )
        )
        .digest("hex");



    console.log(
        "Generated Hash:",
        hash
    );



    // Compare client hash

    if(
        session.fileHash &&
        session.fileHash !== hash
    ){


        fs.unlinkSync(
            finalPath
        );


        session.status =
            "failed";


        await session.save();



        throw new Error(
            "File integrity verification failed"
        );

    }




    const file =
        await File.create({

            originalName:
                session.originalName,


            storedName:
                finalName,


            owner:
                session.owner,


            path:
                finalPath,


            mimeType:
                session.mimeType,


            size:
                session.totalSize,


            hash:


                hash,


            status:
                "ready"

        });




    session.storedName =
        finalName;


    session.finalPath =
        finalPath;


    session.status =
        "completed";



    await session.save();



    uploadManager.deleteUpload(
        uploadId
    );



    return file;

};





// =====================================
// CANCEL UPLOAD
// =====================================

exports.cancelUpload = async(uploadId)=>{


    uploadManager.deleteUpload(

        uploadId

    );


    return await ChunkUpload.findOneAndDelete({

        uploadId

    });


};