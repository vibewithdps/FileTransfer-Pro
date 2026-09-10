const fs = require("fs");
const path = require("path");


// =====================================
// STORAGE PATHS
// =====================================

const STORAGE_ROOT =
    path.join(
        process.cwd(),
        "storage"
    );


const TEMP_DIR =
    path.join(
        STORAGE_ROOT,
        "temp"
    );


const FILES_DIR =
    path.join(
        STORAGE_ROOT,
        "files"
    );



// =====================================
// INITIALIZE STORAGE
// =====================================

function initializeStorage(){

    [
        STORAGE_ROOT,
        TEMP_DIR,
        FILES_DIR
    ]
    .forEach(dir=>{

        if(!fs.existsSync(dir)){

            fs.mkdirSync(
                dir,
                {
                    recursive:true
                }
            );

        }

    });

}



// =====================================
// GET UPLOAD TEMP PATH
// =====================================

function getUploadPath(uploadId){

    return path.join(
        TEMP_DIR,
        uploadId
    );

}



// =====================================
// CREATE UPLOAD FOLDER
// =====================================

function createUploadFolder(uploadId){

    const folder =
        getUploadPath(uploadId);


    if(!fs.existsSync(folder)){

        fs.mkdirSync(
            folder,
            {
                recursive:true
            }
        );

    }


    return folder;

}



// =====================================
// SAVE CHUNK
// =====================================

function saveChunk(
    uploadId,
    chunkIndex,
    buffer
){

    const folder =
        createUploadFolder(uploadId);


    const chunkPath =
        path.join(
            folder,
            `${chunkIndex}.chunk`
        );


    fs.writeFileSync(
        chunkPath,
        buffer
    );


    return chunkPath;

}



// =====================================
// CHECK CHUNK EXISTS
// =====================================

function chunkExists(
    uploadId,
    chunkIndex
){

    const chunkPath =
        path.join(

            getUploadPath(uploadId),

            `${chunkIndex}.chunk`

        );


    return fs.existsSync(
        chunkPath
    );

}



// =====================================
// GET CHUNK LIST
// =====================================

function getChunks(uploadId){

    const folder =
        getUploadPath(uploadId);


    if(!fs.existsSync(folder)){

        return [];

    }


    return fs.readdirSync(folder)

        .filter(file =>
            file.endsWith(".chunk")
        )

        .map(file =>
            Number(
                file.replace(
                    ".chunk",
                    ""
                )
            )
        )

        .sort(
            (a,b)=>a-b
        );

}



// =====================================
// DELETE UPLOAD DATA
// =====================================

function deleteUpload(uploadId){

    const folder =
        getUploadPath(uploadId);


    if(fs.existsSync(folder)){


        fs.rmSync(

            folder,

            {
                recursive:true,
                force:true
            }

        );

    }

}



// =====================================
// FINAL FILE PATH
// =====================================

function getFinalPath(filename){


    if(!fs.existsSync(FILES_DIR)){


        fs.mkdirSync(

            FILES_DIR,

            {
                recursive:true
            }

        );

    }



    return path.join(

        FILES_DIR,

        filename

    );

}



// =====================================
// FILE EXISTS
// =====================================

function fileExists(filename){

    return fs.existsSync(

        getFinalPath(filename)

    );

}



// =====================================
// STORAGE INFO
// =====================================

function getStorageInfo(){

    return {

        root:
        STORAGE_ROOT,


        temp:
        TEMP_DIR,


        files:
        FILES_DIR

    };

}



// =====================================
// EXPORTS
// =====================================

module.exports = {


    initializeStorage,


    getUploadPath,


    createUploadFolder,


    saveChunk,


    chunkExists,


    getChunks,


    deleteUpload,


    getFinalPath,


    fileExists,


    getStorageInfo


};