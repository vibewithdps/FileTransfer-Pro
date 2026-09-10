const jwt = require("jsonwebtoken");

const User = require("../models/User");




// =====================================
// VERIFY ACCESS TOKEN
// =====================================

const authenticate = async(req,res,next)=>{


    try{


        let token;



        // Check Authorization Header

        if(
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ){

            token =
            req.headers.authorization.split(" ")[1];

        }



        if(!token){

            return res.status(401).json({

                success:false,

                message:
                "Access denied. Token missing"

            });

        }





        // Verify JWT

        const decoded =
            jwt.verify(

                token,

                process.env.JWT_SECRET

            );





        // Find User

        const user =
            await User.findById(

                decoded.id

            )
            .select(

                "-password -refreshToken"

            );





        if(!user){


            return res.status(401).json({

                success:false,

                message:
                "User not found"

            });


        }





        // Attach user information

        req.user = {


            id:user._id,

            email:user.email,

            role:user.role


        };





        next();



    }
    catch(error){



        return res.status(401).json({

            success:false,

            message:
            "Invalid or expired token"

        });



    }


};








// =====================================
// ROLE AUTHORIZATION
// =====================================

const authorize = (...roles)=>{


    return(req,res,next)=>{


        if(
            !roles.includes(
                req.user.role
            )
        ){

            return res.status(403).json({

                success:false,

                message:
                "Access forbidden"

            });


        }


        next();


    };


};






// =====================================
// ADMIN ONLY ACCESS
// =====================================

const adminOnly =
authorize(
    "admin"
);






module.exports = {


    authenticate,

    authorize,

    adminOnly


};