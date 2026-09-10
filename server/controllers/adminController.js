const User = require("../models/User");
const File = require("../models/File");



// =====================================
// GET ALL USERS
// GET /api/admin/users
// =====================================

const getAllUsers = async(req, res)=>{

    try{

        const users =
            await User.find({})
                .select("-password -refreshToken")
                .sort({
                    createdAt:-1
                });


        res.status(200).json({

            success:true,

            count:users.length,

            users

        });


    }
    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};





// =====================================
// GET SINGLE USER
// GET /api/admin/users/:id
// =====================================

const getUser = async(req, res)=>{

    try{

        const user =
            await User.findById(
                req.params.id
            )
            .select(
                "-password -refreshToken"
            );


        if(!user){

            return res.status(404).json({

                success:false,

                message:"User not found"

            });

        }


        res.status(200).json({

            success:true,

            user

        });


    }
    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};





// =====================================
// DELETE USER
// DELETE /api/admin/users/:id
// =====================================

const deleteUser = async(req, res)=>{

    try{

        const user =
            await User.findById(
                req.params.id
            );


        if(!user){

            return res.status(404).json({

                success:false,

                message:"User not found"

            });

        }


        // Prevent admin from deleting himself

        if(
            user._id.toString()
            ===
            req.user.id.toString()
        ){

            return res.status(400).json({

                success:false,

                message:
                "You cannot delete your own account"

            });

        }


        // Delete user's physical files

        const files =
            await File.find({

                owner:user._id

            });


        for(const file of files){

            const fs =
                require("fs");


            if(
                file.path &&
                fs.existsSync(file.path)
            ){

                fs.unlinkSync(
                    file.path
                );

            }

        }


        // Delete file records

        await File.deleteMany({

            owner:user._id

        });


        // Delete user

        await user.deleteOne();


        res.status(200).json({

            success:true,

            message:
            "User deleted successfully",

            deletedUserId:
            req.params.id

        });


    }
    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};





// =====================================
// UPDATE USER ROLE
// PUT /api/admin/users/:id/role
// =====================================

const updateUserRole = async(req, res)=>{

    try{

        const {
            role
        } = req.body;


        if(
            !["user","admin"].includes(role)
        ){

            return res.status(400).json({

                success:false,

                message:
                "Invalid role. Use user or admin"

            });

        }


        // Prevent changing own role

        if(
            req.params.id.toString()
            ===
            req.user.id.toString()
        ){

            return res.status(400).json({

                success:false,

                message:
                "You cannot change your own role"

            });

        }


        const user =
            await User.findByIdAndUpdate(

                req.params.id,

                {
                    role
                },

                {
                    new:true,
                    runValidators:true
                }

            )
            .select(
                "-password -refreshToken"
            );


        if(!user){

            return res.status(404).json({

                success:false,

                message:"User not found"

            });

        }


        res.status(200).json({

            success:true,

            message:
            "User role updated successfully",

            user

        });


    }
    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};





// =====================================
// ADMIN DASHBOARD STATS
// GET /api/admin/stats
// =====================================

const getStats = async(req, res)=>{

    try{

        // Total users

        const totalUsers =
            await User.countDocuments();


        // Active users

        const activeUsers =
            await User.countDocuments({

                isActive:true

            });


        // Verified users

        const verifiedUsers =
            await User.countDocuments({

                isVerified:true

            });


        // Total files

        const totalFiles =
            await File.countDocuments();


        // Total storage

        const storageResult =
            await File.aggregate([

                {
                    $match:{
                        status:"ready"
                    }
                },

                {
                    $group:{

                        _id:null,

                        totalSize:{
                            $sum:"$size"
                        }

                    }

                }

            ]);


        const totalStorage =
            storageResult.length > 0
                ? storageResult[0].totalSize
                : 0;


        // Admin count

        const totalAdmins =
            await User.countDocuments({

                role:"admin"

            });


        // Convert bytes

        const storageMB =
            (
                totalStorage /
                (1024 * 1024)
            ).toFixed(2);


        const storageGB =
            (
                totalStorage /
                (1024 * 1024 * 1024)
            ).toFixed(2);


        res.status(200).json({

            success:true,

            data:{

                totalUsers,

                activeUsers,

                verifiedUsers,

                totalAdmins,

                totalFiles,

                totalStorageBytes:
                    totalStorage,

                totalStorageMB:
                    Number(storageMB),

                totalStorageGB:
                    Number(storageGB)

            }

        });


    }
    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};





// =====================================
// EXPORT CONTROLLERS
// =====================================

module.exports = {

    getAllUsers,

    getUser,

    deleteUser,

    updateUserRole,

    getStats

};