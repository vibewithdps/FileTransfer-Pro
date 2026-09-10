const authService = require("../services/authService");
const User = require("../models/User");



// =====================================
// COOKIE OPTIONS
// =====================================

const refreshCookieOptions = {

    httpOnly:true,

    secure:
    process.env.NODE_ENV === "production",

    sameSite:"strict",

    maxAge:
    7 * 24 * 60 * 60 * 1000

};





// =====================================
// REGISTER USER
// =====================================

const register = async(req,res)=>{


    try{


        const user =
            await authService.registerUser(

                req.body

            );



        res.status(201).json({

            success:true,

            message:
            "User registered successfully",

            user

        });



    }
    catch(error){


        res.status(400).json({

            success:false,

            message:
            error.message

        });


    }


};






// =====================================
// LOGIN USER
// =====================================

const login = async(req,res)=>{


    try{


        const {

            email,

            password

        } = req.body;



        const result =
            await authService.loginUser(

                email,

                password

            );



        res.cookie(

            "refreshToken",

            result.refreshToken,

            refreshCookieOptions

        );



        res.status(200).json({

            success:true,

            message:
            "Login successful",

            user:
            result.user,

            accessToken:
            result.accessToken


        });



    }
    catch(error){


        res.status(401).json({

            success:false,

            message:
            error.message

        });


    }


};








// =====================================
// LOGOUT USER
// =====================================

const logout = async(req,res)=>{


    try{


        await authService.logoutUser(

            req.user.id

        );



        res.clearCookie(

            "refreshToken"

        );



        res.status(200).json({

            success:true,

            message:
            "Logout successful"

        });



    }
    catch(error){


        res.status(500).json({

            success:false,

            message:
            error.message

        });


    }


};








// =====================================
// REFRESH TOKEN
// =====================================

const refreshToken = async(req,res)=>{


    try{


        const token =
            req.cookies.refreshToken;



        const result =
            await authService.refreshAccessToken(

                token

            );



        res.status(200).json({

            success:true,

            accessToken:
            result.accessToken

        });



    }
    catch(error){


        res.status(401).json({

            success:false,

            message:
            error.message

        });


    }


};








// =====================================
// GET PROFILE
// =====================================

const profile = async(req,res)=>{


    try{


        const user =
            await User.findById(

                req.user.id

            )
            .select(

                "-password -refreshToken"

            );



        res.status(200).json({

            success:true,

            user

        });



    }
    catch(error){


        res.status(500).json({

            success:false,

            message:
            error.message

        });


    }


};








// =====================================
// UPDATE PROFILE
// PUT /api/auth/profile
// =====================================

const updateProfile = async(req,res)=>{


    try{


        const user =
            await authService.updateProfile(

                req.user.id,

                req.body

            );



        res.status(200).json({

            success:true,

            message:
            "Profile updated successfully",

            user

        });



    }
    catch(error){


        res.status(400).json({

            success:false,

            message:
            error.message

        });


    }


};








// =====================================
// CHANGE PASSWORD
// PUT /api/auth/change-password
// =====================================

const changePassword = async(req,res)=>{


    try{


        const {

            oldPassword,

            newPassword

        } = req.body;



        await authService.changePassword(

            req.user.id,

            oldPassword,

            newPassword

        );



        res.status(200).json({

            success:true,

            message:
            "Password changed successfully. Please login again."

        });



    }
    catch(error){


        res.status(400).json({

            success:false,

            message:
            error.message

        });


    }


};








module.exports = {


    register,

    login,

    logout,

    refreshToken,

    profile,

    updateProfile,

    changePassword


};