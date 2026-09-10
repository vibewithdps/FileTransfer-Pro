const fs = require("fs");

const File = require("../models/File");

const fileService = require("../services/fileService");



// =====================================
// CREATE SHARE LINK
// POST /api/share/:id
// =====================================

exports.createShareLink = async(req,res)=>{

    try{


        const token =
            await fileService.generateShareToken(

                req.params.id,

                req.user.id

            );



        const shareUrl =
            `${process.env.CLIENT_URL}/share/${token}`;



        res.status(200).json({

            success:true,

            message:
            "Share link created",

            token,

            shareUrl

        });



    }catch(error){


        res.status(500).json({

            success:false,

            message:error.message

        });


    }

};




// =====================================
// GET SHARED FILE INFO
// GET /api/share/:token
// =====================================

exports.getSharedFile = async(req,res)=>{


    try{


        const file =
            await fileService.getSharedFile(

                req.params.token

            );



        if(!file){


            return res.status(404).json({

                success:false,

                message:
                "Invalid or expired share link"

            });


        }



        res.status(200).json({

            success:true,

            data:{

                id:file._id,

                name:file.originalName,

                size:file.size,

                type:file.mimeType,

                createdAt:file.createdAt

            }

        });



    }catch(error){


        res.status(500).json({

            success:false,

            message:error.message

        });


    }


};




// =====================================
// DOWNLOAD SHARED FILE
// GET /api/share/download/:token
// =====================================

exports.downloadSharedFile = async(req,res)=>{


    try{


        const file =
            await fileService.getSharedFile(

                req.params.token

            );



        if(!file){


            return res.status(404).json({

                success:false,

                message:
                "Invalid share link"

            });


        }



        if(!fs.existsSync(file.path)){


            return res.status(404).json({

                success:false,

                message:
                "File not found"

            });


        }



        await fileService.increaseDownload(

            file._id

        );



        res.download(

            file.path,

            file.originalName

        );



    }catch(error){


        res.status(500).json({

            success:false,

            message:error.message

        });


    }

};