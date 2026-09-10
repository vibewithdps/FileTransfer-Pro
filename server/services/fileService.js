const fs = require("fs");
const crypto = require("crypto");

const File = require("../models/File");


// =====================================
// SAVE FILE RECORD
// =====================================

async function saveFile(
    file,
    userId
){

    const savedFile =
        await File.create({

            originalName:
                file.originalname,

            storedName:
                file.filename,

            owner:
                userId,

            path:
                file.path,

            mimeType:
                file.mimetype,

            size:
                file.size,

            status:
                "ready"

        });


    return savedFile;

}



// =====================================
// GET USER FILES
// =====================================

async function getUserFiles(userId){

    return await File.find({

        owner:userId

    })
    .sort({

        createdAt:-1

    });

}



// =====================================
// GET FILE
// =====================================

async function getFile(
    fileId,
    userId
){

    return await File.findOne({

        _id:fileId,

        owner:userId

    });

}



// =====================================
// DELETE FILE
// =====================================

async function deleteFile(
    fileId,
    userId
){

    const file =
        await File.findOne({

            _id:fileId,

            owner:userId

        });


    if(!file){

        throw new Error(
            "File not found"
        );

    }



    // Remove physical file

    if(
        fs.existsSync(file.path)
    ){

        fs.unlinkSync(
            file.path
        );

    }



    await file.deleteOne();



    return true;

}



// =====================================
// INCREMENT DOWNLOAD
// =====================================

async function increaseDownload(
    fileId
){

    return await File.findByIdAndUpdate(

        fileId,

        {
            $inc:{
                downloads:1
            }
        },

        {
            new:true
        }

    );

}



// =====================================
// CREATE SHARE TOKEN
// =====================================

async function generateShareToken(
    fileId,
    userId
){

    const file =
        await File.findOne({

            _id:fileId,

            owner:userId

        });


    if(!file){

        throw new Error(
            "File not found"
        );

    }



    const token =
        crypto
        .randomBytes(32)
        .toString("hex");



    file.shareToken =
        token;


    file.isPublic =
        true;


    await file.save();



    return token;

}



// =====================================
// GET FILE BY SHARE TOKEN
// =====================================

async function getSharedFile(token){

    return await File.findOne({

        shareToken:token,

        isPublic:true

    });

}



module.exports = {

    saveFile,

    getUserFiles,

    getFile,

    deleteFile,

    increaseDownload,

    generateShareToken,

    getSharedFile

};