const multer = require("multer");


// =====================================
// MULTER CONFIGURATION
// =====================================

// Store chunks in memory temporarily
// Then chunkService writes them to storage

const storage = multer.memoryStorage();



const upload = multer({

    storage,


    limits: {

        // Maximum chunk size
        // 20 MB

        fileSize:
            20 * 1024 * 1024

    },


    fileFilter: (req, file, cb) => {


        if(!file){

            return cb(
                new Error(
                    "No chunk file received"
                )
            );

        }


        cb(null, true);

    }


});



// =====================================
// UPLOAD CHUNK
// =====================================

exports.uploadChunk =
    upload.single("chunk");



// =====================================
// VALIDATE CHUNK
// =====================================

exports.validateChunk =
    (req,res,next)=>{


        try{


            if(!req.file){


                return res.status(400).json({

                    success:false,

                    message:
                    "Chunk file is required"

                });

            }



            const {
                chunkIndex
            } = req.body;



            if(
                chunkIndex === undefined ||
                chunkIndex === null
            ){

                return res.status(400).json({

                    success:false,

                    message:
                    "chunkIndex is required"

                });

            }



            next();


        }catch(error){


            res.status(500).json({

                success:false,

                message:error.message

            });


        }


    };



// =====================================
// ERROR HANDLER
// =====================================

exports.handleUploadError =
    (err,req,res,next)=>{


        if(err instanceof multer.MulterError){


            return res.status(400).json({

                success:false,

                message:
                err.message

            });


        }


        next(err);

    };