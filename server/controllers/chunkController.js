const chunkService =
    require("../services/chunkService");



// =====================================
// CREATE UPLOAD SESSION
// POST /api/chunks/session
// =====================================

exports.createSession = async(req,res)=>{

    try{

        const session =
            await chunkService.createUploadSession({

                owner:req.user.id,

                originalName:
                    req.body.originalName,

                mimeType:
                    req.body.mimeType,

                totalSize:
                    req.body.totalSize,

                chunkSize:
                    req.body.chunkSize,

                totalChunks:
                    req.body.totalChunks,

                fileHash:
                    req.body.fileHash

            });



        res.status(201).json({

            success:true,

            message:
            "Upload session created",

            data:session

        });



    }catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};





// =====================================
// UPLOAD SINGLE CHUNK
// POST /api/chunks/upload/:uploadId
// =====================================

exports.uploadChunk = async(req,res)=>{


    try{


        const uploadId =
            req.params.uploadId;



        const chunkIndex =
            req.body.chunkIndex;



        if(!uploadId){


            return res.status(400).json({

                success:false,

                message:
                "Upload ID missing"

            });

        }



        if(chunkIndex === undefined){


            return res.status(400).json({

                success:false,

                message:
                "Chunk index missing"

            });

        }



        if(!req.file){


            return res.status(400).json({

                success:false,

                message:
                "Chunk file missing"

            });

        }




        const result =
            await chunkService.uploadChunk({

                uploadId,

                chunkIndex,

                buffer:
                req.file.buffer

            });




        res.status(200).json({

            success:true,

            message:
            "Chunk uploaded successfully",

            progress:
            result.progress,

            uploadedChunks:
            result.uploadedChunks

        });



    }catch(error){


        res.status(500).json({

            success:false,

            message:error.message

        });


    }


};





// =====================================
// MERGE COMPLETE UPLOAD
// POST /api/chunks/merge/:uploadId
// =====================================

exports.completeUpload = async(req,res)=>{


    try{


        const file =
            await chunkService.completeUpload(

                req.params.uploadId

            );



        res.status(200).json({

            success:true,

            message:
            "Upload completed successfully",

            data:file

        });



    }catch(error){


        res.status(500).json({

            success:false,

            message:error.message

        });


    }


};





// =====================================
// GET UPLOAD STATUS
// GET /api/chunks/status/:uploadId
// =====================================

exports.getStatus = async(req,res)=>{


    try{


        const data =
            await chunkService.getStatus(

                req.params.uploadId

            );



        res.status(200).json({

            success:true,

            data

        });



    }catch(error){


        res.status(500).json({

            success:false,

            message:error.message

        });


    }


};





// =====================================
// GET MISSING CHUNKS
// GET /api/chunks/missing/:uploadId
// =====================================

exports.getMissingChunks = async(req,res)=>{


    try{


        const missing =
            await chunkService.getMissingChunks(

                req.params.uploadId

            );



        res.status(200).json({

            success:true,

            missing

        });



    }catch(error){


        res.status(500).json({

            success:false,

            message:error.message

        });


    }


};





// =====================================
// CANCEL UPLOAD
// DELETE /api/chunks/cancel/:uploadId
// =====================================

exports.cancelUpload = async(req,res)=>{


    try{


        await chunkService.cancelUpload(

            req.params.uploadId

        );



        res.status(200).json({

            success:true,

            message:
            "Upload cancelled"

        });



    }catch(error){


        res.status(500).json({

            success:false,

            message:error.message

        });


    }


};